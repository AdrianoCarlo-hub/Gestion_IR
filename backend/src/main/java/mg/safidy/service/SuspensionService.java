package mg.safidy.service;

import mg.safidy.dto.DetailSuspensionDTO;
import mg.safidy.dto.ImpactFiscalDTO;
import mg.safidy.dto.SituationActiviteDTO;
import mg.safidy.exception.BusinessException;
import mg.safidy.model.Acompte;
import mg.safidy.model.Agent;
import mg.safidy.model.Contribuable;
import mg.safidy.model.DeclarationIR;
import mg.safidy.model.Penalite;
import mg.safidy.model.SecteurActivite;
import mg.safidy.model.SuspensionActivite;
import mg.safidy.repository.AcompteRepository;
import mg.safidy.repository.AgentRepository;
import mg.safidy.repository.ContribuableRepository;
import mg.safidy.repository.DeclarationIRRepository;
import mg.safidy.repository.PenaliteRepository;
import mg.safidy.repository.SuspensionActiviteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Arret / reprise d'activite (CDI + CPF malgache) :
 *  - VEILLEUSE : arret temporaire, acomptes suspendus, minimum au prorata
 *  - CESSATION : cessation definitive (exigibilite immediate), puis RADIE
 *  - REPRISE   : reprise d'activite, acomptes recalcules / reactives
 */
@Service
public class SuspensionService {

    public static final String TYPE_VEILLEUSE = "VEILLEUSE";
    public static final String TYPE_CESSATION = "CESSATION";
    public static final String TYPE_REPRISE = "REPRISE";

    private final SuspensionActiviteRepository suspensionRepository;
    private final ContribuableRepository contribuableRepository;
    private final AgentRepository agentRepository;
    private final AcompteRepository acompteRepository;
    private final DeclarationIRRepository declarationRepository;
    private final PenaliteRepository penaliteRepository;
    private final IRCalculationService irCalculationService;

    public SuspensionService(SuspensionActiviteRepository suspensionRepository,
                              ContribuableRepository contribuableRepository,
                              AgentRepository agentRepository,
                              AcompteRepository acompteRepository,
                              DeclarationIRRepository declarationRepository,
                              PenaliteRepository penaliteRepository,
                              IRCalculationService irCalculationService) {
        this.suspensionRepository = suspensionRepository;
        this.contribuableRepository = contribuableRepository;
        this.agentRepository = agentRepository;
        this.acompteRepository = acompteRepository;
        this.declarationRepository = declarationRepository;
        this.penaliteRepository = penaliteRepository;
        this.irCalculationService = irCalculationService;
    }

    public List<SuspensionActivite> listerParContribuable(Long idContribuable) {
        return suspensionRepository.findByContribuableIdContribuableOrderByDateArretDesc(idContribuable);
    }

    public SituationActiviteDTO situation(Long idContribuable) {
        Contribuable c = contribuableRepository.findById(idContribuable)
                .orElseThrow(() -> new BusinessException("Contribuable introuvable"));

        SituationActiviteDTO dto = new SituationActiviteDTO();
        dto.setIdContribuable(idContribuable);
        dto.setStatutActuel(c.getStatut());
        dto.setMoisActifs(12);

        List<SuspensionActivite> liste =
                suspensionRepository.findByContribuableIdContribuableOrderByDateArretDesc(idContribuable);
        for (SuspensionActivite s : liste) {
            dto.getHistorique().add(DetailSuspensionDTO.depuis(s));
            if ("EN_COURS".equals(s.getStatut())) {
                dto.setIdSuspensionEnCours(s.getIdSuspension());
                dto.setTypeEvenementEnCours(s.getTypeEvenement());
            }
        }
        return dto;
    }

