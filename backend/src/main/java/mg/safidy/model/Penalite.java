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
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "penalite")
public class Penalite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_penalite")
    private Long idPenalite;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_declaration", nullable = false)
    private DeclarationIR declaration;

    @Column(name = "type", nullable = false, length = 30)
    private String type;

    @Column(name = "nb_mois", nullable = false)
    private Integer nbMois;

    @Column(name = "taux_pct", nullable = false, precision = 5, scale = 2)
    private BigDecimal tauxPct;

    @Column(name = "montant_ar", nullable = false)
    private Long montantAr;

    @Column(name = "statut", nullable = false, length = 20)
    private String statut;

    @Column(name = "motif", length = 60)
    private String motif;

    @Column(name = "base_calcul_ar")
    private Long baseCalculAr;

    @Column(name = "article_ref", length = 60)
    private String articleRef;

    @Column(name = "date_limite")
    private LocalDate dateLimite;

    @Column(name = "date_regularisation")
    private LocalDate dateRegularisation;

    @Column(name = "motif_annulation", length = 200)
    private String motifAnnulation;

    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation;

    public Penalite() {
    }

    public Long getIdPenalite() {
        return idPenalite;
    }

    public void setIdPenalite(Long idPenalite) {
        this.idPenalite = idPenalite;
    }

    public DeclarationIR getDeclaration() {
        return declaration;
    }

    public void setDeclaration(DeclarationIR declaration) {
        this.declaration = declaration;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Integer getNbMois() {
        return nbMois;
    }

    public void setNbMois(Integer nbMois) {
        this.nbMois = nbMois;
    }

    public BigDecimal getTauxPct() {
        return tauxPct;
    }

    public void setTauxPct(BigDecimal tauxPct) {
        this.tauxPct = tauxPct;
    }

    public Long getMontantAr() {
        return montantAr;
    }

    public void setMontantAr(Long montantAr) {
        this.montantAr = montantAr;
    }

    public String getStatut() {
        return statut;
    }

    public void setStatut(String statut) {
        this.statut = statut;
    }

    public String getMotif() {
        return motif;
    }

    public void setMotif(String motif) {
        this.motif = motif;
    }

    public Long getBaseCalculAr() {
        return baseCalculAr;
    }

    public void setBaseCalculAr(Long baseCalculAr) {
        this.baseCalculAr = baseCalculAr;
    }

    public String getArticleRef() {
        return articleRef;
    }

    public void setArticleRef(String articleRef) {
        this.articleRef = articleRef;
    }

    public LocalDate getDateLimite() {
        return dateLimite;
    }

    public void setDateLimite(LocalDate dateLimite) {
        this.dateLimite = dateLimite;
    }

    public LocalDate getDateRegularisation() {
        return dateRegularisation;
    }

    public void setDateRegularisation(LocalDate dateRegularisation) {
        this.dateRegularisation = dateRegularisation;
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
