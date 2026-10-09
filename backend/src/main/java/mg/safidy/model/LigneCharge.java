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
@Table(name = "ligne_charge")
public class LigneCharge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_ligne")
    private Long idLigne;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_declaration", nullable = false)
    private DeclarationIR declaration;

    @Column(name = "categorie", nullable = false, length = 20)
    private String categorie;

    @Column(name = "categorie_libre", length = 50)
    private String categorieLibre;

    @Column(name = "montant_ar", nullable = false)
    private Long montantAr;

    @Column(name = "justificatif_ref", length = 40)
    private String justificatifRef;

    public LigneCharge() {
    }

    public Long getIdLigne() {
        return idLigne;
    }

    public void setIdLigne(Long idLigne) {
        this.idLigne = idLigne;
    }

    public DeclarationIR getDeclaration() {
        return declaration;
    }

    public void setDeclaration(DeclarationIR declaration) {
        this.declaration = declaration;
    }

    public String getCategorie() {
        return categorie;
    }

    public void setCategorie(String categorie) {
        this.categorie = categorie;
    }

    public String getCategorieLibre() {
        return categorieLibre;
    }

    public void setCategorieLibre(String categorieLibre) {
        this.categorieLibre = categorieLibre;
    }

    public Long getMontantAr() {
        return montantAr;
    }

    public void setMontantAr(Long montantAr) {
        this.montantAr = montantAr;
    }

    public String getJustificatifRef() {
        return justificatifRef;
    }

    public void setJustificatifRef(String justificatifRef) {
        this.justificatifRef = justificatifRef;
    }
}
