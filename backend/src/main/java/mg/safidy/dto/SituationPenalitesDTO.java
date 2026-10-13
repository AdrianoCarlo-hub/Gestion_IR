package mg.safidy.dto;

import java.util.ArrayList;
import java.util.List;

/**
 * Situation consolidee des penalites d'un contribuable (KPI + decomptes detailles).
 */
public class SituationPenalitesDTO {

    private Long idContribuable;
    private Integer annee;

    private long totalDu;
    private long totalAmendesDepot;
    private long totalMajorations;
    private long totalAmendesSpecifiques;
    private long totalPayees;

    private List<DetailPenaliteDTO> penalites = new ArrayList<>();

    public SituationPenalitesDTO() {
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

    public long getTotalDu() {
        return totalDu;
    }

    public void setTotalDu(long totalDu) {
        this.totalDu = totalDu;
    }

    public long getTotalAmendesDepot() {
        return totalAmendesDepot;
    }

    public void setTotalAmendesDepot(long totalAmendesDepot) {
        this.totalAmendesDepot = totalAmendesDepot;
    }

    public long getTotalMajorations() {
        return totalMajorations;
    }

    public void setTotalMajorations(long totalMajorations) {
        this.totalMajorations = totalMajorations;
    }

    public long getTotalAmendesSpecifiques() {
        return totalAmendesSpecifiques;
    }

    public void setTotalAmendesSpecifiques(long totalAmendesSpecifiques) {
        this.totalAmendesSpecifiques = totalAmendesSpecifiques;
    }

    public long getTotalPayees() {
        return totalPayees;
    }

    public void setTotalPayees(long totalPayees) {
        this.totalPayees = totalPayees;
    }

    public List<DetailPenaliteDTO> getPenalites() {
        return penalites;
    }

    public void setPenalites(List<DetailPenaliteDTO> penalites) {
        this.penalites = penalites;
    }
}
