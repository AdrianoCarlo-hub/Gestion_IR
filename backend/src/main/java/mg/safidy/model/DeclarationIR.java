package mg.safidy.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "declaration_ir")
public class DeclarationIR {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_declaration")
    private Long idDeclaration;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_contribuable", nullable = false)
    private Contribuable contribuable;

    @Column(name = "annee", nullable = false)
    private Integer annee;

    @Column(name = "date_debut", nullable = false)
    private LocalDate dateDebut;

    @Column(name = "date_fin", nullable = false)
    private LocalDate dateFin;

    @Column(name = "ca_ht", nullable = false)
    private Long caHt;

    @Column(name = "total_charges", nullable = false)
    private Long totalCharges;

    @Column(name = "resultat_comptable", nullable = false)
    private Long resultatComptable;

    @Column(name = "total_reintegrations", nullable = false)
    private Long totalReintegrations;

    @Column(name = "total_deductions", nullable = false)
    private Long totalDeductions;

    @Column(name = "deficit_impute", nullable = false)
    private Long deficitImpute;

    @Column(name = "base_imposable", nullable = false)
    private Long baseImposable;

    @Column(name = "ir_brut", nullable = false)
    private Long irBrut;

    @Column(name = "minimum_perception", nullable = false)
    private Long minimumPerception;

    @Column(name = "ir_du", nullable = false)
    private Long irDu;

    @Column(name = "acomptes_verses", nullable = false)
    private Long acomptesVerses;

    @Column(name = "solde_a_payer", nullable = false)
    private Long soldeAPayer;

    @Column(name = "credit_impot", nullable = false)
    private Long creditImpot;

    @Column(name = "date_limite")
    private LocalDate dateLimite;

    @Column(name = "date_depot")
    private LocalDate dateDepot;

    @Column(name = "mois_actifs", nullable = false)
    private Integer moisActifs;

    @Column(name = "statut", nullable = false, length = 20)
    private String statut;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_agent")
    private Agent agent;

    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation;

    public DeclarationIR() {
    }

    public Long getIdDeclaration() {
        return idDeclaration;
    }

    public void setIdDeclaration(Long idDeclaration) {
        this.idDeclaration = idDeclaration;
    }

    public Contribuable getContribuable() {
        return contribuable;
    }

    public void setContribuable(Contribuable contribuable) {
        this.contribuable = contribuable;
    }

    public Integer getAnnee() {
        return annee;
    }

    public void setAnnee(Integer annee) {
        this.annee = annee;
    }

    public LocalDate getDateDebut() {
        return dateDebut;
    }

    public void setDateDebut(LocalDate dateDebut) {
        this.dateDebut = dateDebut;
    }

    public LocalDate getDateFin() {
        return dateFin;
    }

    public void setDateFin(LocalDate dateFin) {
        this.dateFin = dateFin;
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

    public LocalDate getDateLimite() {
        return dateLimite;
    }

    public void setDateLimite(LocalDate dateLimite) {
        this.dateLimite = dateLimite;
    }

    public LocalDate getDateDepot() {
        return dateDepot;
    }

    public void setDateDepot(LocalDate dateDepot) {
        this.dateDepot = dateDepot;
    }

    public Integer getMoisActifs() {
        return moisActifs;
    }

    public void setMoisActifs(Integer moisActifs) {
        this.moisActifs = moisActifs;
    }

    public String getStatut() {
        return statut;
    }

    public void setStatut(String statut) {
        this.statut = statut;
    }

    public Agent getAgent() {
        return agent;
    }

    public void setAgent(Agent agent) {
        this.agent = agent;
    }

    public LocalDateTime getDateCreation() {
        return dateCreation;
    }

    public void setDateCreation(LocalDateTime dateCreation) {
        this.dateCreation = dateCreation;
    }
}
