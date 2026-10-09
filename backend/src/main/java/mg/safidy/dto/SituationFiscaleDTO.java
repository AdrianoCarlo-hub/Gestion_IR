package mg.safidy.dto;

import java.util.ArrayList;
import java.util.List;

/**
 * Situation fiscale d'un contribuable.
 */
public class SituationFiscaleDTO {

    private Long idContribuable;
    private String nif;
    private String raisonSociale;
    private Long totalDu;
    private Long totalPaye;
    private Long resteAPayer;
    private boolean enRetard;
    private int nbDeclarationsImpayees;
    private List<DeclarationResume> declarations = new ArrayList<>();
    private List<PaiementResume> paiements = new ArrayList<>();

    public SituationFiscaleDTO() {
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

    public String getRaisonSociale() {
        return raisonSociale;
    }

    public void setRaisonSociale(String raisonSociale) {
        this.raisonSociale = raisonSociale;
    }

    public Long getTotalDu() {
        return totalDu;
    }

    public void setTotalDu(Long totalDu) {
        this.totalDu = totalDu;
    }

    public Long getTotalPaye() {
        return totalPaye;
    }

    public void setTotalPaye(Long totalPaye) {
        this.totalPaye = totalPaye;
    }

    public Long getResteAPayer() {
        return resteAPayer;
    }

    public void setResteAPayer(Long resteAPayer) {
        this.resteAPayer = resteAPayer;
    }

    public boolean isEnRetard() {
        return enRetard;
    }

    public void setEnRetard(boolean enRetard) {
        this.enRetard = enRetard;
    }

    public int getNbDeclarationsImpayees() {
        return nbDeclarationsImpayees;
    }

    public void setNbDeclarationsImpayees(int nbDeclarationsImpayees) {
        this.nbDeclarationsImpayees = nbDeclarationsImpayees;
    }

    public List<DeclarationResume> getDeclarations() {
        return declarations;
    }

    public void setDeclarations(List<DeclarationResume> declarations) {
        this.declarations = declarations;
    }

    public List<PaiementResume> getPaiements() {
        return paiements;
    }

    public void setPaiements(List<PaiementResume> paiements) {
        this.paiements = paiements;
    }

    public static class DeclarationResume {
        private Long idDeclaration;
        private Integer annee;
        private Long irDu;
        private Long acomptesVerses;
        private Long soldeAPayer;
        private String statut;
        private String dateLimite;
        private String dateDepot;

        public DeclarationResume() {
        }

        public Long getIdDeclaration() { return idDeclaration; }
        public void setIdDeclaration(Long idDeclaration) { this.idDeclaration = idDeclaration; }
        public Integer getAnnee() { return annee; }
        public void setAnnee(Integer annee) { this.annee = annee; }
        public Long getIrDu() { return irDu; }
        public void setIrDu(Long irDu) { this.irDu = irDu; }
        public Long getAcomptesVerses() { return acomptesVerses; }
        public void setAcomptesVerses(Long acomptesVerses) { this.acomptesVerses = acomptesVerses; }
        public Long getSoldeAPayer() { return soldeAPayer; }
        public void setSoldeAPayer(Long soldeAPayer) { this.soldeAPayer = soldeAPayer; }
        public String getStatut() { return statut; }
        public void setStatut(String statut) { this.statut = statut; }
        public String getDateLimite() { return dateLimite; }
        public void setDateLimite(String dateLimite) { this.dateLimite = dateLimite; }
        public String getDateDepot() { return dateDepot; }
        public void setDateDepot(String dateDepot) { this.dateDepot = dateDepot; }
    }

    public static class PaiementResume {
        private Long idPaiement;
        private String referenceQuittance;
        private String datePaiement;
        private Long montantAr;
        private String typePaiement;
        private String mode;
        private boolean annule;

        public PaiementResume() {
        }

        public Long getIdPaiement() { return idPaiement; }
        public void setIdPaiement(Long idPaiement) { this.idPaiement = idPaiement; }
        public String getReferenceQuittance() { return referenceQuittance; }
        public void setReferenceQuittance(String referenceQuittance) { this.referenceQuittance = referenceQuittance; }
        public String getDatePaiement() { return datePaiement; }
        public void setDatePaiement(String datePaiement) { this.datePaiement = datePaiement; }
        public Long getMontantAr() { return montantAr; }
        public void setMontantAr(Long montantAr) { this.montantAr = montantAr; }
        public String getTypePaiement() { return typePaiement; }
        public void setTypePaiement(String typePaiement) { this.typePaiement = typePaiement; }
        public String getMode() { return mode; }
        public void setMode(String mode) { this.mode = mode; }
        public boolean isAnnule() { return annule; }
        public void setAnnule(boolean annule) { this.annule = annule; }
    }
}
