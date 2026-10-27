package mg.safidy.service;

import mg.safidy.exception.BusinessException;
import mg.safidy.model.Acompte;
import mg.safidy.model.Agent;
import mg.safidy.model.Contribuable;
import mg.safidy.model.DeclarationIR;
import mg.safidy.model.Paiement;
import mg.safidy.repository.AcompteRepository;
import mg.safidy.repository.AgentRepository;
import mg.safidy.repository.ContribuableRepository;
import mg.safidy.repository.DeclarationIRRepository;
import mg.safidy.repository.PaiementRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Enregistrement des reglements.
 *
 * 2 types de reglement :
 *  - TOUS          : IR du + penalites dues + 1er acompte N+1 (50 %)
 *                    - acomptes deja verses.
 *                    Un seul enregistrement, qui met a jour simultanement la
 *                    declaration (PAYEE), l'acompte 1 (PAYE) et les penalites
 *                    (PAYEE).
 *  - 2EME_ACOMPTE  : 50 % de l'IR du + interets de retard si paiement apres
 *                    le 15 novembre. Met a jour l'acompte 2 (PAYE).
 *
 * Une declaration ne peut etre reglee qu'une seule fois par type de reglement.
 */
@Service
public class PaiementService {

    public static final String REGLEMENT_TOUS = "TOUS";
    public static final String REGLEMENT_2EME = "2EME_ACOMPTE";

    private final PaiementRepository paiementRepository;
    private final ContribuableRepository contribuableRepository;
    private final DeclarationIRRepository declarationRepository;
    private final AcompteRepository acompteRepository;
    private final AgentRepository agentRepository;
    private final PenaliteService penaliteService;
    private final AcompteService acompteService;

    public PaiementService(PaiementRepository paiementRepository,
                            ContribuableRepository contribuableRepository,
                            DeclarationIRRepository declarationRepository,
                            AcompteRepository acompteRepository,
                            AgentRepository agentRepository,
                            PenaliteService penaliteService,
                            AcompteService acompteService) {
        this.paiementRepository = paiementRepository;
        this.contribuableRepository = contribuableRepository;
        this.declarationRepository = declarationRepository;
        this.acompteRepository = acompteRepository;
        this.agentRepository = agentRepository;
        this.penaliteService = penaliteService;
        this.acompteService = acompteService;
    }

    public List<Paiement> lister() {
        return paiementRepository.findAll();
    }

    public List<Paiement> listerParContribuable(Long idContribuable) {
        return paiementRepository.findByContribuableIdContribuableOrderByDatePaiementDesc(idContribuable);
    }

    public Paiement trouverParId(Long id) {
        return paiementRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Paiement introuvable : id=" + id));
    }

    // =====================================================
    // Recapitulatif du reglement (affiche dans le panneau
    // de detail avant paiement)
    // =====================================================

