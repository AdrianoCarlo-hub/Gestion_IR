package mg.safidy.service;

import mg.safidy.dto.ResultatCalculIR;
import mg.safidy.model.Contribuable;
import mg.safidy.model.ParametreFiscal;
import mg.safidy.model.SecteurActivite;
import mg.safidy.repository.ParametreFiscalRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class IRCalculationService {

    private final ParametreFiscalRepository parametreRepository;

    public IRCalculationService(ParametreFiscalRepository parametreRepository) {
        this.parametreRepository = parametreRepository;
    }

    public ResultatCalculIR calculer(
            Contribuable contribuable,
            Long caHt,
            Long totalCharges,
            Long totalReintegrations,
            Long totalDeductions,
            Long deficitDisponible,
            Long acomptesVerses) {

        if (caHt == null) caHt = 0L;
        if (totalCharges == null) totalCharges = 0L;
        if (totalReintegrations == null) totalReintegrations = 0L;
        if (totalDeductions == null) totalDeductions = 0L;
        if (deficitDisponible == null) deficitDisponible = 0L;
        if (acomptesVerses == null) acomptesVerses = 0L;

        ResultatCalculIR r = new ResultatCalculIR();
        r.setCaHt(caHt);
        r.setTotalCharges(totalCharges);
        r.setTotalReintegrations(totalReintegrations);
        r.setTotalDeductions(totalDeductions);
        r.setAcomptesVerses(acomptesVerses);

        // Etape 1 : resultat comptable = CA - charges
        long resultatComptable = caHt - totalCharges;
        r.setResultatComptable(resultatComptable);

        // Etape 2 : base avant deficit
        long baseAvantDeficit = resultatComptable + totalReintegrations - totalDeductions;
        r.setBaseAvantDeficit(baseAvantDeficit);

        // Etape 3 : imputation du deficit (jamais plus que la base)
        long deficitImpute = 0L;
        if (baseAvantDeficit > 0 && deficitDisponible > 0) {
            deficitImpute = Math.min(baseAvantDeficit, deficitDisponible);
        }
        r.setDeficitImpute(deficitImpute);

        long baseApresDeficit = baseAvantDeficit - deficitImpute;
        if (baseApresDeficit < 0) baseApresDeficit = 0;

        // Etape 4 : IR brut = base arrondie au millier inferieur * 20%
        long baseArrondie = (baseApresDeficit / 1000L) * 1000L;
        r.setBaseImposable(baseArrondie);

        BigDecimal tauxIr = getTaux("TAUX_IR", new BigDecimal("20"));
        long irBrut = 0L;
        if (baseArrondie > 0) {
            irBrut = BigDecimal.valueOf(baseArrondie)
                    .multiply(tauxIr)
                    .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP)
                    .longValue();
        }
        r.setIrBrut(irBrut);

        // Etape 5 : minimum de perception
        long minimum = calculerMinimumPerception(contribuable, caHt);
        r.setMinimumPerception(minimum);

        // Etape 6 : IR du = max(IR brut ; minimum)
        long irDu = Math.max(irBrut, minimum);
        r.setIrDu(irDu);

        // Etape 7 : solde = IR du - acomptes verses
        long solde = irDu - acomptesVerses;
        if (solde >= 0) {
            r.setSoldeAPayer(solde);
            r.setCreditImpot(0L);
        } else {
            r.setSoldeAPayer(0L);
            r.setCreditImpot(-solde);
        }

        return r;
    }

    private long calculerMinimumPerception(Contribuable contribuable, long caHt) {
        if (contribuable == null || contribuable.getSecteur() == null) {
            return 0L;
        }
        SecteurActivite secteur = contribuable.getSecteur();
        long fixe = secteur.getMinFixeAr() == null ? 0L : secteur.getMinFixeAr();
        BigDecimal pct = secteur.getMinPctCa() == null ? BigDecimal.ZERO : secteur.getMinPctCa();

        long variable = pct.multiply(BigDecimal.valueOf(caHt))
                .setScale(0, RoundingMode.HALF_UP)
                .longValue();

        return fixe + variable;
    }

    public BigDecimal getTaux(String code, BigDecimal defaut) {
        return parametreRepository.findByCode(code)
                .map(ParametreFiscal::getValeur)
                .orElse(defaut);
    }
}
