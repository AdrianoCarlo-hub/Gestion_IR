package mg.safidy.dto;

import mg.safidy.model.Penalite;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Decompte detaille d'une penalite : montant, base, taux, retard et formule
 * de calcul (utilise par l'accordion "Decompte detaille" du frontend).
 */
public class DetailPenaliteDTO {

    private Long idPenalite;
    private String type;
    private String motif;
    private Long baseCalculAr;
    private BigDecimal tauxPct;
    private Integer nbMois;
    private Long montantAr;
    private String statut;
    private String articleRef;
    private LocalDate dateLimite;
    private LocalDate dateRegularisation;
    private String motifAnnulation;
    private LocalDateTime dateCreation;
    private String formule;

    public DetailPenaliteDTO() {
    }

    public static DetailPenaliteDTO depuis(Penalite p) {
        DetailPenaliteDTO d = new DetailPenaliteDTO();
        d.idPenalite = p.getIdPenalite();
        d.type = p.getType();
        d.motif = p.getMotif();
        d.baseCalculAr = p.getBaseCalculAr();
        d.tauxPct = p.getTauxPct();
        d.nbMois = p.getNbMois();
        d.montantAr = p.getMontantAr();
        d.statut = p.getStatut();
        d.articleRef = p.getArticleRef();
        d.dateLimite = p.getDateLimite();
        d.dateRegularisation = p.getDateRegularisation();
        d.motifAnnulation = p.getMotifAnnulation();
        d.dateCreation = p.getDateCreation();
        d.formule = construireFormule(p);
        return d;
    }

    private static String construireFormule(Penalite p) {
        String type = p.getType() == null ? "" : p.getType();
        long base = p.getBaseCalculAr() == null ? 0L : p.getBaseCalculAr();
        BigDecimal taux = p.getTauxPct() == null ? BigDecimal.ZERO : p.getTauxPct();
        int mois = p.getNbMois() == null ? 0 : p.getNbMois();
        long montant = p.getMontantAr() == null ? 0L : p.getMontantAr();

        switch (type) {
            case "AMENDE_DEPOT":
                return "Amende fixe selon tranche de CA = " + montant + " Ar";
            case "INTERET_RETARD":
                return base + " x " + taux + " % x " + mois + " mois = " + montant + " Ar";
            case "MAJORATION":
            case "MAJORATION_80":
            case "MAJORATION_40":
                return base + " x " + taux + " % (" + mois + " mois) = " + montant + " Ar";
            case "AMENDE_SPECIFIQUE":
                return base + " x " + taux + " % = " + montant + " Ar";
            default:
                return base + " x " + taux + " % = " + montant + " Ar";
        }
    }

    public Long getIdPenalite() {
        return idPenalite;
    }

    public String getType() {
        return type;
    }

    public String getMotif() {
        return motif;
    }

    public Long getBaseCalculAr() {
        return baseCalculAr;
    }

    public BigDecimal getTauxPct() {
        return tauxPct;
    }

    public Integer getNbMois() {
        return nbMois;
    }

    public Long getMontantAr() {
        return montantAr;
    }

    public String getStatut() {
        return statut;
    }

    public String getArticleRef() {
        return articleRef;
    }

    public LocalDate getDateLimite() {
        return dateLimite;
    }

    public LocalDate getDateRegularisation() {
        return dateRegularisation;
    }

    public String getMotifAnnulation() {
        return motifAnnulation;
    }

    public LocalDateTime getDateCreation() {
        return dateCreation;
    }

    public String getFormule() {
        return formule;
    }
}
