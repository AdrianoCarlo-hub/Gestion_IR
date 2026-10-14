package mg.safidy.service;

import mg.safidy.dto.DetailPenaliteDTO;
import mg.safidy.dto.SituationPenalitesDTO;
import mg.safidy.exception.BusinessException;
import mg.safidy.model.Acompte;
import mg.safidy.model.DeclarationIR;
import mg.safidy.model.ParametreFiscal;
import mg.safidy.model.Penalite;
import mg.safidy.repository.AcompteRepository;
import mg.safidy.repository.DeclarationIRRepository;
import mg.safidy.repository.ParametreFiscalRepository;
import mg.safidy.repository.PenaliteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Penalites (CDI / CPF malgache) :
 *  - AMENDE_DEPOT       : amende fixe selon le CA (depot tardif)
 *  - MAJORATION         : majoration de retard de paiement (selon la taille)
 *  - AMENDE_SPECIFIQUE  : infractions specifiques (80 %, 40 %, 0,5 % CA)
 *  - remise gracieuse / annulation
 */
@Service
public class PenaliteService {

    private static final long CA_400M = 400_000_000L;
    private static final long CA_200M = 200_000_000L;
    private static final long CA_100M = 100_000_000L;
    private static final long CA_50M = 50_000_000L;

    private final PenaliteRepository penaliteRepository;
    private final DeclarationIRRepository declarationRepository;
    private final ParametreFiscalRepository parametreRepository;
    private final AcompteRepository acompteRepository;

    public PenaliteService(PenaliteRepository penaliteRepository,
                            DeclarationIRRepository declarationRepository,
                            ParametreFiscalRepository parametreRepository,
                            AcompteRepository acompteRepository) {
        this.penaliteRepository = penaliteRepository;
        this.declarationRepository = declarationRepository;
        this.parametreRepository = parametreRepository;
        this.acompteRepository = acompteRepository;
    }

    public List<Penalite> listerParDeclaration(Long idDeclaration) {
        return penaliteRepository.findByDeclarationIdDeclaration(idDeclaration);
    }

    // =====================================================
    // Type A - AMENDE FIXE DE DEPOT TARDIF
    // =====================================================

    @Transactional
    public Penalite appliquerAmendeDepotTardif(Long idDeclaration, LocalDate dateDepot) {
        DeclarationIR d = charger(idDeclaration);

        LocalDate limite = d.getDateLimite() != null
                ? d.getDateLimite()
                : LocalDate.of(d.getAnnee() + 1, 5, 15);

        if (dateDepot == null || !dateDepot.isAfter(limite)) {
            throw new BusinessException("Aucun retard de depot a penaliser");
        }

        // Idempotent : une seule amende de depot par declaration
        List<Penalite> deja = penaliteRepository
                .findByDeclarationIdDeclarationAndStatut(idDeclaration, "DUE");
        for (Penalite p : deja) {
            if ("AMENDE_DEPOT".equals(p.getType())) {
                return p;
            }
        }

        long ca = d.getCaHt() == null ? 0L : d.getCaHt();
        long montant;
        String article;
        if (ca >= CA_400M) {
            montant = getLong("AMENDE_DEPOT_CA_400M", 200_000L);
            article = "CDI art. 05.01.05";
        } else if (ca >= CA_200M) {
            montant = getLong("AMENDE_DEPOT_CA_200M", 100_000L);
            article = "CDI art. 05.01.05";
        } else if (ca >= CA_50M) {
            montant = getLong("AMENDE_DEPOT_CA_50M", 50_000L);
            article = "CDI art. 05.01.05";
        } else {
            montant = getLong("AMENDE_DEPOT_CA_INF", 20_000L);
            article = "CDI art. 05.01.05";
        }

        Penalite p = new Penalite();
        p.setDeclaration(d);
        p.setType("AMENDE_DEPOT");
        p.setMotif("DEPOT_TARDIF");
        p.setNbMois(0);
        p.setTauxPct(BigDecimal.ZERO);
        p.setBaseCalculAr(ca);
        p.setMontantAr(montant);
        p.setArticleRef(article);
        p.setDateLimite(limite);
        p.setDateRegularisation(dateDepot);
        p.setStatut("DUE");
        p.setDateCreation(LocalDateTime.now());
        return penaliteRepository.save(p);
    }

