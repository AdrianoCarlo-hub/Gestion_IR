package mg.safidy.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/test-regles")
public class TestReglesFiscalesController {

    @GetMapping("/deficit-3-ans")
    public Map<String, Object> testDeficit() {
        long deficit2025 = 100_000_000L;
        long benefice2026 = 40_000_000L;
        long benefice2027 = 100_000_000L;

        long deficitImpute2026 = Math.min(benefice2026, deficit2025);
        long stockRestant2026 = deficit2025 - deficitImpute2026;

        long deficitImpute2027 = Math.min(benefice2027, stockRestant2026);
        long baseImposable2027 = Math.max(benefice2027 - deficitImpute2027, 0L);
        long ir2027 = baseImposable2027 > 0 ? (baseImposable2027 * 20L) / 100L : 0L;

        Map<String, Object> resultat = new LinkedHashMap<>();
        resultat.put("annee2025", Map.of(
                "resultatFiscal", -100_000_000L,
                "deficitCree", 100_000_000L,
                "stockRestant", 100_000_000L));
        resultat.put("annee2026", Map.of(
                "benefice", benefice2026,
                "deficitImpute", deficitImpute2026,
                "stockRestant", stockRestant2026,
                "baseImposable", 0L,
                "irCalcule", 0L));
        resultat.put("annee2027", Map.of(
                "benefice", benefice2027,
                "deficitImpute", deficitImpute2027,
                "stockRestant", 0L,
                "baseImposable", baseImposable2027,
                "irCalcule", ir2027));
        resultat.put("reference", "Deficit reporte sur 3 ans : 100M -> 40M impute -> 60M restant -> 60M impute -> base 40M -> IR 8M");
        return resultat;
    }

    @GetMapping("/penalite-acompte")
    public Map<String, Object> testPenaliteAcompte() {
        long acompte = 25_000_000L;
        long moisRetard = 3L;
        long interet = (acompte * 1L * moisRetard) / 100L;
        long total = acompte + interet;

        Map<String, Object> resultat = new LinkedHashMap<>();
        resultat.put("acompte", acompte);
        resultat.put("dateEcheance", "2027-05-15");
        resultat.put("datePaiement", "2027-08-10");
        resultat.put("moisRetard", moisRetard);
        resultat.put("interet", interet);
        resultat.put("total", total);
        resultat.put("reference", "25 000 000 x 1 % x 3 = 750 000 Ar");
        return resultat;
    }

    @GetMapping("/penalite-solde")
    public Map<String, Object> testPenaliteSolde() {
        long irDu = 5_000_000L;
        long acomptesVerses = 3_000_000L;
        long soldeNet = irDu - acomptesVerses;
        long moisRetard = 3L;
        long interet = (soldeNet * 1L * moisRetard) / 100L;
        long amendeDepot = 100_000L;
        long totalPenalites = interet + amendeDepot;
        long netAPayer = soldeNet + totalPenalites;

        Map<String, Object> resultat = new LinkedHashMap<>();
        resultat.put("irDu", irDu);
        resultat.put("acomptesVerses", acomptesVerses);
        resultat.put("soldeNet", soldeNet);
        resultat.put("moisRetard", moisRetard);
        resultat.put("interet", interet);
        resultat.put("amendeDepot", amendeDepot);
        resultat.put("totalPenalites", totalPenalites);
        resultat.put("netAPayer", netAPayer);
        resultat.put("reference", "2 000 000 x 1 % x 3 + 100 000 = 160 000 Ar");
        return resultat;
    }

    @GetMapping("/acompte-min-perception")
    public Map<String, Object> testAcompteMin() {
        long ir2025 = 3_000_000L;
        long acompte2026 = (ir2025 * 50L) / 100L;
        long total15Mai2026 = ir2025 + acompte2026;

        Map<String, Object> resultat = new LinkedHashMap<>();
        resultat.put("ir2025", ir2025);
        resultat.put("acompte2026", acompte2026);
        resultat.put("solde2025", ir2025);
        resultat.put("total15Mai2026", total15Mai2026);
        resultat.put("reference", "IR 2025 = minimum 3M ; acompte 2026 = 50 % x 3M = 1.5M ; total le 15 mai 2026 = 4.5M");
        return resultat;
    }
}
