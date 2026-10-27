package mg.safidy.service;

import mg.safidy.dto.SituationAcomptesDTO;
import mg.safidy.exception.BusinessException;
import mg.safidy.model.Acompte;
import mg.safidy.model.Contribuable;
import mg.safidy.model.DeclarationIR;
import mg.safidy.model.ParametreFiscal;
import mg.safidy.model.SecteurActivite;
import mg.safidy.repository.AcompteRepository;
import mg.safidy.repository.ContribuableRepository;
import mg.safidy.repository.DeclarationIRRepository;
import mg.safidy.repository.ParametreFiscalRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Gestion des 3 types d'acomptes (CDI malgache) :
 *  - CREATION      : acompte de debut d'activite (montant fixe selon le secteur)
 *  - PROVISIONNEL  : 2 x 50 % de l'IR N-1 (echeances 15 mai / 15 novembre)
 *  - DOUANE        : retenue de 2 % de la valeur CAF (AIRS)
 */
@Service
public class AcompteService {

    private static final List<String> STATUTS_VALIDES =
        Arrays.asList("A_PAYER", "PAYE", "EN_RETARD", "SUSPENDU");

    public static final String TYPE_CREATION = "CREATION";
    public static final String TYPE_PROVISIONNEL = "PROVISIONNEL";
    public static final String TYPE_DOUANE = "DOUANE";

    private final AcompteRepository acompteRepository;
    private final ContribuableRepository contribuableRepository;
    private final ParametreFiscalRepository parametreRepository;
    private final DeclarationIRRepository declarationRepository;

    public AcompteService(AcompteRepository acompteRepository,
                           ContribuableRepository contribuableRepository,
                           ParametreFiscalRepository parametreRepository,
                           DeclarationIRRepository declarationRepository) {
        this.acompteRepository = acompteRepository;
        this.contribuableRepository = contribuableRepository;
        this.parametreRepository = parametreRepository;
        this.declarationRepository = declarationRepository;
    }

    public Acompte trouverParId(Long id) {
        return acompteRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Acompte introuvable : id=" + id));
    }

    public List<Acompte> listerParContribuable(Long idContribuable) {
        return acompteRepository.findByContribuableIdContribuableOrderByAnneeAsc(idContribuable);
    }

    @Transactional
    public Acompte changerStatut(Long id, String statut) {
        if (statut == null || !STATUTS_VALIDES.contains(statut)) {
            throw new BusinessException("Statut d acompte invalide : " + statut);
        }
        Acompte a = trouverParId(id);
        a.setStatut(statut);
        if ("PAYE".equals(statut)) {
            if (a.getDatePaiement() == null) {
                a.setDatePaiement(LocalDate.now());
            }
        } else {
            a.setDatePaiement(null);
        }
        return acompteRepository.save(a);
    }

    /**
     * Total des acomptes provisionnels verses pour une annee:
     * c'est le montant retranche du solde total a payer de la declaration.
     */
    public long totalAcomptesVerses(Long idContribuable, Integer annee) {
        if (idContribuable == null || annee == null) {
            return 0L;
        }
        return acompteRepository
                .findByContribuableIdContribuableAndAnneeAndTypeAcompte(
                        idContribuable, annee, TYPE_PROVISIONNEL)
                .stream()
                .filter(a -> "PAYE".equals(a.getStatut()))
                .mapToLong(a -> a.getMontantAr() == null ? 0L : a.getMontantAr())
                .sum();
    }