    /**
     * Detail du montant a regler pour une declaration et un type de reglement.
     * Valeurs cote serveur : l'UI affiche exactement ce qui sera encaisse.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> recapitulatif(Long idDeclaration, String typeReglement,
                                             LocalDate datePaiement) {
        DeclarationIR d = declarationRepository.findById(idDeclaration)
                .orElseThrow(() -> new BusinessException("Declaration introuvable"));

        long irDu = nz(d.getIrDu());
        long penalites = penaliteService.totalDues(d.getIdDeclaration());
        long premierAcompte = acompteService.montantAcompteProvisionnel(irDu);
        long acomptesVerses = nz(d.getAcomptesVerses());

        Map<String, Object> recap = new LinkedHashMap<>();
        recap.put("idDeclaration", d.getIdDeclaration());
        recap.put("annee", d.getAnnee());
        recap.put("typeReglement", typeReglement);
        recap.put("irDu", irDu);
        recap.put("penalites", penalites);
        recap.put("premierAcompte", premierAcompte);
        recap.put("acomptesVerses", acomptesVerses);

        if (REGLEMENT_2EME.equals(typeReglement)) {
            long acompte2 = acompteService.montantAcompteProvisionnel(irDu);
            long interet = 0L;
            if (datePaiement != null && acompte2 > 0) {
                LocalDate echeance = LocalDate.of(d.getAnnee() + 1, 11, 15);
                if (datePaiement.isAfter(echeance)) {
                    long mois = Math.max(1L,
                            ChronoUnit.MONTHS.between(
                                    echeance.withDayOfMonth(1),
                                    datePaiement.withDayOfMonth(1)));
                    interet = BigDecimal.valueOf(acompte2)
                            .multiply(BigDecimal.valueOf(mois))
                            .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP)
                            .longValue();
                }
            }
            recap.put("acompte2", acompte2);
            recap.put("interetRetard", interet);
            recap.put("echeance", LocalDate.of(d.getAnnee() + 1, 11, 15));
            recap.put("total", acompte2 + interet);
        } else {
            long total = irDu + penalites + premierAcompte - acomptesVerses;
            recap.put("acompte2", 0L);
            recap.put("interetRetard", 0L);
            recap.put("total", Math.max(total, 0L));
            recap.put("credit", total < 0 ? -total : 0L);
        }
        return recap;
    }

    // =====================================================
    // Enregistrement
    // =====================================================

    @Transactional
    public Paiement enregistrer(Long idContribuable, Long idDeclaration, Long idAcompte,
                                 String typeReglement, Long montantAr, LocalDate datePaiement,
                                 String mode, Long idAgent) {

        Contribuable c = contribuableRepository.findById(idContribuable)
                .orElseThrow(() -> new BusinessException("Contribuable introuvable"));

        if (datePaiement == null || datePaiement.isAfter(LocalDate.now())) {
            throw new BusinessException("Date de paiement dans le futur interdite");
        }
        if (mode == null || !(mode.equals("VIREMENT") || mode.equals("CHEQUE")
                || mode.equals("ESPECES") || mode.equals("MOBILE_MONEY"))) {
            throw new BusinessException("Mode de paiement invalide");
        }

        if (REGLEMENT_TOUS.equals(typeReglement) || REGLEMENT_2EME.equals(typeReglement)) {
            return enregistrerReglement(c, idDeclaration, typeReglement, datePaiement, mode, idAgent);
        }

        return enregistrerLegacy(c, idDeclaration, idAcompte, typeReglement,
                montantAr, datePaiement, mode, idAgent);
    }

    /**
     * Nouveau flux : un seul enregistrement qui met a jour tous les statuts.
     */
    private Paiement enregistrerReglement(Contribuable c, Long idDeclaration, String typeReglement,
                                          LocalDate datePaiement, String mode, Long idAgent) {
        if (idDeclaration == null) {
            throw new BusinessException("Declaration obligatoire pour un reglement");
        }
        DeclarationIR d = declarationRepository.findById(idDeclaration)
                .orElseThrow(() -> new BusinessException("Declaration introuvable"));
        if (d.getContribuable() == null
                || !c.getIdContribuable().equals(d.getContribuable().getIdContribuable())) {
            throw new BusinessException("La declaration n appartient pas a ce contribuable");
        }

        // Paiement unique : un seul reglement de ce type par declaration
        boolean dejaRegle = paiementRepository.findByDeclarationIdDeclaration(idDeclaration)
                .stream()
                .anyMatch(p -> !Boolean.TRUE.equals(p.getAnnule())
                        && typeReglement.equals(p.getTypeReglement()));
        if (dejaRegle) {
            throw new BusinessException(
                    "Declaration deja reglee : un seul paiement de type " + typeReglement
                    + " est autorise");
        }

        // Regle CT8 : une entreprise non active ne peut payer que pour solder une dette
        if (!"ACTIF".equals(c.getStatut())) {
            boolean detteExistante = d.getSoldeAPayer() != null && d.getSoldeAPayer() > 0
                    || d.getIrDu() != null && d.getIrDu() > 0;
            if (!detteExistante) {
                throw new BusinessException(
                        "Entreprise " + c.getStatut()
                        + " : paiement autorise uniquement pour solder une dette existante");
            }
        }

        Map<String, Object> recap = recapitulatif(idDeclaration, typeReglement, datePaiement);
        long montant = ((Number) recap.get("total")).longValue();
        if (montant <= 0) {
            throw new BusinessException("Aucun montant a regler pour ce type de reglement");
        }

        Agent agent = agentRepository.findById(idAgent)
                .orElseThrow(() -> new BusinessException("Agent introuvable"));

        Paiement p = new Paiement();
        p.setContribuable(c);
        p.setDeclaration(d);
        p.setAcompte(null);
        p.setTypeReglement(typeReglement);
        p.setTypePaiement(REGLEMENT_TOUS.equals(typeReglement) ? "SOLDE_IR" : "ACOMPTE");
        p.setMontantAr(montant);
        p.setDatePaiement(datePaiement);
        p.setMode(mode);
        p.setReferenceQuittance(genererQuittance(datePaiement));
        p.setAgent(agent);
        p.setAnnule(false);
        p.setDateCreation(LocalDateTime.now());

        Paiement saved = paiementRepository.save(p);

        if (REGLEMENT_TOUS.equals(typeReglement)) {
            marquerAcomptePaye(c.getIdContribuable(), d.getAnnee() + 1, 1, datePaiement);
            penaliteService.marquerPayees(d.getIdDeclaration());
            d.setStatut("PAYEE");
            declarationRepository.save(d);
        } else {
            marquerAcomptePaye(c.getIdContribuable(), d.getAnnee() + 1, 2, datePaiement);

            // Interets de retard inclus dans le reglement (paiement apres le 15 novembre)
            long interet = ((Number) recap.get("interetRetard")).longValue();
            if (interet > 0) {
                Acompte acompte2 = acompteRepository
                        .findByContribuableIdContribuableAndAnneeAndNumero(
                                c.getIdContribuable(), d.getAnnee() + 1, 2)
                        .orElse(null);
                if (acompte2 != null) {
                    try {
                        var penalite = penaliteService.calculerInteretRetardAcompte(
                                acompte2.getIdAcompte(), datePaiement);
                        if (penalite != null) {
                            penaliteService.marquerPayee(penalite.getIdPenalite());
                        }
                    } catch (BusinessException ignore) {
                        // interet deja enregistre ou non applicable
                    }
                }
            }
        }

        return saved;
    }

