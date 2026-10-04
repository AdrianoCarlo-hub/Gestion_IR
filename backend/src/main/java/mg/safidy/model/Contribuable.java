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
@Table(name = "contribuable")
public class Contribuable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_contribuable")
    private Long idContribuable;

    @Column(name = "nif", nullable = false, unique = true, length = 10)
    private String nif;

    @Column(name = "stat", length = 17)
    private String stat;

    @Column(name = "raison_sociale", nullable = false, length = 150)
    private String raisonSociale;

    @Column(name = "forme_juridique", nullable = false, length = 20)
    private String formeJuridique;

    @Column(name = "nom_dirigeant", nullable = false, length = 120)
    private String nomDirigeant;

    @Column(name = "cin_dirigeant", nullable = false, length = 12)
    private String cinDirigeant;

    @Column(name = "adresse", nullable = false, length = 200)
    private String adresse;

    @Column(name = "telephone", length = 20)
    private String telephone;

    @Column(name = "email", length = 120)
    private String email;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_secteur", nullable = false)
    private SecteurActivite secteur;

    @Column(name = "regime", nullable = false, length = 20)
    private String regime;

    @Column(name = "date_immatriculation", nullable = false)
    private LocalDate dateImmatriculation;

    @Column(name = "mois_cloture", nullable = false)
    private Integer moisCloture;

    @Column(name = "statut", nullable = false, length = 20)
    private String statut;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_centre", nullable = false)
    private CentreFiscal centre;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_agent", nullable = false)
    private Agent agent;

    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation;

    public Contribuable() {
    }

    public Long getIdContribuable() {
        return idContribuable;
    }

    public void setIdContribuable(Long idContribuable) {
        this.idContribuable = idContribuable;
    }

    public String getNif() {
        return nif;
    }

    public void setNif(String nif) {
        this.nif = nif;
    }

    public String getStat() {
        return stat;
    }

    public void setStat(String stat) {
        this.stat = stat;
    }

    public String getRaisonSociale() {
        return raisonSociale;
    }

    public void setRaisonSociale(String raisonSociale) {
        this.raisonSociale = raisonSociale;
    }

    public String getFormeJuridique() {
        return formeJuridique;
    }

    public void setFormeJuridique(String formeJuridique) {
        this.formeJuridique = formeJuridique;
    }

    public String getNomDirigeant() {
        return nomDirigeant;
    }

    public void setNomDirigeant(String nomDirigeant) {
        this.nomDirigeant = nomDirigeant;
    }

    public String getCinDirigeant() {
        return cinDirigeant;
    }

    public void setCinDirigeant(String cinDirigeant) {
        this.cinDirigeant = cinDirigeant;
    }

    public String getAdresse() {
        return adresse;
    }

    public void setAdresse(String adresse) {
        this.adresse = adresse;
    }

    public String getTelephone() {
        return telephone;
    }

    public void setTelephone(String telephone) {
        this.telephone = telephone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public SecteurActivite getSecteur() {
        return secteur;
    }

    public void setSecteur(SecteurActivite secteur) {
        this.secteur = secteur;
    }

    public String getRegime() {
        return regime;
    }

    public void setRegime(String regime) {
        this.regime = regime;
    }

    public LocalDate getDateImmatriculation() {
        return dateImmatriculation;
    }

    public void setDateImmatriculation(LocalDate dateImmatriculation) {
        this.dateImmatriculation = dateImmatriculation;
    }

    public Integer getMoisCloture() {
        return moisCloture;
    }

    public void setMoisCloture(Integer moisCloture) {
        this.moisCloture = moisCloture;
    }

    public String getStatut() {
        return statut;
    }

    public void setStatut(String statut) {
        this.statut = statut;
    }

    public CentreFiscal getCentre() {
        return centre;
    }

    public void setCentre(CentreFiscal centre) {
        this.centre = centre;
    }

    public Agent getAgent() {
        return agent;
    }

    public void setAgent(Agent agent) {
        this.agent = agent;
    }

    public LocalDateTime getDateCreation() {
        return dateCreation;
    }

    public void setDateCreation(LocalDateTime dateCreation) {
        this.dateCreation = dateCreation;
    }
}