    /**
     * Situation par annee pour le tableau des acomptes :
     * une ligne = une annee, avec la base (IR N-1), les 2 acomptes de 50 %,
     * leurs dates de paiement et le statut global.
     */
    public List<Map<String, Object>> situationParAnnee(Long idContribuable) {
        Contribuable c = contribuableRepository.findById(idContribuable)
                .orElseThrow(() -> new BusinessException("Contribuable introuvable"));

        List<DeclarationIR> declarations = declarationRepository
                .findByContribuableIdContribuableOrderByAnneeDesc(idContribuable);

        Map<Integer, List<Acompte>> acomptesParAnnee = new LinkedHashMap<>();
        for (Acompte a : acompteRepository.findByContribuableIdContribuableOrderByAnneeAsc(idContribuable)) {
            if (!TYPE_PROVISIONNEL.equals(a.getTypeAcompte())) continue;
            acomptesParAnnee.computeIfAbsent(a.getAnnee(), k -> new ArrayList<>()).add(a);
        }

        List<Integer> annees = new ArrayList<>(acomptesParAnnee.keySet());
        for (DeclarationIR d : declarations) {
            if (d.getAnnee() != null && d.getIrDu() != null && d.getIrDu() > 0
                    && !annees.contains(d.getAnnee() + 1)) {
                annees.add(d.getAnnee() + 1);
            }
        }
        annees.sort((x, y) -> Integer.compare(y, x));

        List<Map<String, Object>> lignes = new ArrayList<>();
        for (Integer annee : annees) {
            Map<String, Object> ligne = new LinkedHashMap<>();
            ligne.put("annee", annee);
            ligne.put("idContribuable", c.getIdContribuable());

            Long base = declarations.stream()
                    .filter(d -> d.getAnnee() != null && d.getAnnee() == annee - 1)
                    .filter(d -> d.getIrDu() != null)
                    .map(DeclarationIR::getIrDu)
                    .findFirst()
                    .orElse(null);
            if (base == null) {
                base = acomptesParAnnee.getOrDefault(annee, List.of()).stream()
                        .map(Acompte::getBaseIrN1)
                        .filter(v -> v != null && v > 0)
                        .findFirst()
                        .orElse(0L);
            }
            ligne.put("baseIrN1", base);

            Acompte a1 = acomptesParAnnee.getOrDefault(annee, List.of()).stream()
                    .filter(a -> a.getNumero() != null && a.getNumero() == 1)
                    .findFirst().orElse(null);
            Acompte a2 = acomptesParAnnee.getOrDefault(annee, List.of()).stream()
                    .filter(a -> a.getNumero() != null && a.getNumero() == 2)
                    .findFirst().orElse(null);

            ligne.put("acompte1", a1);
            ligne.put("acompte2", a2);
            ligne.put("montant1", a1 == null ? 0L : a1.getMontantAr());
            ligne.put("montant2", a2 == null ? 0L : a2.getMontantAr());
            ligne.put("date1", a1 == null ? null : a1.getDatePaiement());
            ligne.put("date2", a2 == null ? null : a2.getDatePaiement());

            boolean paye = a1 != null && "PAYE".equals(a1.getStatut())
                    && (a2 == null || "PAYE".equals(a2.getStatut()));
            boolean partiel = (a1 != null && "PAYE".equals(a1.getStatut()))
                    || (a2 != null && "PAYE".equals(a2.getStatut()));
            String statut = paye ? "PAYE" : (partiel ? "PARTIEL" : "EN_COURS");
            if (a1 != null && "SUSPENDU".equals(a1.getStatut())) statut = "SUSPENDU";
            ligne.put("statut", statut);
            lignes.add(ligne);
        }
        return lignes;
    }

    // =====================================================
    // Type 1 - ACOMPTE DE DEBUT D'ACTIVITE (CREATION)
    // =====================================================

    /**
     * Cree l'acompte de debut d'activite. Le montant depend du secteur :
     * export 100 000 ; sante/education 200 000 ; prioritaire 500 000 ; autres 1 000 000.
     * Idempotent : si un acompte CREATION existe deja pour l'annee, il est renvoye.
     */
    @Transactional
    public Acompte creerAcompteCreation(Long idContribuable) {
        Contribuable c = contribuableRepository.findById(idContribuable)
                .orElseThrow(() -> new BusinessException("Contribuable introuvable"));

        int annee = (c.getDateImmatriculation() != null)
                ? c.getDateImmatriculation().getYear()
                : LocalDate.now().getYear();

        List<Acompte> existants = acompteRepository
                .findByContribuableIdContribuableAndAnneeAndTypeAcompte(idContribuable, annee, TYPE_CREATION);
        if (!existants.isEmpty()) {
            return existants.get(0);
        }

        long montant = montantCreation(c.getSecteur());

        Acompte a = new Acompte();
        a.setContribuable(c);
        a.setAnnee(annee);
        a.setNumero(1);
        a.setTauxPct(0);
        a.setBaseIrN1(0L);
        a.setMontantAr(montant);
        a.setDateEcheance(c.getDateImmatriculation() != null
                ? c.getDateImmatriculation() : LocalDate.now());
        a.setStatut("A_PAYER");
        a.setTypeAcompte(TYPE_CREATION);
        a.setDateCreation(LocalDateTime.now());
        return acompteRepository.save(a);
    }