    // Compatibilite avec l'endpoint existant /amende-depot
    @Transactional
    public Penalite calculerAmendeDepotTardif(Long idDeclaration, LocalDate dateDepot) {
        return appliquerAmendeDepotTardif(idDeclaration, dateDepot);
    }

    // =====================================================
    // Type B - MAJORATION DE RETARD DE PAIEMENT
    // =====================================================

    @Transactional
    public Penalite appliquerMajorationRetard(Long idDeclaration, LocalDate datePaiement) {
        DeclarationIR d = charger(idDeclaration);
        if (d.getSoldeAPayer() == null || d.getSoldeAPayer() <= 0) {
            throw new BusinessException("Aucun solde a majorer");
        }

        LocalDate limite = d.getDateLimite() != null
                ? d.getDateLimite()
                : LocalDate.of(d.getAnnee() + 1, 5, 15);
        if (datePaiement == null || !datePaiement.isAfter(limite)) {
            throw new BusinessException("Aucun retard de paiement a majorer");
        }

        long ca = d.getCaHt() == null ? 0L : d.getCaHt();
        BigDecimal tauxPremier;
        String taille;
        if (ca >= CA_400M) {
            tauxPremier = getTaux("MAJORATION_GRANDE_1ER", new BigDecimal("3"));
            taille = "GRANDE";
        } else if (ca >= CA_100M) {
            tauxPremier = getTaux("MAJORATION_MOYENNE_1ER", new BigDecimal("2"));
            taille = "MOYENNE";
        } else {
            tauxPremier = getTaux("MAJORATION_PETITE_1ER", new BigDecimal("1"));
            taille = "PETITE";
        }
        BigDecimal tauxSuivant = getTaux("MAJORATION_MOIS_SUIV", new BigDecimal("1"));
        long plancher = getLong("MAJORATION_PLANCHER", 10_000L);

        long mois = calculerMoisRetard(limite, datePaiement);
        if (mois < 1) mois = 1;

        BigDecimal tauxTotal = tauxPremier.add(tauxSuivant.multiply(BigDecimal.valueOf(mois - 1)));
        long montant = BigDecimal.valueOf(d.getSoldeAPayer())
                .multiply(tauxTotal)
                .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP)
                .longValue();
        if (montant < plancher) montant = plancher;

