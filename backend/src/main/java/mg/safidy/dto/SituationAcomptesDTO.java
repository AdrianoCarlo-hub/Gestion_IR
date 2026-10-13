package mg.safidy.dto;

import mg.safidy.model.Acompte;
import java.util.ArrayList;
import java.util.List;

/**
 * Situation complete des acomptes d'un contribuable pour une annee.
 * Sert de support au Bloc 1 (KPI) et aux blocs 2/3 (provisionnels / douane).
 */
public class SituationAcomptesDTO {

    private Long idContribuable;
    private Integer annee;

    private Long irN1;
    private Long totalExigibles;
    private Long cumulVerse;
    private Long solde;
    private Long creditImpot;

    private List<Acompte> creation = new ArrayList<>();
    private List<Acompte> provisionnels = new ArrayList<>();
    private List<Acompte> douane = new ArrayList<>();

    public SituationAcomptesDTO() {
    }

    public Long getIdContribuable() {
        return idContribuable;
    }

    public void setIdContribuable(Long idContribuable) {
        this.idContribuable = idContribuable;
    }

    public Integer getAnnee() {
        return annee;
    }

    public void setAnnee(Integer annee) {
        this.annee = annee;
    }

    public Long getIrN1() {
        return irN1;
    }

    public void setIrN1(Long irN1) {
        this.irN1 = irN1;
    }

    public Long getTotalExigibles() {
        return totalExigibles;
    }

    public void setTotalExigibles(Long totalExigibles) {
        this.totalExigibles = totalExigibles;
    }

    public Long getCumulVerse() {
        return cumulVerse;
    }

    public void setCumulVerse(Long cumulVerse) {
        this.cumulVerse = cumulVerse;
    }

    public Long getSolde() {
        return solde;
    }

    public void setSolde(Long solde) {
        this.solde = solde;
    }

    public Long getCreditImpot() {
        return creditImpot;
    }

    public void setCreditImpot(Long creditImpot) {
        this.creditImpot = creditImpot;
    }

    public List<Acompte> getCreation() {
        return creation;
    }

    public void setCreation(List<Acompte> creation) {
        this.creation = creation;
    }

    public List<Acompte> getProvisionnels() {
        return provisionnels;
    }

    public void setProvisionnels(List<Acompte> provisionnels) {
        this.provisionnels = provisionnels;
    }

    public List<Acompte> getDouane() {
        return douane;
    }

    public void setDouane(List<Acompte> douane) {
        this.douane = douane;
    }
}
