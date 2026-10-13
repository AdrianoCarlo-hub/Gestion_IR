package mg.safidy.dto;

import java.time.LocalDate;

/**
 * Impact fiscal d'un arret / reprise (prorata du minimum + acomptes + credit).
 */
public class ImpactFiscalDTO {

    private Long idContribuable;
    private LocalDate dateArret;
    private int moisActifs;
    private long minimumProrata;
    private long acompteSuspendu;
    private long creditImpot;

    public ImpactFiscalDTO() {
    }

    public Long getIdContribuable() {
        return idContribuable;
    }

    public void setIdContribuable(Long idContribuable) {
        this.idContribuable = idContribuable;
    }

    public LocalDate getDateArret() {
        return dateArret;
    }

    public void setDateArret(LocalDate dateArret) {
        this.dateArret = dateArret;
    }

    public int getMoisActifs() {
        return moisActifs;
    }

    public void setMoisActifs(int moisActifs) {
        this.moisActifs = moisActifs;
    }

    public long getMinimumProrata() {
        return minimumProrata;
    }

    public void setMinimumProrata(long minimumProrata) {
        this.minimumProrata = minimumProrata;
    }

    public long getAcompteSuspendu() {
        return acompteSuspendu;
    }

    public void setAcompteSuspendu(long acompteSuspendu) {
        this.acompteSuspendu = acompteSuspendu;
    }

    public long getCreditImpot() {
        return creditImpot;
    }

    public void setCreditImpot(long creditImpot) {
        this.creditImpot = creditImpot;
    }
}
