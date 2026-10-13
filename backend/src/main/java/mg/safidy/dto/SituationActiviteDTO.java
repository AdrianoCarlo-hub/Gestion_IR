package mg.safidy.dto;

import java.util.ArrayList;
import java.util.List;

/**
 * Situation d'activite d'un contribuable : statut courant + historique.
 */
public class SituationActiviteDTO {

    private Long idContribuable;
    private String statutActuel;
    private int moisActifs;
    private Long idSuspensionEnCours;
    private String typeEvenementEnCours;

    private List<DetailSuspensionDTO> historique = new ArrayList<>();

    public SituationActiviteDTO() {
    }

    public Long getIdContribuable() {
        return idContribuable;
    }

    public void setIdContribuable(Long idContribuable) {
        this.idContribuable = idContribuable;
    }

    public String getStatutActuel() {
        return statutActuel;
    }

    public void setStatutActuel(String statutActuel) {
        this.statutActuel = statutActuel;
    }

    public int getMoisActifs() {
        return moisActifs;
    }

    public void setMoisActifs(int moisActifs) {
        this.moisActifs = moisActifs;
    }

    public Long getIdSuspensionEnCours() {
        return idSuspensionEnCours;
    }

    public void setIdSuspensionEnCours(Long idSuspensionEnCours) {
        this.idSuspensionEnCours = idSuspensionEnCours;
    }

    public String getTypeEvenementEnCours() {
        return typeEvenementEnCours;
    }

    public void setTypeEvenementEnCours(String typeEvenementEnCours) {
        this.typeEvenementEnCours = typeEvenementEnCours;
    }

    public List<DetailSuspensionDTO> getHistorique() {
        return historique;
    }

    public void setHistorique(List<DetailSuspensionDTO> historique) {
        this.historique = historique;
    }
}
