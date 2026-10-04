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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class DeficitService {

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

    @Transactional
    public Deficit creer(Long idContribuable, Integer anneeOrigine, Long montant) {
        if (montant == null || montant <= 0) {
            throw new BusinessException("Montant du deficit > 0 requis");
        }
        Contribuable c = contribuableRepository.findById(idContribuable)
                .orElseThrow(() -> new BusinessException("Contribuable introuvable"));

        int dureeReport = getDureeReport();
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
        int anneeCourante = java.time.LocalDate.now().getYear();
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

    private int getDureeReport() {
        return parametreRepository.findByCode("DUREE_REPORT_DEFICIT")
                .map(p -> p.getValeur().intValue())
                .orElse(5);
    }
}
