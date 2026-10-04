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

@Entity
@Table(name = "ajustement_fiscal")
public class AjustementFiscal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_ajustement")
    private Long idAjustement;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_declaration", nullable = false)
    private DeclarationIR declaration;

    @Column(name = "type", nullable = false, length = 20)
    private String type;

    @Column(name = "motif", nullable = false, length = 30)
    private String motif;

    @Column(name = "montant_ar", nullable = false)
    private Long montantAr;

    @Column(name = "article_ref", length = 30)
    private String articleRef;

    public AjustementFiscal() {
    }

    public Long getIdAjustement() {
        return idAjustement;
    }

    public void setIdAjustement(Long idAjustement) {
        this.idAjustement = idAjustement;
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

    public String getMotif() {
        return motif;
    }

    public void setMotif(String motif) {
        this.motif = motif;
    }

    public Long getMontantAr() {
        return montantAr;
    }

    public void setMontantAr(Long montantAr) {
        this.montantAr = montantAr;
    }

    public String getArticleRef() {
        return articleRef;
    }

    public void setArticleRef(String articleRef) {
        this.articleRef = articleRef;
    }
}