    private long montantCreation(SecteurActivite secteur) {
        String code = secteur == null || secteur.getCode() == null ? "" : secteur.getCode().toUpperCase();
        String categorie = secteur == null || secteur.getCategorie() == null ? "" : secteur.getCategorie();

        if (code.contains("EXPORT")) {
            return getLong("ACOMPTE_CREATION_EXPORT", 100_000L);
        }
        if ("SANTE_EDUC".equals(categorie)) {
            return getLong("ACOMPTE_CREATION_SANTE", 200_000L);
        }
        if ("PRIORITAIRE".equals(categorie)) {
            return getLong("ACOMPTE_CREATION_PRIORITAIRE", 500_000L);
        }
        return getLong("ACOMPTE_CREATION_GENERAL", 1_000_000L);
    }

    // =====================================================
    // Type 2 - ACOMPTES PROVISIONNELS (2 x 50 % de l'IR N-1)
    // =====================================================

    /**
     * Genere les 2 acomptes provisionnels d'une annee a partir de l'IR de l'annee precedente.
     * Chaque acompte = taux (TAUX_ACOMPTE, defaut 50 %) x IR N-1.
     * 1er acompte : echeance 15 mai ; 2e acompte : echeance 15 novembre.
     */
    @Transactional
    public List<Acompte> creerAcomptesProvisionnels(Long idContribuable, Integer annee, Long irN1) {
        if (annee == null || irN1 == null || irN1 <= 0) {
            return List.of();
        }

        Contribuable c = contribuableRepository.findById(idContribuable)
            .orElseThrow(() -> new BusinessException("Contribuable introuvable"));

        DeclarationIR declarationN1 = declarationRepository
                .findByContribuableIdContribuableAndAnnee(idContribuable, annee - 1)
                .filter(d -> !"BROUILLON".equals(d.getStatut()))
                .orElse(null);
        if (declarationN1 == null || declarationN1.getIrDu() == null || declarationN1.getIrDu() <= 0) {
            return List.of();
        }

        // Utiliser l'IR total de la declaration N-1 comme source de reference, jamais son solde.
        long irN1Total = declarationN1.getIrDu();

        BigDecimal taux = getTaux("TAUX_ACOMPTE", new BigDecimal("50"));
        int tauxInt = taux.intValue();
        long montant = calculerMontantProvisionnel(irN1Total, taux);

        List<Acompte> crees = new ArrayList<>();
        for (int numero = 1; numero <= 2; numero++) {
            final int num = numero;
            if (acompteRepository.existsByContribuableIdContribuableAndAnneeAndTypeAcompte(
                    idContribuable, annee, TYPE_PROVISIONNEL)) {
                List<Acompte> existants = acompteRepository
                        .findByContribuableIdContribuableAndAnneeAndTypeAcompte(
                                idContribuable, annee, TYPE_PROVISIONNEL);
                if (existants.stream().anyMatch(x -> num == x.getNumero())) {
                    continue;
                }
            }
            Acompte a = new Acompte();
            a.setContribuable(c);
            a.setAnnee(annee);
            a.setNumero(num);
            a.setTauxPct(tauxInt);
            a.setBaseIrN1(irN1Total);
            a.setMontantAr(montant);
            a.setDateEcheance(LocalDate.of(annee, numero == 1 ? 5 : 11, 15));
            a.setStatut("A_PAYER");
            a.setTypeAcompte(TYPE_PROVISIONNEL);
            a.setDateCreation(LocalDateTime.now());
            crees.add(acompteRepository.save(a));
        }
        return crees;
    }

    /**
     * Resume les flux dus aux echeances du 15 mai et du 15 novembre.
     * Le solde N-1 provient du calcul de la declaration (IR total - acomptes N-1 verses).
     */
    public Map<String, Object> calculerEcheances(Long idContribuable, Integer annee) {
        if (annee == null || annee <= 0) {
            Map<String, Object> resultat = new LinkedHashMap<>();
            resultat.put("annee", annee);
            resultat.put("eligible", false);
            return resultat;
        }

        DeclarationIR declarationN1 = declarationRepository
                .findByContribuableIdContribuableAndAnnee(idContribuable, annee - 1)
                .filter(d -> !"BROUILLON".equals(d.getStatut()))
                .orElse(null);
        return construireEcheances(annee, declarationN1);
    }

