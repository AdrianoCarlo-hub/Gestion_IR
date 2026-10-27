package mg.safidy.repository;

import mg.safidy.model.Paiement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PaiementRepository extends JpaRepository<Paiement, Long> {

    List<Paiement> findByContribuableIdContribuableOrderByDatePaiementDesc(Long idContribuable);

    List<Paiement> findByDeclarationIdDeclaration(Long idDeclaration);

    List<Paiement> findByAcompteIdAcompte(Long idAcompte);

    Optional<Paiement> findByReferenceQuittance(String referenceQuittance);

    boolean existsByReferenceQuittance(String referenceQuittance);

    /** Somme des montants regles sur une declaration (hors paiements annules). */
    @Query("select coalesce(sum(p.montantAr), 0) from Paiement p " +
           "where p.declaration.idDeclaration = :idDeclaration " +
           "and (p.annule is null or p.annule = false)")
    long sommeRegleeParDeclaration(@Param("idDeclaration") Long idDeclaration);

    /** Total encaisse sur une annee civile (hors paiements annules). */
    @Query("select coalesce(sum(p.montantAr), 0) from Paiement p " +
           "where year(p.datePaiement) = :annee " +
           "and (p.annule is null or p.annule = false)")
    long sommeEncaisseeAnnee(@Param("annee") int annee);
}
