package mg.safidy.service;

import mg.safidy.dto.ResultatCalculIR;
import mg.safidy.exception.BusinessException;
import mg.safidy.model.Agent;
import mg.safidy.model.Contribuable;
import mg.safidy.model.DeclarationIR;
import mg.safidy.model.LigneCharge;
import mg.safidy.repository.AgentRepository;
import mg.safidy.repository.ContribuableRepository;
import mg.safidy.repository.DeclarationIRRepository;
import mg.safidy.repository.LigneChargeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Service
public class DeclarationIRService {

    private static final List<String> CATEGORIES_VALIDES =
        Arrays.asList("SALAIRE", "LOYER", "ELECTRICITE", "TRANSPORT", "AUTRE");

    private static final long SEUIL_REEL_OBLIGATOIRE = 400_000_000L;

    private final DeclarationIRRepository declarationRepository;
    private final ContribuableRepository contribuableRepository;
    private final AgentRepository agentRepository;
    private final LigneChargeRepository ligneChargeRepository;
    private final AcompteService acompteService;
    private final IRCalculationService irCalculationService;
    private final DeficitService deficitService;
    private final PenaliteService penaliteService;

    public DeclarationIRService(DeclarationIRRepository declarationRepository,
                                 ContribuableRepository contribuableRepository,
                                 AgentRepository agentRepository,
                                 LigneChargeRepository ligneChargeRepository,
                                 AcompteService acompteService,
                                 IRCalculationService irCalculationService,
                                 DeficitService deficitService,
                                 PenaliteService penaliteService) {
        this.declarationRepository = declarationRepository;
        this.contribuableRepository = contribuableRepository;
        this.agentRepository = agentRepository;
        this.ligneChargeRepository = ligneChargeRepository;
        this.acompteService = acompteService;
        this.irCalculationService = irCalculationService;
        this.deficitService = deficitService;
        this.penaliteService = penaliteService;
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

        int anneeCourante = LocalDate.now().getYear();

        if (c.getDateImmatriculation() != null
                && annee < c.getDateImmatriculation().getYear()) {
            throw new BusinessException(
                "L annee doit etre >= a l annee d immatriculation ("
                + c.getDateImmatriculation().getYear() + ")");
        }

        if (annee > anneeCourante) {
            throw new BusinessException(
                "L annee ne peut pas etre dans le futur (max " + anneeCourante + ")");
        }

        if (dateDebut == null || dateFin == null || !dateFin.isAfter(dateDebut)) {
            throw new BusinessException("Dates invalides (date fin > date debut)");
        }
        long mois = java.time.temporal.ChronoUnit.MONTHS.between(dateDebut, dateFin);
        if (mois > 18) {
            throw new BusinessException("Exercice > 18 mois interdit");
        }
        if (mois < 11) {
            throw new BusinessException("Exercice < 12 mois interdit (sauf premier exercice)");
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
        d.setTauxIr(new BigDecimal("20"));
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

        Contribuable c = d.getContribuable();
        if (c != null && "REEL_OBLIGATOIRE".equals(c.getRegime())) {
            if (caHt < SEUIL_REEL_OBLIGATOIRE) {
                throw new BusinessException(
                    "Regime REEL OBLIGATOIRE : le CA doit etre >= "
                    + String.format("%,d", SEUIL_REEL_OBLIGATOIRE).replace(',', ' ')
                    + " Ar");
            }
        }

        d.setCaHt(caHt);
        return declarationRepository.save(d);
    }

    @Transactional
    public DeclarationIR modifierMoisActifs(Long idDeclaration, Integer moisActifs) {
        DeclarationIR d = trouverParId(idDeclaration);
        verifierModifiable(d);

        if (moisActifs == null || moisActifs < 0 || moisActifs > 12) {
            throw new BusinessException("Mois actifs : valeur de 0 a 12 requise");
        }

        d.setMoisActifs(moisActifs);
        return declarationRepository.save(d);
    }

    @Transactional
    public LigneCharge ajouterCharge(Long idDeclaration, String categorie, String categorieLibre,
                                      Long montantAr, String justificatifRef) {
        DeclarationIR d = trouverParId(idDeclaration);
        verifierModifiable(d);

        if (montantAr == null || montantAr <= 0) {
            throw new BusinessException("Montant de charge > 0 requis");
        }
        if (categorie == null || !CATEGORIES_VALIDES.contains(categorie)) {
            throw new BusinessException("Categorie de charge invalide");
        }
        if ("AUTRE".equals(categorie)) {
            if (categorieLibre == null || categorieLibre.isBlank()) {
                throw new BusinessException("Precisez la categorie libre");
            }
            if (categorieLibre.trim().length() < 2 || categorieLibre.trim().length() > 50) {
                throw new BusinessException("Categorie libre : 2 a 50 caracteres");
            }
        } else {
            categorieLibre = null;
        }

        LigneCharge lc = new LigneCharge();
        lc.setDeclaration(d);
        lc.setCategorie(categorie);
        lc.setCategorieLibre(categorieLibre);
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

    /**
     * Calcul complet de l'IR avec :
     *  - Reintegration automatique des charges sans facture
     *  - Imputation automatique du deficit disponible
     *  - Generation automatique de deficit si base < 0
     */
    @Transactional
    public DeclarationIR calculerEtEnregistrer(Long idDeclaration,
                                                Long totalReintegrationsManuelles,
                                                Long totalDeductions,
                                                Long acomptesVerses) {
        DeclarationIR d = trouverParId(idDeclaration);
        verifierModifiable(d);

        List<LigneCharge> charges = ligneChargeRepository.findByDeclarationIdDeclaration(idDeclaration);

        // Total des charges
        long totalCharges = charges.stream().mapToLong(LigneCharge::getMontantAr).sum();

        // Charges sans facture (a reintegrer automatiquement)
        long totalChargesSansFacture = charges.stream()
                .filter(c -> c.getJustificatifRef() == null || c.getJustificatifRef().isBlank())
                .mapToLong(LigneCharge::getMontantAr)
                .sum();

        // Deficit disponible
        long deficitDisponible = deficitService.calculerTotalDisponible(
                d.getContribuable().getIdContribuable());

        // Calcul
        ResultatCalculIR r = irCalculationService.calculer(
                d.getContribuable(),
                d.getCaHt(),
                totalCharges,
                totalChargesSansFacture,
                totalReintegrationsManuelles,
                totalDeductions,
                deficitDisponible,
                acomptesVerses,
                d.getMoisActifs());

        // Enregistrer les resultats dans la declaration
        d.setTotalCharges(r.getTotalCharges());
        d.setResultatComptable(r.getResultatComptable());
        d.setTotalReintegrations(r.getTotalReintegrations());
        d.setTotalDeductions(r.getTotalDeductions());
        d.setDeficitImpute(r.getDeficitImpute());
        d.setBaseImposable(r.getBaseImposable());
        d.setTauxIr(r.getTauxApplique());
        d.setIrBrut(r.getIrBrut());
        d.setMinimumPerception(r.getMinimumPerception());
        d.setIrDu(r.getIrDu());
        d.setAcomptesVerses(r.getAcomptesVerses());
        d.setSoldeAPayer(r.getSoldeAPayer());
        d.setCreditImpot(r.getCreditImpot());

        DeclarationIR saved = declarationRepository.save(d);

        // Imputation automatique du deficit si applicable
        if (r.getDeficitImpute() != null && r.getDeficitImpute() > 0) {
            deficitService.imputerAutomatique(
                    d.getContribuable().getIdContribuable(),
                    idDeclaration,
                    r.getDeficitImpute());
        }

        // Generation automatique de deficit si base < 0
        if (r.getDeficitGenere() != null && r.getDeficitGenere() > 0) {
            deficitService.creerAutomatique(
                    d.getContribuable().getIdContribuable(),
                    d.getAnnee(),
                    r.getDeficitGenere());
        }

        return saved;
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

        // Penalite automatique si depot apres la date limite (regle CPF).
        if (saved.getDateLimite() != null
                && saved.getDateDepot() != null
                && saved.getDateDepot().isAfter(saved.getDateLimite())) {
            try {
                penaliteService.appliquerAmendeDepotTardif(
                        saved.getIdDeclaration(), saved.getDateDepot());
            } catch (BusinessException ignore) {
                // pas de penalite applicable
            }
        }

        if (saved.getIrDu() != null && saved.getIrDu() > 0) {
            // Regle : les 2 acomptes provisionnels de l'annee suivante (50 % chacun)
            acompteService.creerAcomptesProvisionnels(
                    saved.getContribuable().getIdContribuable(),
                    saved.getAnnee() + 1,
                    saved.getIrDu());
        }
        return saved;
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