    public List<Map<String, Object>> calculerChronologie(Long idContribuable) {
        List<DeclarationIR> declarations = declarationRepository
                .findByContribuableIdContribuableOrderByAnneeDesc(idContribuable).stream()
                .filter(d -> d.getAnnee() != null && !"BROUILLON".equals(d.getStatut()))
                .toList();
        if (declarations.isEmpty()) {
            return List.of();
        }

        Map<Integer, DeclarationIR> parAnnee = new LinkedHashMap<>();
        declarations.forEach(d -> parAnnee.put(d.getAnnee(), d));
        int premiereAnnee = declarations.stream().mapToInt(DeclarationIR::getAnnee).min().orElseThrow();
        int derniereAnnee = declarations.stream().mapToInt(DeclarationIR::getAnnee).max().orElseThrow();

        List<Map<String, Object>> chronologie = new ArrayList<>();
        for (int annee = premiereAnnee; annee <= derniereAnnee + 1; annee++) {
            DeclarationIR declarationN1 = parAnnee.get(annee - 1);
            if (declarationN1 != null && (declarationN1.getIrDu() == null || declarationN1.getIrDu() <= 0)) {
                declarationN1 = null;
            }
            chronologie.add(construireEcheances(annee, declarationN1));
        }
        return chronologie;
    }

    private Map<String, Object> construireEcheances(Integer annee, DeclarationIR declarationN1) {
        Map<String, Object> resultat = new LinkedHashMap<>();
        resultat.put("annee", annee);
        resultat.put("eligible", false);
        if (declarationN1 == null || declarationN1.getIrDu() == null || declarationN1.getIrDu() <= 0) {
            resultat.put("message", "Aucun acompte provisionnel : aucun IR N-1 valide.");
            return resultat;
        }

        long irN1 = declarationN1.getIrDu();
        long acomptesN1Verses = declarationN1.getAcomptesVerses() == null
                ? 0L : declarationN1.getAcomptesVerses();
        long soldeN1 = Math.max(irN1 - acomptesN1Verses, 0L);
        BigDecimal taux = getTaux("TAUX_ACOMPTE", new BigDecimal("50"));
        long montantAcompte = calculerMontantProvisionnel(irN1, taux);

        Map<String, Object> mai = new LinkedHashMap<>();
        mai.put("date", LocalDate.of(annee, 5, 15));
        mai.put("soldeN1", soldeN1);
        mai.put("acompte1N", montantAcompte);
        mai.put("total", soldeN1 + montantAcompte);

        Map<String, Object> novembre = new LinkedHashMap<>();
        novembre.put("date", LocalDate.of(annee, 11, 15));
        novembre.put("acompte2N", montantAcompte);
        novembre.put("total", montantAcompte);

        resultat.put("eligible", true);
        resultat.put("irN1Total", irN1);
        resultat.put("acomptesN1Verses", acomptesN1Verses);
        resultat.put("soldeN1", soldeN1);
        resultat.put("echeance15Mai", mai);
        resultat.put("echeance15Novembre", novembre);
        return resultat;
    }

