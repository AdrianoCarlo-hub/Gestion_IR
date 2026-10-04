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
import java.time.LocalDateTime;

@Entity
@Table(name = "deficit")
public class Deficit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_deficit")
    private Long idDeficit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_contribuable", nullable = false)
    private Contribuable contribuable;

    @Column(name = "annee_origine", nullable = false)
    private Integer anneeOrigine;

    @Column(name = "montant_initial", nullable = false)
    private Long montantInitial;

    @Column(name = "montant_utilise", nullable = false)
    private Long montantUtilise;

    @Column(name = "solde", nullable = false)
    private Long solde;

    @Column(name = "annee_expiration", nullable = false)
    private Integer anneeExpiration;

    @Column(name = "statut", nullable = false, length = 20)
    private String statut;

    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation;

    public Deficit() {
    }

    public Long getIdDeficit() {
        return idDeficit;
    }

    public void setIdDeficit(Long idDeficit) {
        this.idDeficit = idDeficit;
    }

    public Contribuable getContribuable() {
        return contribuable;
    }

    public void setContribuable(Contribuable contribuable) {
        this.contribuable = contribuable;
    }

    public Integer getAnneeOrigine() {
        return anneeOrigine;
    }

    public void setAnneeOrigine(Integer anneeOrigine) {
        this.anneeOrigine = anneeOrigine;
    }

    public Long getMontantInitial() {
        return montantInitial;
    }

    public void setMontantInitial(Long montantInitial) {
        this.montantInitial = montantInitial;
    }

    public Long getMontantUtilise() {
        return montantUtilise;
    }

    public void setMontantUtilise(Long montantUtilise) {
        this.montantUtilise = montantUtilise;
    }

    public Long getSolde() {
        return solde;
    }

    public void setSolde(Long solde) {
        this.solde = solde;
    }

    public Integer getAnneeExpiration() {
        return anneeExpiration;
    }

    public void setAnneeExpiration(Integer anneeExpiration) {
        this.anneeExpiration = anneeExpiration;
    }

    public String getStatut() {
        return statut;
    }

    public void setStatut(String statut) {
        this.statut = statut;
    }

    public LocalDateTime getDateCreation() {
        return dateCreation;
    }

    public void setDateCreation(LocalDateTime dateCreation) {
        this.dateCreation = dateCreation;
    }
}
