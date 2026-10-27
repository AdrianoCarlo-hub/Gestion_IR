package mg.safidy.service;

import mg.safidy.dto.DeclarationImpayeeDTO;
import mg.safidy.dto.DeclarationIRSearchCriteria;
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
import mg.safidy.repository.PaiementRepository;
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

    /** Regle CT4 : CA HT minimal pour un contribuable au regime REEL_OBLIGATOIRE. */
    private static final long SEUIL_CA_REEL_OBLIGATOIRE = 400_000_000L;

    private final DeclarationIRRepository declarationRepository;
    private final ContribuableRepository contribuableRepository;
    private final AgentRepository agentRepository;
    private final LigneChargeRepository ligneChargeRepository;
    private final PaiementRepository paiementRepository;
    private final AcompteService acompteService;
    private final IRCalculationService irCalculationService;
    private final DeficitService deficitService;
    private final PenaliteService penaliteService;

    public DeclarationIRService(DeclarationIRRepository declarationRepository,
                                 ContribuableRepository contribuableRepository,
                                 AgentRepository agentRepository,
                                 LigneChargeRepository ligneChargeRepository,
                                 PaiementRepository paiementRepository,
                                 AcompteService acompteService,
                                 IRCalculationService irCalculationService,
                                 DeficitService deficitService,
                                 PenaliteService penaliteService) {
        this.declarationRepository = declarationRepository;
        this.contribuableRepository = contribuableRepository;
        this.agentRepository = agentRepository;
        this.ligneChargeRepository = ligneChargeRepository;
        this.paiementRepository = paiementRepository;
        this.acompteService = acompteService;
        this.irCalculationService = irCalculationService;
        this.deficitService = deficitService;
        this.penaliteService = penaliteService;
    }

    public List<DeclarationIR> lister() {
        return declarationRepository.findAll();
    }

    /**
     * Declarations de l'annee impayees : statut VALIDEE ou EN_RETARD avec
     * un reste a payer (IR du superieur aux paiements enregistres).
     */
    public List<DeclarationImpayeeDTO> listerImpayees(Integer annee) {
        int anneeCible = annee != null ? annee : LocalDate.now().getYear();
        return declarationRepository.findByAnneeOrderByDateCreationDesc(anneeCible).stream()
            .map(this::versImpaye)
            .filter(ligne -> ligne != null)
            .toList();
    }

    private DeclarationImpayeeDTO versImpaye(DeclarationIR d) {
        String statut = d.getStatut();
        if (!"VALIDEE".equals(statut) && !"EN_RETARD".equals(statut)) {
            return null;
        }
        long irDu = d.getIrDu() == null ? 0L : d.getIrDu();
        long dejaPaye = Math.min(
            paiementRepository.sommeRegleeParDeclaration(d.getIdDeclaration()), irDu);
        long reste = irDu - dejaPaye;
        if (reste <= 0) {
            return null;
        }
        Contribuable c = d.getContribuable();
        return new DeclarationImpayeeDTO(
            d.getIdDeclaration(),
            d.getAnnee(),
            c != null ? c.getNif() : null,
            c != null ? c.getRaisonSociale() : null,
            c != null ? c.getTelephone() : null,
            c != null ? c.getEmail() : null,
            irDu,
            dejaPaye,
            reste,
            d.getDateLimite(),
            statut);
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

    public List<DeclarationIR> rechercher(DeclarationIRSearchCriteria criteria) {
        return declarationRepository.searchByCriteria(criteria);
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

        verifierSeuilRegimeReel(d.getContribuable(), caHt);

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
     * Calcul complet de l'IR (formulaire d'ajustements supprime de l'UI) :
     *  - Reintegrations = anciennes saisies manuelles + penalites dues
     *  - Acomptes verses = automatiquement les acomptes provisionnels PAYE de l'annee
     *  - Imputation automatique du deficit disponible (min(benefice, dispo))
     *  - Generation automatique du deficit si base < 0
     *  - Solde total a payer = IR du + penalites + 1er acompte N+1 - acomptes verses
     *
     * Les parametres restent optionnels (compatibilite) : null = automatique.
     */
    @Transactional
    public DeclarationIR calculerEtEnregistrer(Long idDeclaration,
                                                Long totalReintegrationsManuelles,
                                                Long totalDeductions,
                                                Long acomptesVerses) {
        DeclarationIR d = trouverParId(idDeclaration);
        verifierModifiable(d);
        verifierSeuilRegimeReel(d);

        if (totalReintegrationsManuelles != null) {
            d.setReintegrationsManuelles(Math.max(0L, totalReintegrationsManuelles));
        }
        if (totalDeductions != null) {
            d.setTotalDeductions(Math.max(0L, totalDeductions));
        }

        return recalculer(d, acomptesVerses);
    }

    /**
     * Recalcul interne (sans verrou BROUILLON) : recalcule l'ensemble du bloc
     * de resultats a partir des donnees stockees. Idempotent.
     */
    private DeclarationIR recalculer(DeclarationIR d, Long acomptesVersesSaisis) {
        Long idDeclaration = d.getIdDeclaration();
        Long idContribuable = d.getContribuable().getIdContribuable();

        List<LigneCharge> charges = ligneChargeRepository.findByDeclarationIdDeclaration(idDeclaration);
        long totalCharges = charges.stream().mapToLong(LigneCharge::getMontantAr).sum();

        // Deficits : expiration de l'ancien exercice puis disponible
        deficitService.reverserImputation(idDeclaration);
        long deficitDisponible = deficitService.preparerDeficitsDisponibles(idContribuable);

        // Penalites dues : double comptage voulu (base imposable + montant a payer)
        long penalitesDues = penaliteService.totalDues(idDeclaration);

        // Acomptes verses : automatiques (sauf valeur forcee par l'appelant)
        long acomptesVerses = acomptesVersesSaisis != null
                ? Math.max(0L, acomptesVersesSaisis)
                : acompteService.totalAcomptesVerses(idContribuable, d.getAnnee());

        long reintegrations = nullSafe(d.getReintegrationsManuelles()) + penalitesDues;

        ResultatCalculIR r = irCalculationService.calculer(
                d.getContribuable(),
                d.getCaHt(),
                totalCharges,
                0L,
                reintegrations,
                d.getTotalDeductions(),
                deficitDisponible,
                acomptesVerses,
                d.getMoisActifs(),
                penalitesDues);

        // Enregistrer les resultats dans la declaration
        d.setTotalCharges(r.getTotalCharges());
        d.setResultatComptable(r.getResultatComptable());
        d.setTotalReintegrations(r.getTotalReintegrations());
        d.setPenaliteDueAr(penalitesDues);
        d.setTotalDeductions(r.getTotalDeductions());
        d.setDeficitImpute(r.getDeficitImpute());
        d.setBaseImposable(r.getBaseImposable());
        d.setTauxIr(r.getTauxApplique());
        d.setIrBrut(r.getIrBrut());
        d.setMinimumPerception(r.getMinimumPerception());
        d.setIrDu(r.getIrDu());
        d.setPremierAcompteAr(r.getPremierAcompte());
        d.setAcomptesVerses(r.getAcomptesVerses());
        d.setSoldeAPayer(r.getSoldeAPayer());
        d.setCreditImpot(r.getCreditImpot());

        DeclarationIR saved = declarationRepository.save(d);

        // Imputation automatique du deficit : min(benefice de l'annee, deficit dispo)
        if (r.getDeficitImpute() != null && r.getDeficitImpute() > 0) {
            deficitService.imputerAutomatique(idContribuable, idDeclaration, r.getDeficitImpute());
        }

        // Generation automatique du deficit si base avant deficit < 0
        if (r.getBaseAvantDeficit() != null && r.getBaseAvantDeficit() < 0) {
            long montantDeficit = r.getDeficitGenere() != null && r.getDeficitGenere() > 0
                    ? r.getDeficitGenere()
                    : Math.abs(r.getBaseAvantDeficit());
            if (montantDeficit > 0) {
                deficitService.creerAutomatique(idContribuable, d.getAnnee(), montantDeficit);
            }
        }

        return saved;
    }

    private long nullSafe(Long v) {
        return v == null ? 0L : Math.max(0L, v);
    }

    /**
     * Validation de la declaration :
     *  - depot apres le 15 mai de l'annee N+1 -> amende forfaitaire (100k a 200k)
     *    ET interets de retard (1 % par mois commence)
     *  - recalcul integre les penalites au bloc de resultats
     *  - generation automatique des acomptes provisionnels de l'annee N+1
     *    (2 x 50 % de l'IR de l'annee N)
     */
    @Transactional
    public DeclarationIR valider(Long idDeclaration) {
        DeclarationIR d = trouverParId(idDeclaration);
        if (!"BROUILLON".equals(d.getStatut())) {
            throw new BusinessException("Seule une declaration BROUILLON peut etre validee");
        }
        verifierSeuilRegimeReel(d);
        d.setStatut("VALIDEE");
        if (d.getDateDepot() == null) {
            d.setDateDepot(LocalDate.now());
        }
        DeclarationIR saved = declarationRepository.save(d);

        // Penalites automatiques si depot apres la date limite (regle CPF).
        boolean enRetard = saved.getDateLimite() != null
                && saved.getDateDepot() != null
                && saved.getDateDepot().isAfter(saved.getDateLimite());
        if (enRetard) {
            try {
                penaliteService.appliquerAmendeDepotTardif(
                        saved.getIdDeclaration(), saved.getDateDepot());
            } catch (BusinessException ignore) {
                // pas de penalite applicable
            }
            try {
                penaliteService.appliquerInteretsRetard(
                        saved.getIdDeclaration(), saved.getDateDepot());
            } catch (BusinessException ignore) {
                // pas d'IR du a majorer
            }
        }

        // Recalcul pour integrer les penalites (base imposable + solde total a payer)
        boolean dejaCalculee = (saved.getIrDu() != null && saved.getIrDu() > 0)
                || (saved.getCaHt() != null && saved.getCaHt() > 0);
        if (dejaCalculee) {
            saved = recalculer(saved, null);
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

    /**
     * Regle CT4 : un contribuable au regime REEL_OBLIGATOIRE doit avoir
     * un CA HT superieur ou egal a 400 000 000 Ar.
     */
    private void verifierSeuilRegimeReel(DeclarationIR d) {
        verifierSeuilRegimeReel(d.getContribuable(), d.getCaHt());
    }

    private void verifierSeuilRegimeReel(Contribuable c, Long caHt) {
        long valeur = caHt == null ? 0L : caHt;
        if (c != null && "REEL_OBLIGATOIRE".equals(c.getRegime())
                && valeur < SEUIL_CA_REEL_OBLIGATOIRE) {
            throw new BusinessException(
                "Un contribuable au régime REEL_OBLIGATOIRE doit avoir un CA HT ≥ 400 000 000 Ar.");
        }
    }
}
