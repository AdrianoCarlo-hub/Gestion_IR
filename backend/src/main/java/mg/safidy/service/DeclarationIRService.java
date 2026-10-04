package mg.safidy.service;

import mg.safidy.dto.ResultatCalculIR;
import mg.safidy.exception.BusinessException;
import mg.safidy.model.Acompte;
import mg.safidy.model.Agent;
import mg.safidy.model.Contribuable;
import mg.safidy.model.DeclarationIR;
import mg.safidy.model.Deficit;
import mg.safidy.model.LigneCharge;
import mg.safidy.repository.AcompteRepository;
import mg.safidy.repository.AgentRepository;
import mg.safidy.repository.ContribuableRepository;
import mg.safidy.repository.DeclarationIRRepository;
import mg.safidy.repository.DeficitRepository;
import mg.safidy.repository.LigneChargeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class DeclarationIRService {

    private final DeclarationIRRepository declarationRepository;
    private final ContribuableRepository contribuableRepository;
    private final AgentRepository agentRepository;
    private final LigneChargeRepository ligneChargeRepository;
    private final DeficitRepository deficitRepository;
    private final AcompteRepository acompteRepository;
    private final IRCalculationService irCalculationService;

    public DeclarationIRService(DeclarationIRRepository declarationRepository,
                                 ContribuableRepository contribuableRepository,
                                 AgentRepository agentRepository,
                                 LigneChargeRepository ligneChargeRepository,
                                 DeficitRepository deficitRepository,
                                 AcompteRepository acompteRepository,
                                 IRCalculationService irCalculationService) {
        this.declarationRepository = declarationRepository;
        this.contribuableRepository = contribuableRepository;
        this.agentRepository = agentRepository;
        this.ligneChargeRepository = ligneChargeRepository;
        this.deficitRepository = deficitRepository;
        this.acompteRepository = acompteRepository;
        this.irCalculationService = irCalculationService;
    }

    public List<DeclarationIR> lister() {
        return declarationRepository.findAll();
    }

    public DeclarationIR trouverParId(Long id) {
        return declarationRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Declaration introuvable : id=" + id));
    }

    public List<DeclarationIR> listerParContribuable(Long idContribuable) {
        return declarationRepository.findByContribuableIdContribuableOrderByAnneeDesc(idContribuable);
    }

    public List<DeclarationIR> listerParAnnee(Integer annee) {
        return declarationRepository.findByAnneeOrderByDateCreationDesc(annee);
    }

    public List<LigneCharge> listerCharges(Long idDeclaration) {
        return ligneChargeRepository.findByDeclarationIdDeclaration(idDeclaration);
    }

    @Transactional
    public DeclarationIR creerBrouillon(Long idContribuable, Integer annee,
                                         LocalDate dateDebut, LocalDate dateFin,
                                         Long idAgent) {
        Contribuable c = contribuableRepository.findById(idContribuable)
                .orElseThrow(() -> new BusinessException("Contribuable introuvable"));

        if (!"ACTIF".equals(c.getStatut())) {
            throw new BusinessException("Contribuable non actif : " + c.getStatut());
        }

        if (declarationRepository.existsByContribuableIdContribuableAndAnnee(idContribuable, annee)) {
            throw new BusinessException("Exercice deja declare : " + annee);
        }

        if (dateDebut == null || dateFin == null || !dateFin.isAfter(dateDebut)) {
            throw new BusinessException("Dates invalides");
        }
        long mois = java.time.temporal.ChronoUnit.MONTHS.between(dateDebut, dateFin);
        if (mois > 18) {
            throw new BusinessException("Exercice > 18 mois interdit");
        }

        Agent agent = agentRepository.findById(idAgent)
                .orElseThrow(() -> new BusinessException("Agent introuvable"));

        DeclarationIR d = new DeclarationIR();
        d.setContribuable(c);
        d.setAnnee(annee);
        d.setDateDebut(dateDebut);
        d.setDateFin(dateFin);
        d.setCaHt(0L);
        d.setTotalCharges(0L);
        d.setResultatComptable(0L);
        d.setTotalReintegrations(0L);
        d.setTotalDeductions(0L);
        d.setDeficitImpute(0L);
        d.setBaseImposable(0L);
        d.setIrBrut(0L);
        d.setMinimumPerception(0L);
        d.setIrDu(0L);
        d.setAcomptesVerses(0L);
        d.setSoldeAPayer(0L);
        d.setCreditImpot(0L);
        d.setMoisActifs(12);
        d.setStatut("BROUILLON");
        d.setAgent(agent);
        d.setDateLimite(LocalDate.of(annee + 1, 5, 15));
        d.setDateCreation(LocalDateTime.now());

        return declarationRepository.save(d);
    }

    @Transactional
    public DeclarationIR modifierCaHt(Long idDeclaration, Long caHt) {
        DeclarationIR d = trouverParId(idDeclaration);
        verifierModifiable(d);
        if (caHt == null || caHt < 0) {
            throw new BusinessException("CA HT invalide");
        }
        d.setCaHt(caHt);
        return declarationRepository.save(d);
    }

    @Transactional
    public LigneCharge ajouterCharge(Long idDeclaration, String categorie, String libelle,
                                      Long montantAr, String justificatifRef) {
        DeclarationIR d = trouverParId(idDeclaration);
        verifierModifiable(d);
        if (montantAr == null || montantAr <= 0) {
            throw new BusinessException("Montant de charge > 0 requis");
        }
        LigneCharge lc = new LigneCharge();
        lc.setDeclaration(d);
        lc.setCategorie(categorie);
        lc.setLibelle(libelle);
        lc.setMontantAr(montantAr);
        lc.setJustificatifRef(justificatifRef);
        return ligneChargeRepository.save(lc);
    }

    @Transactional
    public void supprimerCharge(Long idLigne) {
        LigneCharge lc = ligneChargeRepository.findById(idLigne)
                .orElseThrow(() -> new BusinessException("Ligne de charge introuvable"));
        verifierModifiable(lc.getDeclaration());
        ligneChargeRepository.delete(lc);
    }

    @Transactional
    public DeclarationIR calculerEtEnregistrer(Long idDeclaration,
                                                Long totalReintegrations,
                                                Long totalDeductions,
                                                Long acomptesVerses) {
        DeclarationIR d = trouverParId(idDeclaration);
        verifierModifiable(d);

        long totalCharges = ligneChargeRepository.findByDeclarationIdDeclaration(idDeclaration)
                .stream().mapToLong(LigneCharge::getMontantAr).sum();

        long deficitDisponible = deficitRepository
                .findByContribuableIdContribuableAndStatutOrderByAnneeOrigineAsc(
                        d.getContribuable().getIdContribuable(), "ACTIF")
                .stream().mapToLong(Deficit::getSolde).sum();

        ResultatCalculIR r = irCalculationService.calculer(
                d.getContribuable(),
                d.getCaHt(),
                totalCharges,
                totalReintegrations,
                totalDeductions,
                deficitDisponible,
                acomptesVerses);

        d.setTotalCharges(r.getTotalCharges());
        d.setResultatComptable(r.getResultatComptable());
        d.setTotalReintegrations(r.getTotalReintegrations());
        d.setTotalDeductions(r.getTotalDeductions());
        d.setDeficitImpute(r.getDeficitImpute());
        d.setBaseImposable(r.getBaseImposable());
        d.setIrBrut(r.getIrBrut());
        d.setMinimumPerception(r.getMinimumPerception());
        d.setIrDu(r.getIrDu());
        d.setAcomptesVerses(r.getAcomptesVerses());
        d.setSoldeAPayer(r.getSoldeAPayer());
        d.setCreditImpot(r.getCreditImpot());

        return declarationRepository.save(d);
    }

    @Transactional
    public DeclarationIR valider(Long idDeclaration) {
        DeclarationIR d = trouverParId(idDeclaration);
        if (!"BROUILLON".equals(d.getStatut())) {
            throw new BusinessException("Seule une declaration BROUILLON peut etre validee");
        }
        d.setStatut("VALIDEE");
        if (d.getDateDepot() == null) {
            d.setDateDepot(LocalDate.now());
        }
        DeclarationIR saved = declarationRepository.save(d);

        if (saved.getIrDu() != null && saved.getIrDu() > 0) {
            genererAcomptesAnneeSuivante(saved);
        }
        return saved;
    }

    private void genererAcomptesAnneeSuivante(DeclarationIR d) {
        int anneeN1 = d.getAnnee() + 1;
        BigDecimal taux = irCalculationService.getTaux("TAUX_ACOMPTE", new BigDecimal("50"));
        long moitie = BigDecimal.valueOf(d.getIrDu())
                .multiply(taux)
                .divide(BigDecimal.valueOf(100), 0, java.math.RoundingMode.HALF_UP)
                .longValue();

        for (int numero = 1; numero <= 2; numero++) {
            if (acompteRepository.findByContribuableIdContribuableAndAnneeAndNumero(
                    d.getContribuable().getIdContribuable(), anneeN1, numero).isPresent()) {
                continue;
            }
            Acompte a = new Acompte();
            a.setContribuable(d.getContribuable());
            a.setAnnee(anneeN1);
            a.setNumero(numero);
            a.setTauxPct(50);
            a.setBaseIrN1(d.getIrDu());
            a.setMontantAr(moitie);
            a.setDateEcheance(LocalDate.of(anneeN1, numero == 1 ? 5 : 11, 15));
            a.setStatut("A_PAYER");
            a.setDateCreation(LocalDateTime.now());
            acompteRepository.save(a);
        }
    }

    @Transactional
    public DeclarationIR marquerPayee(Long idDeclaration) {
        DeclarationIR d = trouverParId(idDeclaration);
        if ("BROUILLON".equals(d.getStatut())) {
            throw new BusinessException("Valider la declaration avant de la marquer payee");
        }
        d.setStatut("PAYEE");
        return declarationRepository.save(d);
    }

    private void verifierModifiable(DeclarationIR d) {
        if (!"BROUILLON".equals(d.getStatut())) {
            throw new BusinessException("Declaration verrouillee (statut=" + d.getStatut() + ")");
        }
    }
}
