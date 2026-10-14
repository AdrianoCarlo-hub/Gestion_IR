package mg.safidy.service;

import mg.safidy.exception.BusinessException;
import mg.safidy.model.Contribuable;
import mg.safidy.model.Deficit;
import mg.safidy.model.UtilisationDeficit;
import mg.safidy.model.DeclarationIR;
import mg.safidy.repository.ContribuableRepository;
import mg.safidy.repository.DeficitRepository;
import mg.safidy.repository.UtilisationDeficitRepository;
import mg.safidy.repository.DeclarationIRRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
public class DeficitService {

    private final DeficitRepository deficitRepository;
    private final UtilisationDeficitRepository utilisationRepository;
    private final ContribuableRepository contribuableRepository;
    private final DeclarationIRRepository declarationRepository;

    public DeficitService(DeficitRepository deficitRepository,
                           UtilisationDeficitRepository utilisationRepository,
                           ContribuableRepository contribuableRepository,
                           DeclarationIRRepository declarationRepository) {
        this.deficitRepository = deficitRepository;
        this.utilisationRepository = utilisationRepository;
        this.contribuableRepository = contribuableRepository;
        this.declarationRepository = declarationRepository;
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
     * Duree de report : 5 ans (parametrable).
     */
    @Transactional
    public Deficit creerAutomatique(Long idContribuable, Integer anneeOrigine, Long montant) {
        if (montant == null || montant <= 0) {
            throw new BusinessException("Montant du deficit > 0 requis");
        }
        Contribuable c = contribuableRepository.findById(idContribuable)
                .orElseThrow(() -> new BusinessException("Contribuable introuvable"));

        // Verifier qu'il n'y a pas deja un deficit pour cette annee
        boolean existe = deficitRepository
                .findByContribuableIdContribuableOrderByAnneeOrigineAsc(idContribuable)
                .stream()
                .anyMatch(d -> d.getAnneeOrigine().equals(anneeOrigine));
        if (existe) {
            throw new BusinessException("Un deficit existe deja pour l annee " + anneeOrigine);
        }

        int dureeReport = 5;
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
