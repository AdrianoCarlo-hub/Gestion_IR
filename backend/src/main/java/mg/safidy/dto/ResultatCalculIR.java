package mg.safidy.dto;

import java.math.BigDecimal;

public class ResultatCalculIR {

    private BigDecimal tauxApplique;
    private Long caHt;
    private Long totalCharges;
    private Long totalChargesSansFacture;
    private Long resultatComptable;
    private Long totalReintegrations;
    private Long totalDeductions;
    private Long deficitImpute;
    private Long deficitGenere;
    private Long baseAvantDeficit;
    private Long baseImposable;
    private Long irBrut;
    private Long minimumPerception;
    private Long irDu;
    private Long acomptesVerses;
    private Long penalitesDues;
    private Long premierAcompte;
    private Long totalAPayer;
    private Long soldeAPayer;
    private Long creditImpot;

    public ResultatCalculIR() {
    }

    public BigDecimal getTauxApplique() {
        return tauxApplique;
    }

    public void setTauxApplique(BigDecimal tauxApplique) {
        this.tauxApplique = tauxApplique;
    }

    public Long getCaHt() {
        return caHt;
    }

    public void setCaHt(Long caHt) {
        this.caHt = caHt;
    }

    public Long getTotalCharges() {
        return totalCharges;
    }

    public void setTotalCharges(Long totalCharges) {
        this.totalCharges = totalCharges;
    }

    public Long getTotalChargesSansFacture() {
        return totalChargesSansFacture;
    }

    public void setTotalChargesSansFacture(Long totalChargesSansFacture) {
        this.totalChargesSansFacture = totalChargesSansFacture;
    }

    public Long getResultatComptable() {
        return resultatComptable;
    }

    public void setResultatComptable(Long resultatComptable) {
        this.resultatComptable = resultatComptable;
    }

    public Long getTotalReintegrations() {
        return totalReintegrations;
    }

    public void setTotalReintegrations(Long totalReintegrations) {
        this.totalReintegrations = totalReintegrations;
    }

    public Long getTotalDeductions() {
        return totalDeductions;
    }

    public void setTotalDeductions(Long totalDeductions) {
        this.totalDeductions = totalDeductions;
    }

    public Long getDeficitImpute() {
        return deficitImpute;
    }

    public void setDeficitImpute(Long deficitImpute) {
        this.deficitImpute = deficitImpute;
    }

    public Long getDeficitGenere() {
        return deficitGenere;
    }

    public void setDeficitGenere(Long deficitGenere) {
        this.deficitGenere = deficitGenere;
    }

    public Long getBaseAvantDeficit() {
        return baseAvantDeficit;
    }

    public void setBaseAvantDeficit(Long baseAvantDeficit) {
        this.baseAvantDeficit = baseAvantDeficit;
    }

    public Long getBaseImposable() {
        return baseImposable;
    }

    public void setBaseImposable(Long baseImposable) {
        this.baseImposable = baseImposable;
    }

    public Long getIrBrut() {
        return irBrut;
    }

    public void setIrBrut(Long irBrut) {
        this.irBrut = irBrut;
    }

    public Long getMinimumPerception() {
        return minimumPerception;
    }

    public void setMinimumPerception(Long minimumPerception) {
        this.minimumPerception = minimumPerception;
    }

    public Long getIrDu() {
        return irDu;
    }

    public void setIrDu(Long irDu) {
        this.irDu = irDu;
    }

    public Long getAcomptesVerses() {
        return acomptesVerses;
    }

    public void setAcomptesVerses(Long acomptesVerses) {
        this.acomptesVerses = acomptesVerses;
    }

    public Long getPenalitesDues() {
        return penalitesDues;
    }

    public void setPenalitesDues(Long penalitesDues) {
        this.penalitesDues = penalitesDues;
    }

    public Long getPremierAcompte() {
        return premierAcompte;
    }

    public void setPremierAcompte(Long premierAcompte) {
        this.premierAcompte = premierAcompte;
    }

    public Long getTotalAPayer() {
        return totalAPayer;
    }

    public void setTotalAPayer(Long totalAPayer) {
        this.totalAPayer = totalAPayer;
    }

    public Long getSoldeAPayer() {
        return soldeAPayer;
    }

    public void setSoldeAPayer(Long soldeAPayer) {
        this.soldeAPayer = soldeAPayer;
    }

    public Long getCreditImpot() {
        return creditImpot;
    }

    public void setCreditImpot(Long creditImpot) {
        this.creditImpot = creditImpot;
    }
}