    @Transactional
    public void changerStatutDepuisSuspensions(Long idContribuable, String nouveauStatut, Long idAgent,
                                                LocalDate dateArret, String motif, LocalDate dateReprise) {
        Contribuable c = contribuableRepository.findById(idContribuable)
                .orElseThrow(() -> new BusinessException("Contribuable introuvable"));
        Agent agent = agentRepository.findById(idAgent)
                .orElseThrow(() -> new BusinessException("Agent introuvable"));

        if ("SUSPENDU".equals(nouveauStatut)) {
            if (!"ACTIF".equals(c.getStatut())) {
                throw new BusinessException("Seul un contribuable actif peut etre suspendu");
            }
            if (suspensionRepository.findByContribuableIdContribuableAndStatut(idContribuable, "EN_COURS")
                    .isPresent()) {
                throw new BusinessException("Un evenement d'arret est deja en cours");
            }

            if (dateArret == null || dateArret.isAfter(LocalDate.now())) {
                throw new BusinessException("Date d'arret invalide");
            }
            if (motif == null || !(motif.equals("MANQUE_ACTIVITE") || motif.equals("TRAVAUX")
                    || motif.equals("SAISON") || motif.equals("DIFFICULTE_FINANCIERE")
                    || motif.equals("REORGANISATION") || motif.equals("AUTRE"))) {
                throw new BusinessException("Motif d'arret invalide");
            }

            int delai = (int) getLong("DELAI_DECLARATION_ARRET", 20L);
            SuspensionActivite evenement = new SuspensionActivite();
            evenement.setContribuable(c);
            evenement.setDateArret(dateArret);
            evenement.setMotif(motif);
            evenement.setStatut("EN_COURS");
            evenement.setTypeEvenement(TYPE_VEILLEUSE);
            evenement.setDateLimiteDeclaration(dateArret.plusDays(delai));
            evenement.setCarteFiscaleRestituee(false);
            evenement.setAgentArret(agent);
            evenement.setDateCreation(LocalDateTime.now());
            suspensionRepository.save(evenement);

            c.setStatut("SUSPENDU");
            contribuableRepository.save(c);
            suspendreAcomptesAvenir(c, dateArret);
            return;
        }

        if ("ACTIF".equals(nouveauStatut)) {
            if (!"SUSPENDU".equals(c.getStatut())) {
                throw new BusinessException("Seul un contribuable suspendu peut etre reactive");
            }

            SuspensionActivite evenement = suspensionRepository
                    .findByContribuableIdContribuableAndStatut(idContribuable, "EN_COURS")
                    .orElse(null);
            if (dateReprise == null || dateReprise.isAfter(LocalDate.now())) {
                throw new BusinessException("Date de reprise invalide");
            }
            if (evenement != null) {
                if (!TYPE_VEILLEUSE.equals(evenement.getTypeEvenement())) {
                    throw new BusinessException("L'evenement en cours ne peut pas etre reactive");
                }
                if (!dateReprise.isAfter(evenement.getDateArret())) {
                    throw new BusinessException("La date de reprise doit etre posterieure a la date d'arret");
                }
                evenement.setDateReprise(dateReprise);
                evenement.setStatut("TERMINEE");
                evenement.setTypeEvenement(TYPE_REPRISE);
                evenement.setAgentReprise(agent);
                suspensionRepository.save(evenement);
            } else {
                if (dateArret == null || !dateArret.isBefore(dateReprise)) {
                    throw new BusinessException("La date d'arret historique est requise et doit preceder la reprise");
                }
                if (motif == null || !(motif.equals("MANQUE_ACTIVITE") || motif.equals("TRAVAUX")
                        || motif.equals("SAISON") || motif.equals("DIFFICULTE_FINANCIERE")
                        || motif.equals("REORGANISATION") || motif.equals("AUTRE"))) {
                    throw new BusinessException("Motif d'arret invalide");
                }

                SuspensionActivite evenementHistorique = new SuspensionActivite();
                evenementHistorique.setContribuable(c);
                evenementHistorique.setDateArret(dateArret);
                evenementHistorique.setDateReprise(dateReprise);
                evenementHistorique.setMotif(motif);
                evenementHistorique.setStatut("TERMINEE");
                evenementHistorique.setTypeEvenement(TYPE_REPRISE);
                evenementHistorique.setCarteFiscaleRestituee(false);
                evenementHistorique.setAgentArret(agent);
                evenementHistorique.setAgentReprise(agent);
                evenementHistorique.setDateCreation(LocalDateTime.now());
                suspensionRepository.save(evenementHistorique);
            }

            c.setStatut("ACTIF");
            contribuableRepository.save(c);
            recalculerAcomptesReprise(c, dateReprise);
            return;
        }

        throw new BusinessException("Statut invalide : seuls ACTIF et SUSPENDU sont autorises");
    }

    // =====================================================
    // A. MISE EN VEILLEUSE
    // =====================================================