    private long calculerMontantProvisionnel(long irN1, BigDecimal taux) {
        return BigDecimal.valueOf(irN1)
                .multiply(taux)
                .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP)
                .longValue();
    }

    /**
     * Montant d'un acompte provisionnel (50 % de l'IR de l'annee precedente).
     */
    public long montantAcompteProvisionnel(long irDu) {
        BigDecimal taux = getTaux("TAUX_ACOMPTE", new BigDecimal("50"));
        return calculerMontantProvisionnel(Math.max(irDu, 0L), taux);
    }

    // =====================================================
    // Type 3 - ACOMPTE EN DOUANE (retenue 2 % CAF)
    // =====================================================

    @Transactional
    public Acompte enregistrerAcompteDouane(Long idContribuable, String referenceDouane,
                                             Long valeurCaf, Integer annee, LocalDate date) {
        Contribuable c = contribuableRepository.findById(idContribuable)
                .orElseThrow(() -> new BusinessException("Contribuable introuvable"));

        if (valeurCaf == null || valeurCaf <= 0) {
            throw new BusinessException("Valeur CAF > 0 requise");
        }
        if (referenceDouane == null || referenceDouane.isBlank()) {
            throw new BusinessException("Reference douane obligatoire");
        }
        if (annee == null) {
            annee = LocalDate.now().getYear();
        }

        BigDecimal taux = getTaux("TAUX_DOUANE_AIRS", new BigDecimal("2"));
        long montant = BigDecimal.valueOf(valeurCaf)
                .multiply(taux)
                .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP)
                .longValue();

        long nb = acompteRepository.countByContribuableIdContribuableAndTypeAcompte(
                idContribuable, TYPE_DOUANE);

        Acompte a = new Acompte();
        a.setContribuable(c);
        a.setAnnee(annee);
        a.setNumero((int) (nb + 1));
        a.setTauxPct(taux.intValue());
        a.setBaseIrN1(valeurCaf);
        a.setMontantAr(montant);
        a.setDateEcheance(date != null ? date : LocalDate.now());
        a.setStatut("PAYE");
        a.setTypeAcompte(TYPE_DOUANE);
        a.setReferenceDouane(referenceDouane);
        a.setDateCreation(LocalDateTime.now());
        return acompteRepository.save(a);
    }

    // =====================================================
    // Suspension / reactivation d'un acompte
    // =====================================================

    @Transactional
    public Acompte demanderSuspension(Long idAcompte) {
        Acompte a = trouverParId(idAcompte);
        if (!TYPE_PROVISIONNEL.equals(a.getTypeAcompte())) {
            throw new BusinessException("Seuls les acomptes provisionnels peuvent etre suspendus");
        }
        if ("PAYE".equals(a.getStatut())) {
            throw new BusinessException("Acompte deja paye : suspension impossible");
        }
        a.setStatut("SUSPENDU");
        return acompteRepository.save(a);
    }

    @Transactional
    public Acompte reactiver(Long idAcompte) {
        Acompte a = trouverParId(idAcompte);
        if (!"SUSPENDU".equals(a.getStatut())) {
            throw new BusinessException("Cet acompte n'est pas suspendu");
        }
        a.setStatut("A_PAYER");
        return acompteRepository.save(a);
    }

    // =====================================================
    // Situation consolidee
    // =====================================================

    public SituationAcomptesDTO calculerSituationAcomptes(Long idContribuable, Integer annee) {
        Contribuable c = contribuableRepository.findById(idContribuable)
                .orElseThrow(() -> new BusinessException("Contribuable introuvable"));

        if (annee == null) {
            annee = LocalDate.now().getYear();
        }

        List<Acompte> tous = acompteRepository
                .findByContribuableIdContribuableAndAnneeOrderByTypeAcompteAscNumeroAsc(idContribuable, annee);

        SituationAcomptesDTO dto = new SituationAcomptesDTO();
        dto.setIdContribuable(idContribuable);
        dto.setAnnee(annee);

        long totalExigibles = 0L;
        long cumulVerse = 0L;

        for (Acompte a : tous) {
            totalExigibles += a.getMontantAr() == null ? 0L : a.getMontantAr();
            if ("PAYE".equals(a.getStatut())) {
                cumulVerse += a.getMontantAr() == null ? 0L : a.getMontantAr();
            }
            if (TYPE_CREATION.equals(a.getTypeAcompte())) {
                dto.getCreation().add(a);
            } else if (TYPE_DOUANE.equals(a.getTypeAcompte())) {
                dto.getDouane().add(a);
            } else {
                dto.getProvisionnels().add(a);
            }
        }

        Long irN1 = declarationRepository
                .findByContribuableIdContribuableAndAnnee(idContribuable, annee - 1)
                .map(d -> d.getIrDu())
                .orElse(null);
        if (irN1 == null) {
            irN1 = dto.getProvisionnels().stream()
                    .map(Acompte::getBaseIrN1)
                    .filter(v -> v != null && v > 0)
                    .findFirst()
                    .orElse(0L);
        }

        long solde = totalExigibles - cumulVerse;
        dto.setIrN1(irN1);
        dto.setTotalExigibles(totalExigibles);
        dto.setCumulVerse(cumulVerse);
        dto.setSolde(Math.max(solde, 0L));
        dto.setCreditImpot(solde < 0 ? -solde : 0L);

        return dto;
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
