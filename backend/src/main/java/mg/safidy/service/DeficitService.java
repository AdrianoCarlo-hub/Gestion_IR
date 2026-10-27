package mg.safidy.service;

import mg.safidy.exception.BusinessException;
import mg.safidy.model.Contribuable;
import mg.safidy.model.Deficit;
import mg.safidy.model.ParametreFiscal;
import mg.safidy.model.UtilisationDeficit;
import mg.safidy.model.DeclarationIR;
import mg.safidy.repository.ContribuableRepository;
import mg.safidy.repository.DeficitRepository;
import mg.safidy.repository.ParametreFiscalRepository;
import mg.safidy.repository.UtilisationDeficitRepository;
import mg.safidy.repository.DeclarationIRRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
public class DeficitService {

    private static final int DUREE_REPORT_PAR_DEFAUT = 5;

    private final DeficitRepository deficitRepository;
    private final UtilisationDeficitRepository utilisationRepository;
    private final ContribuableRepository contribuableRepository;
    private final DeclarationIRRepository declarationRepository;
    private final ParametreFiscalRepository parametreRepository;

    public DeficitService(DeficitRepository deficitRepository,
                           UtilisationDeficitRepository utilisationRepository,
                           ContribuableRepository contribuableRepository,
                           DeclarationIRRepository declarationRepository,
                           ParametreFiscalRepository parametreRepository) {
        this.deficitRepository = deficitRepository;
        this.utilisationRepository = utilisationRepository;
        this.contribuableRepository = contribuableRepository;
        this.declarationRepository = declarationRepository;
        this.parametreRepository = parametreRepository;
    }

    public List<Deficit> listerTout() {
        return deficitRepository.findAll();
    }

    public List<Deficit> listerParContribuable(Long idContribuable) {
        return deficitRepository.findByContribuableIdContribuableOrderByAnneeOrigineAsc(idContribuable);
    }

    public List<Deficit> listerActifs(Long idContribuable) {
        return deficitRepository.findByContribuableIdContribuableAndStatutOrderByAnneeOrigineAsc(
                idContribuable, "ACTIF");
    }

    public Deficit trouverParId(Long id) {
        return deficitRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Deficit introuvable : id=" + id));
    }

    /**
     * Total du deficit disponible (somme des soldes actifs non expires).
     */
    public long calculerTotalDisponible(Long idContribuable) {
        int anneeCourante = LocalDate.now().getYear();
        return deficitRepository
                .findByContribuableIdContribuableAndStatutOrderByAnneeOrigineAsc(idContribuable, "ACTIF")
                .stream()
                .filter(d -> d.getAnneeExpiration() >= anneeCourante)
                .sorted(Comparator.comparingInt(Deficit::getAnneeOrigine))
                .mapToLong(Deficit::getSolde)
                .sum();
    }

    /**
     * Cree un deficit automatiquement a la suite d'une declaration deficitaire.
     * Duree de report : parametre DUREE_REPORT_DEFICIT (5 ans par defaut).
     * Idempotent : un seul deficit par annee d'origine, montant recalcule
     * tant qu'aucune imputation n'a ete effectuee.
     */
    @Transactional
    public Deficit creerAutomatique(Long idContribuable, Integer anneeOrigine, Long montant) {
        if (montant == null || montant <= 0) {
            throw new BusinessException("Montant du deficit > 0 requis");
        }
        Contribuable c = contribuableRepository.findById(idContribuable)
                .orElseThrow(() -> new BusinessException("Contribuable introuvable"));

        int dureeReport = dureeReport();

        Optional<Deficit> existant = deficitRepository
                .findByContribuableIdContribuableOrderByAnneeOrigineAsc(idContribuable)
                .stream()
                .filter(d -> d.getAnneeOrigine().equals(anneeOrigine))
                .findFirst();

        if (existant.isPresent()) {
            Deficit d = existant.get();
            boolean intact = d.getMontantUtilise() == null || d.getMontantUtilise() == 0L;
            if (!intact) {
                // Deja impute sur d'autres exercices : on ne modifie pas l'historique.
                return d;
            }
            d.setMontantInitial(montant);
            d.setMontantUtilise(0L);
            d.setSolde(montant);
            d.setAnneeExpiration(anneeOrigine + dureeReport);
            d.setStatut("ACTIF");
            return deficitRepository.save(d);
        }

        Deficit d = new Deficit();
        d.setContribuable(c);
        d.setAnneeOrigine(anneeOrigine);
        d.setMontantInitial(montant);
        d.setMontantUtilise(0L);
        d.setSolde(montant);
        d.setAnneeExpiration(anneeOrigine + dureeReport);
        d.setStatut("ACTIF");
        d.setDateCreation(LocalDateTime.now());
        return deficitRepository.save(d);
    }