    @Transactional
    public SuspensionActivite declarerArret(Long idContribuable, LocalDate dateArret,
                                             String motif, String refDeclaration, Long idAgent) {
        Contribuable c = contribuableRepository.findById(idContribuable)
                .orElseThrow(() -> new BusinessException("Contribuable introuvable"));

        if (!"ACTIF".equals(c.getStatut())) {
            throw new BusinessException("Contribuable non actif : " + c.getStatut());
        }
        if (suspensionRepository.findByContribuableIdContribuableAndStatut(idContribuable, "EN_COURS").isPresent()) {
            throw new BusinessException("Cette entreprise est deja suspendue");
        }
        if (dateArret == null || dateArret.isAfter(LocalDate.now())) {
            throw new BusinessException("Date d'arret invalide");
        }
        if (motif == null || !(motif.equals("MANQUE_ACTIVITE") || motif.equals("TRAVAUX")
                || motif.equals("SAISON") || motif.equals("DIFFICULTE_FINANCIERE")
                || motif.equals("REORGANISATION") || motif.equals("AUTRE"))) {
            throw new BusinessException("Motif d'arret invalide");
        }

        Agent agent = agentRepository.findById(idAgent)
                .orElseThrow(() -> new BusinessException("Agent introuvable"));

        ImpactFiscalDTO impact = calculerImpactFiscalVeilleuse(idContribuable, dateArret);
        int delai = (int) getLong("DELAI_DECLARATION_ARRET", 20L);

        SuspensionActivite s = new SuspensionActivite();
        s.setContribuable(c);
        s.setDateArret(dateArret);
        s.setDateReprise(null);
        s.setMotif(motif);
        s.setRefDeclaration(refDeclaration);
        s.setStatut("EN_COURS");
        s.setTypeEvenement(TYPE_VEILLEUSE);
        s.setDateLimiteDeclaration(dateArret.plusDays(delai));
        s.setCarteFiscaleRestituee(false);
        s.setImpactMinimumProrata(impact.getMinimumProrata());
        s.setImpactAcompteSuspendu(impact.getAcompteSuspendu());
        s.setImpactCreditImpot(impact.getCreditImpot());
        s.setAgentArret(agent);
        s.setDateCreation(LocalDateTime.now());
        SuspensionActivite saved = suspensionRepository.save(s);

        c.setStatut("VEILLEUSE");
        contribuableRepository.save(c);

        suspendreAcomptesAvenir(c, dateArret);
        return saved;
    }

    public ImpactFiscalDTO calculerImpactFiscalVeilleuse(Long idContribuable, LocalDate dateArret) {
        Contribuable c = contribuableRepository.findById(idContribuable)
                .orElseThrow(() -> new BusinessException("Contribuable introuvable"));

        int moisActifs = dateArret == null ? 12 : dateArret.getMonthValue();
        int annee = dateArret == null ? LocalDate.now().getYear() : dateArret.getYear();

        SecteurActivite secteur = c.getSecteur();
        long fixe = secteur == null || secteur.getMinFixeAr() == null ? 0L : secteur.getMinFixeAr();
        BigDecimal pct = secteur == null || secteur.getMinPctCa() == null
                ? BigDecimal.ZERO : secteur.getMinPctCa();

        long caRealise = declarationRepository
                .findByContribuableIdContribuableAndAnnee(idContribuable, annee)
                .map(d -> d.getCaHt() == null ? 0L : d.getCaHt())
                .orElse(0L);

        long fixeProrata = BigDecimal.valueOf(fixe)
                .multiply(BigDecimal.valueOf(moisActifs))
                .divide(BigDecimal.valueOf(12), 0, RoundingMode.HALF_UP)
                .longValue();
        long variable = pct.multiply(BigDecimal.valueOf(caRealise))
                .setScale(0, RoundingMode.HALF_UP)
                .longValue();
        long minimum = fixeProrata + variable;

        long acompteSuspendu = 0L;
        long acomptesVerses = 0L;
        List<Acompte> acomptes = acompteRepository
                .findByContribuableIdContribuableAndAnneeOrderByNumeroAsc(idContribuable, annee);
        for (Acompte a : acomptes) {
            if ("PAYE".equals(a.getStatut())) {
                acomptesVerses += a.getMontantAr() == null ? 0L : a.getMontantAr();
            }
            if (a.getDateEcheance() != null && dateArret != null
                    && a.getDateEcheance().isAfter(dateArret)
                    && ("A_PAYER".equals(a.getStatut()) || "EN_RETARD".equals(a.getStatut()))) {
                acompteSuspendu += a.getMontantAr() == null ? 0L : a.getMontantAr();
            }
        }
        long credit = Math.max(acomptesVerses - minimum, 0L);

        ImpactFiscalDTO dto = new ImpactFiscalDTO();
        dto.setIdContribuable(idContribuable);
        dto.setDateArret(dateArret);
        dto.setMoisActifs(moisActifs);
        dto.setMinimumProrata(minimum);
        dto.setAcompteSuspendu(acompteSuspendu);
        dto.setCreditImpot(credit);
        return dto;
    }

