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

    /**
     * Calcul complet de l'IR.
     *
     * Les reintegrations sont celles declarees explicitement par l'utilisateur.
     * Les charges sans justificatif ne sont pas reintegrees automatiquement.
     *
     * Le minimum de perception est proratise selon les mois actifs (regle SU6) :
     * minimum = part fixe x mois actifs / 12 + % du CA realise.
     */
    public ResultatCalculIR calculer(
            Contribuable contribuable,
            Long caHt,
            Long totalCharges,
            Long totalChargesSansFacture,
            Long totalReintegrations,
            Long totalDeductions,
            Long deficitDisponible,
            Long acomptesVerses) {
        return calculer(contribuable, caHt, totalCharges, totalChargesSansFacture,
                totalReintegrations, totalDeductions, deficitDisponible, acomptesVerses, 12);
    }

    public ResultatCalculIR calculer(
            Contribuable contribuable,
            Long caHt,
            Long totalCharges,
            Long totalChargesSansFacture,
            Long totalReintegrations,
            Long totalDeductions,
            Long deficitDisponible,
            Long acomptesVerses,
            Integer moisActifs) {
        return calculer(contribuable, caHt, totalCharges, totalChargesSansFacture,
                totalReintegrations, totalDeductions, deficitDisponible, acomptesVerses,
                moisActifs, 0L);
    }

    /**
     * Calcul complet de l'IR avec le nouveau solde :
     *
     *   SOLDE TOTAL A PAYER = IR du + penalites dues + 1er acompte (50 % de l'IR du)
     *                          - acomptes deja verses
     *
     * La penalite est doublement prise en compte (regle voulue) :
     *   - elle augmente la base imposable via les reinTEGRATIONS ;
     *   - elle s'ajoute au montant a payer (sanction fiscale non deductible).
     */
    public ResultatCalculIR calculer(
            Contribuable contribuable,
            Long caHt,
            Long totalCharges,
            Long totalChargesSansFacture,
            Long totalReintegrations,
            Long totalDeductions,
            Long deficitDisponible,
            Long acomptesVerses,
            Integer moisActifs,
            Long penalitesDues) {

        if (caHt == null) caHt = 0L;
        if (totalCharges == null) totalCharges = 0L;
        if (totalChargesSansFacture == null) totalChargesSansFacture = 0L;
        if (totalReintegrations == null) totalReintegrations = 0L;
        if (totalDeductions == null) totalDeductions = 0L;
        if (deficitDisponible == null) deficitDisponible = 0L;
        if (acomptesVerses == null) acomptesVerses = 0L;
        if (moisActifs == null) moisActifs = 12;
        if (moisActifs < 0) moisActifs = 0;
        if (moisActifs > 12) moisActifs = 12;
        if (penalitesDues == null) penalitesDues = 0L;
        if (penalitesDues < 0) penalitesDues = 0L;

        ResultatCalculIR r = new ResultatCalculIR();

        // Regime unique REEL_OBLIGATOIRE : toujours le taux de droit commun.
        BigDecimal tauxIr = getTaux("TAUX_IR", new BigDecimal("20"));
        r.setTauxApplique(tauxIr);

        r.setCaHt(caHt);
        r.setTotalCharges(totalCharges);
        r.setTotalChargesSansFacture(totalChargesSansFacture);
        r.setTotalDeductions(totalDeductions);
        r.setAcomptesVerses(acomptesVerses);
        r.setPenalitesDues(penalitesDues);

        // Etape 1 : resultat comptable
        long resultatComptable = caHt - totalCharges;
        r.setResultatComptable(resultatComptable);

        // Seules les reintegrations explicites sont ajoutees au resultat comptable.
        long reintegrationsEffectives = totalReintegrations;
        r.setTotalReintegrations(reintegrationsEffectives);
        r.setTotalChargesSansFacture(0L);

        // Etape 2 : base avant deficit
        long baseAvantDeficit = resultatComptable + reintegrationsEffectives - totalDeductions;
        r.setBaseAvantDeficit(baseAvantDeficit);

        // Etape 3 : imputation du deficit
        long deficitImpute = 0L;
        long deficitGenere = 0L;

        if (baseAvantDeficit < 0) {
            // Generation automatique de deficit
            deficitGenere = Math.abs(baseAvantDeficit);
            r.setDeficitImpute(0L);
            r.setDeficitGenere(deficitGenere);
            r.setBaseImposable(0L);
            r.setIrBrut(0L);
        } else {
            // Imputation du deficit disponible
            if (deficitDisponible > 0) {
                deficitImpute = Math.min(baseAvantDeficit, deficitDisponible);
            }
            r.setDeficitImpute(deficitImpute);
            r.setDeficitGenere(0L);

            long baseApresDeficit = baseAvantDeficit - deficitImpute;
            if (baseApresDeficit < 0) baseApresDeficit = 0;

            // Etape 4 : base arrondie au millier inferieur
            long baseArrondie = (baseApresDeficit / 1000L) * 1000L;
            r.setBaseImposable(baseArrondie);

            // Etape 5 : IR brut
            long irBrut = 0L;
            if (baseArrondie > 0) {
                irBrut = BigDecimal.valueOf(baseArrondie)
                        .multiply(tauxIr)
                        .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP)
                        .longValue();
            }
            r.setIrBrut(irBrut);
        }

        // Etape 6 : minimum de perception (proratise selon les mois actifs)
        long minimum = calculerMinimumPerception(contribuable, caHt, moisActifs);
        r.setMinimumPerception(minimum);

        // Etape 7 : IR du = max(IR brut ; minimum)
        long irDu = Math.max(r.getIrBrut() == null ? 0L : r.getIrBrut(), minimum);
        r.setIrDu(irDu);

        // Etape 8 : 1er acompte de l'annee N+1 = taux (50 %) x IR du
        BigDecimal tauxAcompte = getTaux("TAUX_ACOMPTE", new BigDecimal("50"));
        long premierAcompte = BigDecimal.valueOf(irDu)
                .multiply(tauxAcompte)
                .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP)
                .longValue();
        r.setPremierAcompte(premierAcompte);

        // Etape 9 : SOLDE TOTAL A PAYER
        //   IR du + penalites dues + 1er acompte N+1 - acomptes verses
        long total = irDu + penalitesDues + premierAcompte - acomptesVerses;
        if (total >= 0) {
            r.setTotalAPayer(total);
            r.setSoldeAPayer(total);
            r.setCreditImpot(0L);
        } else {
            r.setTotalAPayer(0L);
            r.setSoldeAPayer(0L);
            r.setCreditImpot(-total);
        }

        return r;
    }

    private long calculerMinimumPerception(Contribuable contribuable, long caHt, int moisActifs) {
        if (contribuable == null || contribuable.getSecteur() == null) {
            return 0L;
        }
        SecteurActivite secteur = contribuable.getSecteur();
        long fixe = secteur.getMinFixeAr() == null ? 0L : secteur.getMinFixeAr();
        BigDecimal pct = secteur.getMinPctCa() == null ? BigDecimal.ZERO : secteur.getMinPctCa();

        // Regle SU6 : part fixe x mois actifs / 12
        long fixeProrata = BigDecimal.valueOf(fixe)
                .multiply(BigDecimal.valueOf(moisActifs))
                .divide(BigDecimal.valueOf(12), 0, RoundingMode.HALF_UP)
                .longValue();

        // % du CA realise
        long variable = pct.multiply(BigDecimal.valueOf(caHt))
                .setScale(0, RoundingMode.HALF_UP)
                .longValue();

        return fixeProrata + variable;
    }

    public BigDecimal getTaux(String code, BigDecimal defaut) {
        return parametreRepository.findByCode(code)
                .map(ParametreFiscal::getValeur)
                .orElse(defaut);
    }
}