    private void marquerAcomptePaye(Long idContribuable, Integer annee, Integer numero,
                                    LocalDate datePaiement) {
        Acompte a = acompteRepository
                .findByContribuableIdContribuableAndAnneeAndNumero(idContribuable, annee, numero)
                .filter(x -> AcompteService.TYPE_PROVISIONNEL.equals(x.getTypeAcompte()))
                .orElse(null);
        if (a == null || "PAYE".equals(a.getStatut())) {
            return;
        }
        a.setStatut("PAYE");
        a.setDatePaiement(datePaiement);
        acompteRepository.save(a);
    }

    /**
     * Ancien flux conserve pour compatibilite (cible declaration ou acompte).
     */
    private Paiement enregistrerLegacy(Contribuable c, Long idDeclaration, Long idAcompte,
                                       String typePaiement, Long montantAr, LocalDate datePaiement,
                                       String mode, Long idAgent) {

        if (montantAr == null || montantAr <= 0) {
            throw new BusinessException("Montant du paiement > 0 requis");
        }

        DeclarationIR d = null;
        if (idDeclaration != null) {
            d = declarationRepository.findById(idDeclaration)
                    .orElseThrow(() -> new BusinessException("Declaration introuvable"));
        }
        Acompte a = null;
        if (idAcompte != null) {
            a = acompteRepository.findById(idAcompte)
                    .orElseThrow(() -> new BusinessException("Acompte introuvable"));
        }
        if (d == null && a == null) {
            throw new BusinessException("Paiement doit viser une declaration ou un acompte");
        }

        // Regle CT8 : un contribuable SUSPENDU/CESSE/RADIE ne peut payer
        // que pour solder une dette existante.
        String statutContribuable = c.getStatut();
        if (!"ACTIF".equals(statutContribuable)) {
            boolean soldeUneDette =
                (d != null && d.getSoldeAPayer() != null && d.getSoldeAPayer() > 0)
                || (a != null && !"PAYE".equals(a.getStatut()));
            if (!soldeUneDette) {
                throw new BusinessException(
                    "Entreprise " + statutContribuable
                    + " : paiement autorise uniquement pour solder une dette existante");
            }
        }

        Agent agent = agentRepository.findById(idAgent)
                .orElseThrow(() -> new BusinessException("Agent introuvable"));

        Paiement p = new Paiement();
        p.setContribuable(c);
        p.setDeclaration(d);
        p.setAcompte(a);
        p.setTypePaiement(typePaiement == null ? "SOLDE_IR" : typePaiement);
        p.setTypeReglement(REGLEMENT_TOUS);
        p.setMontantAr(montantAr);
        p.setDatePaiement(datePaiement);
        p.setMode(mode);
        p.setReferenceQuittance(genererQuittance(datePaiement));
        p.setAgent(agent);
        p.setAnnule(false);
        p.setDateCreation(LocalDateTime.now());

        Paiement saved = paiementRepository.save(p);

        // ============================================================
        // REGLE R2.1 : Penalite automatique si acompte paye en retard
        // Taux 1%/mois (mois commence = mois entier)
        // Base = montant de l'acompte (pas le solde)
        // Pas d'amende de depot pour un acompte
        // ============================================================
        if (a != null && a.getDateEcheance() != null
                && datePaiement.isAfter(a.getDateEcheance())) {
            try {
                penaliteService.calculerInteretRetardAcompte(idAcompte, datePaiement);
            } catch (Exception ignore) {
                // Ne pas bloquer le paiement si la penalite existe deja
                // ou si une erreur non bloquante survient
            }
        }

        if (a != null) {
            a.setStatut("PAYE");
            a.setDatePaiement(datePaiement);
            acompteRepository.save(a);
        }

        if (d != null) {
            long totalPaye = paiementRepository.findByDeclarationIdDeclaration(d.getIdDeclaration())
                    .stream().filter(x -> !Boolean.TRUE.equals(x.getAnnule()))
                    .mapToLong(Paiement::getMontantAr).sum();
            long attendu = d.getSoldeAPayer() != null && d.getSoldeAPayer() > 0
                    ? d.getSoldeAPayer()
                    : (d.getIrDu() == null ? 0L : d.getIrDu());
            if (attendu > 0 && totalPaye >= attendu) {
                d.setStatut("PAYEE");
                declarationRepository.save(d);
            }
        }

        return saved;
    }

    @Transactional
    public Paiement annuler(Long idPaiement, String motif) {
        Paiement p = trouverParId(idPaiement);
        if (Boolean.TRUE.equals(p.getAnnule())) {
            throw new BusinessException("Paiement deja annule");
        }
        if (motif == null || motif.isBlank()) {
            throw new BusinessException("Motif d'annulation obligatoire");
        }
        p.setAnnule(true);
        p.setMotifAnnulation(motif);
        return paiementRepository.save(p);
    }

    private long nz(Long v) {
        return v == null ? 0L : v;
    }

    private String genererQuittance(LocalDate datePaiement) {
        String datePart = datePaiement.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long n = System.currentTimeMillis() % 100000;
        String ref = "Q-" + datePart + "-" + String.format("%05d", n);
        int essai = 0;
        while (paiementRepository.existsByReferenceQuittance(ref) && essai < 5) {
            n = (n + 1) % 100000;
            ref = "Q-" + datePart + "-" + String.format("%05d", n);
            essai++;
        }
        return ref;
    }
}
