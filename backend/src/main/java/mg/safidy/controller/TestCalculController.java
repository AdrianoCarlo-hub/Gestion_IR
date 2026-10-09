package mg.safidy.controller;

import mg.safidy.dto.ResultatCalculIR;
import mg.safidy.model.Contribuable;
import mg.safidy.model.SecteurActivite;
import mg.safidy.service.IRCalculationService;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/test")
public class TestCalculController {

    private final IRCalculationService service;

    public TestCalculController(IRCalculationService service) {
        this.service = service;
    }

    @GetMapping("/minimum-perception")
    public List<Map<String, Object>> testerMinimum() {
        List<Map<String, Object>> resultats = new ArrayList<>();

        resultats.add(test("Industriel 600 M", "PRIORITAIRE", 500000L, "0.0100", 600_000_000L, 6_500_000L));
        resultats.add(test("Commerce 500 M",   "GENERAL",     1_000_000L, "0.0100", 500_000_000L, 6_000_000L));
        resultats.add(test("Carburant 400 M",  "CARBURANT",   0L, "0.0020", 400_000_000L, 800_000L));
        resultats.add(test("Sante 100 M",      "SANTE_EDUC",  200_000L, "0.0020", 100_000_000L, 400_000L));
        resultats.add(test("Hotelier 500 M",   "PRIORITAIRE", 500_000L, "0.0100", 500_000_000L, 5_500_000L));
        resultats.add(test("Service 300 M",    "GENERAL",     1_000_000L, "0.0100", 300_000_000L, 4_000_000L));

        return resultats;
    }

    @GetMapping("/calcul-complet")
    public Map<String, Object> testerCalculComplet() {
        Contribuable c = new Contribuable();
        SecteurActivite s = new SecteurActivite();
        s.setCategorie("GENERAL");
        s.setCode("SERVICES");
        s.setLibelle("Services");
        s.setMinFixeAr(1_000_000L);
        s.setMinPctCa(new BigDecimal("0.0100"));
        c.setSecteur(s);

        // Nouvelle signature : (contribuable, caHt, totalCharges, totalChargesSansFacture,
        //                       totalReintegrations, totalDeductions, deficitDisponible, acomptesVerses)
        ResultatCalculIR r = service.calculer(
                c,
                600_000_000L,   // caHt
                585_000_000L,   // totalCharges
                0L,             // totalChargesSansFacture
                0L,             // totalReintegrations
                0L,             // totalDeductions
                0L,             // deficitDisponible
                0L              // acomptesVerses
        );

        Map<String, Object> m = new HashMap<>();
        m.put("ca", r.getCaHt());
        m.put("charges", r.getTotalCharges());
        m.put("resultatComptable", r.getResultatComptable());
        m.put("baseImposable", r.getBaseImposable());
        m.put("irBrut", r.getIrBrut());
        m.put("minimumPerception", r.getMinimumPerception());
        m.put("irDu", r.getIrDu());
        m.put("soldeAPayer", r.getSoldeAPayer());
        m.put("attendu_irBrut", 3_000_000L);
        m.put("attendu_minimum", 7_000_000L);
        m.put("attendu_irDu", 7_000_000L);
        m.put("ok", r.getIrBrut() == 3_000_000L
                && r.getMinimumPerception() == 7_000_000L
                && r.getIrDu() == 7_000_000L);
        return m;
    }

    private Map<String, Object> test(String nom, String categorie, long fixe, String pctStr,
                                       long ca, long attendu) {
        Contribuable c = new Contribuable();
        SecteurActivite s = new SecteurActivite();
        s.setCategorie(categorie);
        s.setCode("TEST");
        s.setLibelle(nom);
        s.setMinFixeAr(fixe);
        s.setMinPctCa(new BigDecimal(pctStr));
        c.setSecteur(s);

        // Nouvelle signature a 8 parametres
        ResultatCalculIR r = service.calculer(
                c,
                ca,   // caHt
                0L,   // totalCharges
                0L,   // totalChargesSansFacture
                0L,   // totalReintegrations
                0L,   // totalDeductions
                0L,   // deficitDisponible
                0L    // acomptesVerses
        );

        Map<String, Object> m = new HashMap<>();
        m.put("cas", nom);
        m.put("ca", ca);
        m.put("minimumCalcule", r.getMinimumPerception());
        m.put("minimumAttendu", attendu);
        m.put("ok", r.getMinimumPerception() == attendu);
        return m;
    }
}
