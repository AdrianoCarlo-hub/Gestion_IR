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
import java.time.LocalDateTime;

@Entity
@Table(name = "utilisation_deficit")
public class UtilisationDeficit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_utilisation")
    private Long idUtilisation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_deficit", nullable = false)
    private Deficit deficit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_declaration", nullable = false)
    private DeclarationIR declaration;

    @Column(name = "montant_impute", nullable = false)
    private Long montantImpute;

    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation;

    public UtilisationDeficit() {
    }

    public Long getIdUtilisation() {
        return idUtilisation;
    }

    public void setIdUtilisation(Long idUtilisation) {
        this.idUtilisation = idUtilisation;
    }

    public Deficit getDeficit() {
        return deficit;
    }

    public void setDeficit(Deficit deficit) {
        this.deficit = deficit;
    }

    public DeclarationIR getDeclaration() {
        return declaration;
    }

    public void setDeclaration(DeclarationIR declaration) {
        this.declaration = declaration;
    }

    public Long getMontantImpute() {
        return montantImpute;
    }

    public void setMontantImpute(Long montantImpute) {
        this.montantImpute = montantImpute;
    }

    public LocalDateTime getDateCreation() {
        return dateCreation;
    }

    public void setDateCreation(LocalDateTime dateCreation) {
        this.dateCreation = dateCreation;
    }
}