    private void suspendreAcomptesAvenir(Contribuable c, LocalDate dateArret) {
        int anneeCourante = LocalDate.now().getYear();
        List<Acompte> acomptes = acompteRepository
                .findByContribuableIdContribuableAndAnneeOrderByNumeroAsc(
                        c.getIdContribuable(), anneeCourante);
        for (Acompte a : acomptes) {
            if (("A_PAYER".equals(a.getStatut()) || "EN_RETARD".equals(a.getStatut()))
                    && a.getDateEcheance() != null
                    && a.getDateEcheance().isAfter(dateArret)) {
                a.setStatut("SUSPENDU");
                acompteRepository.save(a);
            }
        }
    }

    // =====================================================
    // B. REPRISE D'ACTIVITE
    // =====================================================

    @Transactional
    public SuspensionActivite declarerReprise(Long idSuspension, LocalDate dateReprise, Long idAgent) {
        SuspensionActivite s = suspensionRepository.findById(idSuspension)
                .orElseThrow(() -> new BusinessException("Suspension introuvable"));
        if (!"EN_COURS".equals(s.getStatut())) {
            throw new BusinessException("Cette suspension est deja cloturee");
        }
        if (!TYPE_VEILLEUSE.equals(s.getTypeEvenement())) {
            throw new BusinessException("Seule une mise en veilleuse peut faire l'objet d'une reprise");
        }
        if (dateReprise == null || !dateReprise.isAfter(s.getDateArret())) {
            throw new BusinessException("Date de reprise doit etre posterieure a la date d'arret");
        }
        if (dateReprise.isAfter(LocalDate.now())) {
            throw new BusinessException("Date de reprise dans le futur interdite");
        }

        Agent agent = agentRepository.findById(idAgent)
                .orElseThrow(() -> new BusinessException("Agent introuvable"));

        s.setDateReprise(dateReprise);
        s.setStatut("TERMINEE");
        s.setTypeEvenement(TYPE_REPRISE);
        s.setAgentReprise(agent);
        SuspensionActivite saved = suspensionRepository.save(s);

        Contribuable c = s.getContribuable();
        c.setStatut("ACTIF");
        contribuableRepository.save(c);

        recalculerAcomptesReprise(c, dateReprise);
        return saved;
    }

