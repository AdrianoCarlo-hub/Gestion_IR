package mg.safidy.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "secteur_activite")
public class SecteurActivite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_secteur")
    private Long idSecteur;

    @Column(name = "code", nullable = false, unique = true, length = 30)
    private String code;

    @Column(name = "libelle", nullable = false, length = 100)
    private String libelle;

    @Column(name = "categorie", nullable = false, length = 20)
    private String categorie;

    @Column(name = "min_fixe_ar", nullable = false)
    private Long minFixeAr;

    @Column(name = "min_pct_ca", nullable = false, precision = 5, scale = 4)
    private BigDecimal minPctCa;

    @Column(name = "taux_ir", precision = 5, scale = 2)
    private BigDecimal tauxIr;

    @Column(name = "actif", nullable = false)
    private Boolean actif;

    public SecteurActivite() {
    }

    public Long getIdSecteur() {
        return idSecteur;
    }

    public void setIdSecteur(Long idSecteur) {
        this.idSecteur = idSecteur;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getLibelle() {
        return libelle;
    }

    public void setLibelle(String libelle) {
        this.libelle = libelle;
    }

    public String getCategorie() {
        return categorie;
    }

    public void setCategorie(String categorie) {
        this.categorie = categorie;
    }

    public Long getMinFixeAr() {
        return minFixeAr;
    }

    public void setMinFixeAr(Long minFixeAr) {
        this.minFixeAr = minFixeAr;
    }

    public BigDecimal getMinPctCa() {
        return minPctCa;
    }

    public void setMinPctCa(BigDecimal minPctCa) {
        this.minPctCa = minPctCa;
    }

    public BigDecimal getTauxIr() {
        return tauxIr;
    }

    public void setTauxIr(BigDecimal tauxIr) {
        this.tauxIr = tauxIr;
    }

    public Boolean getActif() {
        return actif;
    }

    public void setActif(Boolean actif) {
        this.actif = actif;
    }
}