        Penalite p = new Penalite();
        p.setDeclaration(d);
        p.setType("MAJORATION");
        p.setMotif("RETARD_PAIEMENT_" + taille);
        p.setNbMois((int) mois);
        p.setTauxPct(tauxTotal);
        p.setBaseCalculAr(d.getSoldeAPayer());
        p.setMontantAr(montant);
        p.setArticleRef("CPF art. 05.02.03");
        p.setDateLimite(limite);
        p.setDateRegularisation(datePaiement);
        p.setStatut("DUE");
        p.setDateCreation(LocalDateTime.now());
        return penaliteRepository.save(p);
    }

    // Compatibilite avec l'ancien endpoint /interet-retard
    @Transactional
    public Penalite calculerInteretRetard(Long idDeclaration, LocalDate datePaiement) {
        return appliquerMajorationRetard(idDeclaration, datePaiement);
    }

    @Transactional
    public Penalite calculerInteretRetardAcompte(Long idAcompte, LocalDate datePaiement) {
        Acompte a = acompteRepository.findById(idAcompte)
                .orElseThrow(() -> new BusinessException("Acompte introuvable"));

        if (a.getDateEcheance() == null || datePaiement == null
                || !datePaiement.isAfter(a.getDateEcheance())) {
            return null;
        }

        long mois = calculerMoisRetard(a.getDateEcheance(), datePaiement);
        if (mois <= 0) {
            return null;
        }

        long interet = BigDecimal.valueOf(a.getMontantAr() == null ? 0L : a.getMontantAr())
                .multiply(BigDecimal.valueOf(mois))
                .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP)
                .longValue();

        DeclarationIR declarationAssociee = a.getContribuable() != null && a.getContribuable().getIdContribuable() != null
                ? declarationRepository.findByContribuableIdContribuableAndAnnee(
                        a.getContribuable().getIdContribuable(), a.getAnnee())
                        .orElse(null)
                : null;

        Penalite p = new Penalite();
        p.setDeclaration(declarationAssociee);
        p.setType("INTERET_RETARD_ACOMPTE");
        p.setMotif("RETARD_PAIEMENT_ACOMPTE");
        p.setBaseCalculAr(a.getMontantAr());
        p.setNbMois((int) mois);
        p.setTauxPct(new BigDecimal("1"));
        p.setMontantAr(interet);
        p.setStatut("DUE");
        p.setDateLimite(a.getDateEcheance());
        p.setDateRegularisation(datePaiement);
        p.setArticleRef("CDI Art. 01.01.15");
        p.setDateCreation(LocalDateTime.now());
        return penaliteRepository.save(p);
    }

    // =====================================================
    // Type C - AMENDES SPECIFIQUES
    // =====================================================

    /**
     * Motifs pris en charge :
     *  - SUSPENSION_ABUSIVE : 80 %
     *  - INSUFFISANCE       : 40 %
     *  - DEFICIT_INJUSTIFIE : 40 %
     *  - ABSENCE_COMPTA     : 0,5 % du CA
     */
    @Transactional
    public Penalite appliquerAmendeSpecifique(Long idDeclaration, String motif, Long complementImpot) {
        DeclarationIR d = charger(idDeclaration);

        String m = motif == null ? "" : motif.toUpperCase();
        BigDecimal taux;
        long base;
        String article;
        switch (m) {
            case "SUSPENSION_ABUSIVE":
                taux = getTaux("MAJORATION_ABUS_ACOMPTE", new BigDecimal("80"));
                base = complementImpot != null ? complementImpot
                        : (d.getIrDu() == null ? 0L : d.getIrDu());
                article = "CDI art. 05.01.06";
                break;
            case "INSUFFISANCE":
                taux = getTaux("MAJORATION_INSUFFISANCE", new BigDecimal("40"));
                base = complementImpot != null ? complementImpot
                        : (d.getIrDu() == null ? 0L : d.getIrDu());
                article = "CDI art. 05.01.04";
                break;
            case "DEFICIT_INJUSTIFIE":
                taux = getTaux("MAJORATION_INSUFFISANCE", new BigDecimal("40"));
                base = complementImpot != null ? complementImpot
                        : (d.getIrDu() == null ? 0L : d.getIrDu());
                article = "CDI art. 05.01.04";
                break;
            case "ABSENCE_COMPTA":
                taux = new BigDecimal("0.5");
                base = d.getCaHt() == null ? 0L : d.getCaHt();
                article = "CDI art. 05.01.07";
                break;
            default:
                throw new BusinessException("Motif d amende specifique invalide : " + motif);
        }

        if (base <= 0) {
            throw new BusinessException("Base de calcul indisponible pour ce motif");
        }

        long montant = BigDecimal.valueOf(base)
                .multiply(taux)
                .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP)
                .longValue();

        Penalite p = new Penalite();
        p.setDeclaration(d);
        p.setType("AMENDE_SPECIFIQUE");
        p.setMotif(m);
        p.setNbMois(0);
        p.setTauxPct(taux);
        p.setBaseCalculAr(base);
        p.setMontantAr(montant);
        p.setArticleRef(article);
        p.setDateLimite(d.getDateLimite());
        p.setStatut("DUE");
        p.setDateCreation(LocalDateTime.now());
        return penaliteRepository.save(p);
    }

    // =====================================================
    // Remise gracieuse / annulation
    // =====================================================

    @Transactional
    public Penalite demanderRemiseGracieuse(Long idPenalite, String motif, String justificatif) {
        Penalite p = penaliteRepository.findById(idPenalite)
                .orElseThrow(() -> new BusinessException("Penalite introuvable"));
        if ("PAYEE".equals(p.getStatut()) || "ANNULEE".equals(p.getStatut())) {
            throw new BusinessException("Cette penalite ne peut plus faire l'objet d'une remise");
        }
        p.setStatut("EN_DEMANDE_REMISE");
        if (motif != null && !motif.isBlank()) {
            p.setMotif(p.getMotif() == null ? motif : p.getMotif());
        }
        if (justificatif != null && !justificatif.isBlank()) {
            p.setArticleRef(p.getArticleRef());
        }
        return penaliteRepository.save(p);
    }

    @Transactional
    public Penalite deciderRemise(Long idPenalite, boolean accordee, String decision, Long idAgent) {
        Penalite p = penaliteRepository.findById(idPenalite)
                .orElseThrow(() -> new BusinessException("Penalite introuvable"));
        if (!"EN_DEMANDE_REMISE".equals(p.getStatut())) {
            throw new BusinessException("Aucune demande de remise en cours pour cette penalite");
        }
        if (accordee) {
            p.setStatut("ANNULEE");
            p.setMotifAnnulation(decision != null ? decision : "Remise gracieuse accordee");
        } else {
            p.setStatut("DUE");
            p.setMotifAnnulation(decision);
        }
        return penaliteRepository.save(p);
    }

    @Transactional
    public Penalite annuler(Long idPenalite, String motif) {
        Penalite p = penaliteRepository.findById(idPenalite)
                .orElseThrow(() -> new BusinessException("Penalite introuvable"));
        if ("PAYEE".equals(p.getStatut())) {
            throw new BusinessException("Une penalite payee ne peut pas etre annulee");
        }
        p.setStatut("ANNULEE");
        p.setMotifAnnulation(motif);
        return penaliteRepository.save(p);
    }

    // Compatibilite avec l'ancien endpoint
    @Transactional
    public Penalite annuler(Long idPenalite) {
        return annuler(idPenalite, null);
    }

    @Transactional
    public Penalite marquerPayee(Long idPenalite) {
        Penalite p = penaliteRepository.findById(idPenalite)
                .orElseThrow(() -> new BusinessException("Penalite introuvable"));
        p.setStatut("PAYEE");
        return penaliteRepository.save(p);
    }

    @Transactional
    public Penalite changerStatut(Long idPenalite, String statut) {
        if (statut == null || !(statut.equals("DUE") || statut.equals("PAYEE")
                || statut.equals("ANNULEE") || statut.equals("EN_DEMANDE_REMISE"))) {
            throw new BusinessException("Statut de penalite invalide : " + statut);
        }
        Penalite p = penaliteRepository.findById(idPenalite)
                .orElseThrow(() -> new BusinessException("Penalite introuvable"));
        p.setStatut(statut);
        return penaliteRepository.save(p);
    }

    // =====================================================
    // Situation consolidee
    // =====================================================

    public SituationPenalitesDTO calculerSituation(Long idContribuable, Integer annee) {
        List<Penalite> toutes = penaliteRepository
                .findByDeclarationContribuableIdContribuableOrderByDateCreationDesc(idContribuable);

        SituationPenalitesDTO dto = new SituationPenalitesDTO();
        dto.setIdContribuable(idContribuable);
        dto.setAnnee(annee);

        for (Penalite p : toutes) {
            if (annee != null && p.getDeclaration() != null
                    && !annee.equals(p.getDeclaration().getAnnee())) {
                continue;
            }
            dto.getPenalites().add(DetailPenaliteDTO.depuis(p));

            if ("ANNULEE".equals(p.getStatut())) {
                continue;
            }
            long m = p.getMontantAr() == null ? 0L : p.getMontantAr();
            dto.setTotalDu(dto.getTotalDu() + m);
            if ("AMENDE_DEPOT".equals(p.getType())) {
                dto.setTotalAmendesDepot(dto.getTotalAmendesDepot() + m);
            } else if ("AMENDE_SPECIFIQUE".equals(p.getType())) {
                dto.setTotalAmendesSpecifiques(dto.getTotalAmendesSpecifiques() + m);
            } else {
                dto.setTotalMajorations(dto.getTotalMajorations() + m);
            }
            if ("PAYEE".equals(p.getStatut())) {
                dto.setTotalPayees(dto.getTotalPayees() + m);
            }
        }
        return dto;
    }

    private long calculerMoisRetard(LocalDate dateEcheance, LocalDate datePaiement) {
        if (dateEcheance == null || datePaiement == null || !datePaiement.isAfter(dateEcheance)) {
            return 0L;
        }
        long mois = ChronoUnit.MONTHS.between(
                dateEcheance.withDayOfMonth(1),
                datePaiement.withDayOfMonth(1));
        return Math.max(mois, 1L);
    }

    private DeclarationIR charger(Long idDeclaration) {
        return declarationRepository.findById(idDeclaration)
                .orElseThrow(() -> new BusinessException("Declaration introuvable"));
    }

    private long getLong(String code, long defaut) {
        return parametreRepository.findByCode(code)
                .map(p -> p.getValeur().longValue())
                .orElse(defaut);
    }

    private BigDecimal getTaux(String code, BigDecimal defaut) {
        return parametreRepository.findByCode(code)
                .map(ParametreFiscal::getValeur)
                .orElse(defaut);
    }
}
