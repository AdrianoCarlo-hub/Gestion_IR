package mg.safidy.dto;

import mg.safidy.model.SuspensionActivite;

import java.time.LocalDate;

/**
 * Detail d'un evenement d'arret / reprise (ligne d'historique).
 */
public class DetailSuspensionDTO {

    private Long idSuspension;
    private LocalDate dateArret;
    private LocalDate dateReprise;
    private String motif;
    private String typeEvenement;
    private String statut;
    private String refDeclaration;
    private LocalDate dateLimiteDeclaration;
    private String justificatifRef;
    private Boolean carteFiscaleRestituee;
    private Long impactMinimumProrata;
    private Long impactAcompteSuspendu;
    private Long impactCreditImpot;
    private String attestationRadiationNumero;
    private String agentArret;
    private String agentReprise;

    public DetailSuspensionDTO() {
    }

    public static DetailSuspensionDTO depuis(SuspensionActivite s) {
        DetailSuspensionDTO d = new DetailSuspensionDTO();
        d.idSuspension = s.getIdSuspension();
        d.dateArret = s.getDateArret();
        d.dateReprise = s.getDateReprise();
        d.motif = s.getMotif();
        d.typeEvenement = s.getTypeEvenement();
        d.statut = s.getStatut();
        d.refDeclaration = s.getRefDeclaration();
        d.dateLimiteDeclaration = s.getDateLimiteDeclaration();
        d.justificatifRef = s.getJustificatifRef();
        d.carteFiscaleRestituee = s.getCarteFiscaleRestituee();
        d.impactMinimumProrata = s.getImpactMinimumProrata();
        d.impactAcompteSuspendu = s.getImpactAcompteSuspendu();
        d.impactCreditImpot = s.getImpactCreditImpot();
        d.attestationRadiationNumero = s.getAttestationRadiationNumero();
        d.agentArret = s.getAgentArret() == null ? null
                : (s.getAgentArret().getPrenom() + " " + s.getAgentArret().getNom());
        d.agentReprise = s.getAgentReprise() == null ? null
                : (s.getAgentReprise().getPrenom() + " " + s.getAgentReprise().getNom());
        return d;
    }

    public Long getIdSuspension() {
        return idSuspension;
    }

    public LocalDate getDateArret() {
        return dateArret;
    }

    public LocalDate getDateReprise() {
        return dateReprise;
    }

    public String getMotif() {
        return motif;
    }

    public String getTypeEvenement() {
        return typeEvenement;
    }

    public String getStatut() {
        return statut;
    }

    public String getRefDeclaration() {
        return refDeclaration;
    }

    public LocalDate getDateLimiteDeclaration() {
        return dateLimiteDeclaration;
    }

    public String getJustificatifRef() {
        return justificatifRef;
    }

    public Boolean getCarteFiscaleRestituee() {
        return carteFiscaleRestituee;
    }

    public Long getImpactMinimumProrata() {
        return impactMinimumProrata;
    }

    public Long getImpactAcompteSuspendu() {
        return impactAcompteSuspendu;
    }

    public Long getImpactCreditImpot() {
        return impactCreditImpot;
    }

    public String getAttestationRadiationNumero() {
        return attestationRadiationNumero;
    }

    public String getAgentArret() {
        return agentArret;
    }

    public String getAgentReprise() {
        return agentReprise;
    }
}
