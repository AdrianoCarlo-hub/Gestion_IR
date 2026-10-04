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
@Table(name = "paiement")
public class Paiement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_paiement")
    private Long idPaiement;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_contribuable", nullable = false)
    private Contribuable contribuable;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_declaration")
    private DeclarationIR declaration;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_acompte")
    private Acompte acompte;

    @Column(name = "type_paiement", nullable = false, length = 20)
    private String typePaiement;

    @Column(name = "montant_ar", nullable = false)
    private Long montantAr;

    @Column(name = "date_paiement", nullable = false)
    private LocalDate datePaiement;

    @Column(name = "mode", nullable = false, length = 20)
    private String mode;

    @Column(name = "reference_quittance", nullable = false, unique = true, length = 25)
    private String referenceQuittance;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_agent", nullable = false)
    private Agent agent;

    @Column(name = "annule", nullable = false)
    private Boolean annule;

    @Column(name = "motif_annulation", length = 200)
    private String motifAnnulation;

    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation;

    public Paiement() {
    }

    public Long getIdPaiement() {
        return idPaiement;
    }

    public void setIdPaiement(Long idPaiement) {
        this.idPaiement = idPaiement;
    }

    public Contribuable getContribuable() {
        return contribuable;
    }

    public void setContribuable(Contribuable contribuable) {
        this.contribuable = contribuable;
    }

    public DeclarationIR getDeclaration() {
        return declaration;
    }

    public void setDeclaration(DeclarationIR declaration) {
        this.declaration = declaration;
    }

    public Acompte getAcompte() {
        return acompte;
    }

    public void setAcompte(Acompte acompte) {
        this.acompte = acompte;
    }

    public String getTypePaiement() {
        return typePaiement;
    }

    public void setTypePaiement(String typePaiement) {
        this.typePaiement = typePaiement;
    }

    public Long getMontantAr() {
        return montantAr;
    }

    public void setMontantAr(Long montantAr) {
        this.montantAr = montantAr;
    }

    public LocalDate getDatePaiement() {
        return datePaiement;
    }

    public void setDatePaiement(LocalDate datePaiement) {
        this.datePaiement = datePaiement;
    }

    public String getMode() {
        return mode;
    }

    public void setMode(String mode) {
        this.mode = mode;
    }

    public String getReferenceQuittance() {
        return referenceQuittance;
    }

    public void setReferenceQuittance(String referenceQuittance) {
        this.referenceQuittance = referenceQuittance;
    }

    public Agent getAgent() {
        return agent;
    }

    public void setAgent(Agent agent) {
        this.agent = agent;
    }

    public Boolean getAnnule() {
        return annule;
    }

    public void setAnnule(Boolean annule) {
        this.annule = annule;
    }

    public String getMotifAnnulation() {
        return motifAnnulation;
    }

    public void setMotifAnnulation(String motifAnnulation) {
        this.motifAnnulation = motifAnnulation;
    }

    public LocalDateTime getDateCreation() {
        return dateCreation;
    }

    public void setDateCreation(LocalDateTime dateCreation) {
        this.dateCreation = dateCreation;
    }
}
