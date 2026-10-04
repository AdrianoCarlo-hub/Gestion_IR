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
@Table(name = "suspension_activite")
public class SuspensionActivite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_suspension")
    private Long idSuspension;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_contribuable", nullable = false)
    private Contribuable contribuable;

    @Column(name = "date_arret", nullable = false)
    private LocalDate dateArret;

    @Column(name = "date_reprise")
    private LocalDate dateReprise;

    @Column(name = "motif", nullable = false, length = 30)
    private String motif;

    @Column(name = "ref_declaration", length = 30)
    private String refDeclaration;

    @Column(name = "statut", nullable = false, length = 20)
    private String statut;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_agent_arret", nullable = false)
    private Agent agentArret;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_agent_reprise")
    private Agent agentReprise;

    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation;

    public SuspensionActivite() {
    }

    public Long getIdSuspension() {
        return idSuspension;
    }

    public void setIdSuspension(Long idSuspension) {
        this.idSuspension = idSuspension;
    }

    public Contribuable getContribuable() {
        return contribuable;
    }

    public void setContribuable(Contribuable contribuable) {
        this.contribuable = contribuable;
    }

    public LocalDate getDateArret() {
        return dateArret;
    }

    public void setDateArret(LocalDate dateArret) {
        this.dateArret = dateArret;
    }

    public LocalDate getDateReprise() {
        return dateReprise;
    }

    public void setDateReprise(LocalDate dateReprise) {
        this.dateReprise = dateReprise;
    }

    public String getMotif() {
        return motif;
    }

    public void setMotif(String motif) {
        this.motif = motif;
    }

    public String getRefDeclaration() {
        return refDeclaration;
    }

    public void setRefDeclaration(String refDeclaration) {
        this.refDeclaration = refDeclaration;
    }

    public String getStatut() {
        return statut;
    }

    public void setStatut(String statut) {
        this.statut = statut;
    }

    public Agent getAgentArret() {
        return agentArret;
    }

    public void setAgentArret(Agent agentArret) {
        this.agentArret = agentArret;
    }

    public Agent getAgentReprise() {
        return agentReprise;
    }

    public void setAgentReprise(Agent agentReprise) {
        this.agentReprise = agentReprise;
    }

    public LocalDateTime getDateCreation() {
        return dateCreation;
    }

    public void setDateCreation(LocalDateTime dateCreation) {
        this.dateCreation = dateCreation;
    }
}
