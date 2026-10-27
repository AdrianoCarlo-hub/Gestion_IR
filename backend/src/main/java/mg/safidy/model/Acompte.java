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
@Table(name = "acompte")
public class Acompte {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_acompte")
    private Long idAcompte;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_contribuable", nullable = false)
    private Contribuable contribuable;

    @Column(name = "annee", nullable = false)
    private Integer annee;

    @Column(name = "numero", nullable = false)
    private Integer numero;

    @Column(name = "taux_pct", nullable = false)
    private Integer tauxPct;

    @Column(name = "base_ir_n1", nullable = false)
    private Long baseIrN1;

    @Column(name = "montant_ar", nullable = false)
    private Long montantAr;

    @Column(name = "date_echeance", nullable = false)
    private LocalDate dateEcheance;

    @Column(name = "date_paiement")
    private LocalDate datePaiement;

    @Column(name = "statut", nullable = false, length = 20)
    private String statut;

    @Column(name = "type_acompte", nullable = false, length = 20)
    private String typeAcompte;

    @Column(name = "reference_douane", length = 40)
    private String referenceDouane;

    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation;

    public Acompte() {
    }

    public Long getIdAcompte() {
        return idAcompte;
    }

    public void setIdAcompte(Long idAcompte) {
        this.idAcompte = idAcompte;
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

    public Integer getNumero() {
        return numero;
    }

    public void setNumero(Integer numero) {
        this.numero = numero;
    }

    public Integer getTauxPct() {
        return tauxPct;
    }

    public void setTauxPct(Integer tauxPct) {
        this.tauxPct = tauxPct;
    }

    public Long getBaseIrN1() {
        return baseIrN1;
    }

    public void setBaseIrN1(Long baseIrN1) {
        this.baseIrN1 = baseIrN1;
    }

    public Long getMontantAr() {
        return montantAr;
    }

    public void setMontantAr(Long montantAr) {
        this.montantAr = montantAr;
    }

    public LocalDate getDateEcheance() {
        return dateEcheance;
    }

    public void setDateEcheance(LocalDate dateEcheance) {
        this.dateEcheance = dateEcheance;
    }

    public LocalDate getDatePaiement() {
        return datePaiement;
    }

    public void setDatePaiement(LocalDate datePaiement) {
        this.datePaiement = datePaiement;
    }

    public String getStatut() {
        return statut;
    }

    public void setStatut(String statut) {
        this.statut = statut;
    }

    public String getTypeAcompte() {
        return typeAcompte;
    }

    public void setTypeAcompte(String typeAcompte) {
        this.typeAcompte = typeAcompte;
    }

    public String getReferenceDouane() {
        return referenceDouane;
    }

    public void setReferenceDouane(String referenceDouane) {
        this.referenceDouane = referenceDouane;
    }

    public LocalDateTime getDateCreation() {
        return dateCreation;
    }

    public void setDateCreation(LocalDateTime dateCreation) {
        this.dateCreation = dateCreation;
    }
}