    /**
     * Annule les imputations deja enregistrees sur une declaration.
     * Permet un recalcul idempotent : l'ancien imputation est restituee
     * aux deficits avant un nouveau passage.
     */
    @Transactional
    public void reverserImputation(Long idDeclaration) {
        if (idDeclaration == null) return;
        List<UtilisationDeficit> utilisations =
                utilisationRepository.findByDeclarationIdDeclaration(idDeclaration);
        for (UtilisationDeficit u : utilisations) {
            Deficit d = u.getDeficit();
            if (d != null) {
                long utilise = Math.max(0L,
                        (d.getMontantUtilise() == null ? 0L : d.getMontantUtilise())
                        - (u.getMontantImpute() == null ? 0L : u.getMontantImpute()));
                d.setMontantUtilise(utilise);
                d.setSolde(Math.max(0L, d.getMontantInitial() - utilise));
                if (d.getSolde() > 0 && "EPUISE".equals(d.getStatut())) {
                    d.setStatut("ACTIF");
                }
                deficitRepository.save(d);
            }
            utilisationRepository.delete(u);
        }
    }

    /**
     * Expirations puis mise a jour du total disponible (a appeler avant calcul).
     */
    @Transactional
    public long preparerDeficitsDisponibles(Long idContribuable) {
        expirerDeficits();
        return calculerTotalDisponible(idContribuable);
    }

    public int dureeReport() {
        return parametreRepository.findByCode("DUREE_REPORT_DEFICIT")
                .map(ParametreFiscal::getValeur)
                .map(java.math.BigDecimal::intValue)
                .orElse(DUREE_REPORT_PAR_DEFAUT);
    }

    /**
     * Impute automatiquement le deficit disponible sur la declaration.
     * FIFO : du plus ancien au plus recent.
     * Retourne le montant total impute.
     */
    @Transactional
    public long imputerAutomatique(Long idContribuable, Long idDeclaration, long baseImposableAvantDeficit) {
        if (baseImposableAvantDeficit <= 0) return 0L;

        DeclarationIR decl = declarationRepository.findById(idDeclaration)
                .orElseThrow(() -> new BusinessException("Declaration introuvable"));

        int anneeCourante = LocalDate.now().getYear();
        List<Deficit> deficits = deficitRepository
                .findByContribuableIdContribuableAndStatutOrderByAnneeOrigineAsc(idContribuable, "ACTIF")
                .stream()
                .filter(d -> d.getAnneeExpiration() >= anneeCourante)
                .filter(d -> d.getSolde() > 0)
                .sorted(Comparator.comparingInt(Deficit::getAnneeOrigine))
                .toList();

        long reste = baseImposableAvantDeficit;

        for (Deficit d : deficits) {
            if (reste <= 0) break;

            long aImputer = Math.min(reste, d.getSolde());
            if (aImputer <= 0) continue;

            // Enregistrer l'utilisation
            UtilisationDeficit u = new UtilisationDeficit();
            u.setDeficit(d);
            u.setDeclaration(decl);
            u.setMontantImpute(aImputer);
            u.setDateCreation(LocalDateTime.now());
            utilisationRepository.save(u);

            // Mettre a jour le deficit
            d.setMontantUtilise(d.getMontantUtilise() + aImputer);
            d.setSolde(d.getMontantInitial() - d.getMontantUtilise());
            if (d.getSolde() <= 0) {
                d.setSolde(0L);
                d.setStatut("EPUISE");
            }
            deficitRepository.save(d);

            reste -= aImputer;
        }

        return baseImposableAvantDeficit - reste;
    }

    @Transactional
    public Deficit creer(Long idContribuable, Integer anneeOrigine, Long montant) {
        return creerAutomatique(idContribuable, anneeOrigine, montant);
    }

    @Transactional
    public UtilisationDeficit imputer(Long idDeficit, Long idDeclaration, Long montant) {
        if (montant == null || montant <= 0) {
            throw new BusinessException("Montant impute > 0 requis");
        }
        Deficit d = trouverParId(idDeficit);
        if (!"ACTIF".equals(d.getStatut())) {
            throw new BusinessException("Deficit non actif : " + d.getStatut());
        }
        if (montant > d.getSolde()) {
            throw new BusinessException("Montant impute > solde disponible");
        }
        DeclarationIR decl = declarationRepository.findById(idDeclaration)
                .orElseThrow(() -> new BusinessException("Declaration introuvable"));

        UtilisationDeficit u = new UtilisationDeficit();
        u.setDeficit(d);
        u.setDeclaration(decl);
        u.setMontantImpute(montant);
        u.setDateCreation(LocalDateTime.now());
        UtilisationDeficit saved = utilisationRepository.save(u);

        d.setMontantUtilise(d.getMontantUtilise() + montant);
        d.setSolde(d.getMontantInitial() - d.getMontantUtilise());
        if (d.getSolde() <= 0) {
            d.setSolde(0L);
            d.setStatut("EPUISE");
        }
        deficitRepository.save(d);
        return saved;
    }

    @Transactional
    public int expirerDeficits() {
        int anneeCourante = LocalDate.now().getYear();
        List<Deficit> actifs = deficitRepository.findAll();
        int n = 0;
        for (Deficit d : actifs) {
            if ("ACTIF".equals(d.getStatut()) && d.getAnneeExpiration() < anneeCourante) {
                d.setStatut("EXPIRE");
                deficitRepository.save(d);
                n++;
            }
        }
        return n;
    }
}
