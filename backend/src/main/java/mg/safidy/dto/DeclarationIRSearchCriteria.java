package mg.safidy.dto;

import java.time.LocalDate;
import java.util.List;

public class DeclarationIRSearchCriteria {
    
    private Integer annee;
    private String statut;
    private Long idContribuable;
    private String nomContribuable;
    private Long idAgent;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private LocalDate dateDepotFrom;
    private LocalDate dateDepotTo;
    private LocalDate dateCreationFrom;
    private LocalDate dateCreationTo;
    private Long caHtMin;
    private Long caHtMax;
    private Long irDuMin;
    private Long irDuMax;
    private Long soldeAPayerMin;
    private Long soldeAPayerMax;
    private Integer moisActifs;
    
    // Getters and Setters
    
    public Integer getAnnee() {
        return annee;
    }

    public void setAnnee(Integer annee) {
        this.annee = annee;
    }

    public String getStatut() {
        return statut;
    }

    public void setStatut(String statut) {
        this.statut = statut;
    }

    public Long getIdContribuable() {
        return idContribuable;
    }

    public void setIdContribuable(Long idContribuable) {
        this.idContribuable = idContribuable;
    }

    public String getNomContribuable() {
        return nomContribuable;
    }

    public void setNomContribuable(String nomContribuable) {
        this.nomContribuable = nomContribuable;
    }

    public Long getIdAgent() {
        return idAgent;
    }

    public void setIdAgent(Long idAgent) {
        this.idAgent = idAgent;
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

    public LocalDate getDateDepotFrom() {
        return dateDepotFrom;
    }

    public void setDateDepotFrom(LocalDate dateDepotFrom) {
        this.dateDepotFrom = dateDepotFrom;
    }

    public LocalDate getDateDepotTo() {
        return dateDepotTo;
    }

    public void setDateDepotTo(LocalDate dateDepotTo) {
        this.dateDepotTo = dateDepotTo;
    }

    public LocalDate getDateCreationFrom() {
        return dateCreationFrom;
    }

    public void setDateCreationFrom(LocalDate dateCreationFrom) {
        this.dateCreationFrom = dateCreationFrom;
    }

    public LocalDate getDateCreationTo() {
        return dateCreationTo;
    }

    public void setDateCreationTo(LocalDate dateCreationTo) {
        this.dateCreationTo = dateCreationTo;
    }

    public Long getCaHtMin() {
        return caHtMin;
    }

    public void setCaHtMin(Long caHtMin) {
        this.caHtMin = caHtMin;
    }

    public Long getCaHtMax() {
        return caHtMax;
    }

    public void setCaHtMax(Long caHtMax) {
        this.caHtMax = caHtMax;
    }

    public Long getIrDuMin() {
        return irDuMin;
    }

    public void setIrDuMin(Long irDuMin) {
        this.irDuMin = irDuMin;
    }

    public Long getIrDuMax() {
        return irDuMax;
    }

    public void setIrDuMax(Long irDuMax) {
        this.irDuMax = irDuMax;
    }

    public Long getSoldeAPayerMin() {
        return soldeAPayerMin;
    }

    public void setSoldeAPayerMin(Long soldeAPayerMin) {
        this.soldeAPayerMin = soldeAPayerMin;
    }

    public Long getSoldeAPayerMax() {
        return soldeAPayerMax;
    }

    public void setSoldeAPayerMax(Long soldeAPayerMax) {
        this.soldeAPayerMax = soldeAPayerMax;
    }

    public Integer getMoisActifs() {
        return moisActifs;
    }

    public void setMoisActifs(Integer moisActifs) {
        this.moisActifs = moisActifs;
    }
}