    private void recalculerAcomptesReprise(Contribuable c, LocalDate dateReprise) {
        int anneeReprise = dateReprise.getYear();

        Long irN1 = declarationRepository
                .findByContribuableIdContribuableAndAnnee(c.getIdContribuable(), anneeReprise - 1)
                .map(DeclarationIR::getIrDu)
                .orElse(null);

        BigDecimal taux = irCalculationService.getTaux("TAUX_ACOMPTE", new BigDecimal("50"));

        List<Acompte> acomptes = acompteRepository
                .findByContribuableIdContribuableAndAnneeOrderByNumeroAsc(
                        c.getIdContribuable(), anneeReprise);

        for (Acompte a : acomptes) {
            if ("PAYE".equals(a.getStatut())) {
                continue;
            }
            if (irN1 != null && irN1 > 0) {
                long montant = BigDecimal.valueOf(irN1)
                        .multiply(taux)
                        .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP)
                        .longValue();
                a.setBaseIrN1(irN1);
                a.setMontantAr(montant);
            }
            if ("SUSPENDU".equals(a.getStatut())) {
                a.setStatut("A_PAYER");
            }
            acompteRepository.save(a);
        }
    }

    // =====================================================
    // C. CESSATION DEFINITIVE
    // =====================================================

    @Transactional
    public SuspensionActivite declarerCessation(Long idContribuable, LocalDate dateArret,
                                                 String motif, String justificatif, Long idAgent) {
        Contribuable c = contribuableRepository.findById(idContribuable)
                .orElseThrow(() -> new BusinessException("Contribuable introuvable"));
        if ("RADIE".equals(c.getStatut())) {
            throw new BusinessException("Contribuable deja radie");
        }
        if (dateArret == null || dateArret.isAfter(LocalDate.now())) {
            throw new BusinessException("Date de cessation invalide");
        }
        if (motif == null || motif.isBlank()) {
            motif = "AUTRE";
        }

        Agent agent = agentRepository.findById(idAgent)
                .orElseThrow(() -> new BusinessException("Agent introuvable"));

        int delai = (int) getLong("DELAI_DECLARATION_CESSATION", 10L);

        SuspensionActivite s = new SuspensionActivite();
        s.setContribuable(c);
        s.setDateArret(dateArret);
        s.setMotif(motif);
        s.setJustificatifRef(justificatif);
        s.setStatut("EN_COURS");
        s.setTypeEvenement(TYPE_CESSATION);
        s.setDateLimiteDeclaration(dateArret.plusDays(delai));
        s.setCarteFiscaleRestituee(false);
        s.setAgentArret(agent);
        s.setDateCreation(LocalDateTime.now());
        SuspensionActivite saved = suspensionRepository.save(s);

        c.setStatut("CESSE");
        contribuableRepository.save(c);

        suspendreAcomptesAvenir(c, dateArret);
        return saved;
    }

    @Transactional
    public SuspensionActivite genererAttestationRadiation(Long idSuspension) {
        SuspensionActivite s = suspensionRepository.findById(idSuspension)
                .orElseThrow(() -> new BusinessException("Suspension introuvable"));
        if (!TYPE_CESSATION.equals(s.getTypeEvenement())) {
            throw new BusinessException("L'attestation de radiation ne concerne qu'une cessation");
        }

        long reste = resteARecouvrer(s.getContribuable().getIdContribuable());
        if (reste > 0) {
            throw new BusinessException("Impossible : reste a recouvrer de "
                    + reste + " Ar. Solder la dette avant radiation.");
        }

        String numero = "RAD-" + LocalDate.now().getYear() + "-" + s.getIdSuspension();
        s.setAttestationRadiationNumero(numero);
        s.setStatut("TERMINEE");
        s.setCarteFiscaleRestituee(true);
        SuspensionActivite saved = suspensionRepository.save(s);

        Contribuable c = s.getContribuable();
        c.setStatut("RADIE");
        contribuableRepository.save(c);
        return saved;
    }

    private long resteARecouvrer(Long idContribuable) {
        long reste = 0L;
        for (DeclarationIR d : declarationRepository
                .findByContribuableIdContribuableOrderByAnneeDesc(idContribuable)) {
            if (d.getSoldeAPayer() != null && d.getSoldeAPayer() > 0
                    && !"BROUILLON".equals(d.getStatut())) {
                reste += d.getSoldeAPayer();
            }
        }
        for (Acompte a : acompteRepository
                .findByContribuableIdContribuableOrderByAnneeAsc(idContribuable)) {
            if (("A_PAYER".equals(a.getStatut()) || "EN_RETARD".equals(a.getStatut()))
                    && a.getMontantAr() != null) {
                reste += a.getMontantAr();
            }
        }
        for (Penalite p : penaliteRepository
                .findByDeclarationContribuableIdContribuableOrderByDateCreationDesc(idContribuable)) {
            if ("DUE".equals(p.getStatut()) && p.getMontantAr() != null) {
                reste += p.getMontantAr();
            }
        }
        return reste;
    }

    // =====================================================
    // Annulation
    // =====================================================

    @Transactional
    public SuspensionActivite annuler(Long idSuspension) {
        SuspensionActivite s = suspensionRepository.findById(idSuspension)
                .orElseThrow(() -> new BusinessException("Suspension introuvable"));
        s.setStatut("ANNULEE");
        SuspensionActivite saved = suspensionRepository.save(s);
        Contribuable c = s.getContribuable();
        if (!"RADIE".equals(c.getStatut())) {
            c.setStatut("ACTIF");
            contribuableRepository.save(c);
        }
        return saved;
    }

    private long getLong(String code, long defaut) {
        return irCalculationService.getTaux(code, BigDecimal.valueOf(defaut)).longValue();
    }
}
