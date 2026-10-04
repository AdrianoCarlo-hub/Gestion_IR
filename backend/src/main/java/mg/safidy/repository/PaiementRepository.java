package mg.safidy.repository;

import mg.safidy.model.Paiement;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PaiementRepository extends JpaRepository<Paiement, Long> {

    List<Paiement> findByContribuableIdContribuableOrderByDatePaiementDesc(Long idContribuable);

    List<Paiement> findByDeclarationIdDeclaration(Long idDeclaration);

    List<Paiement> findByAcompteIdAcompte(Long idAcompte);

    Optional<Paiement> findByReferenceQuittance(String referenceQuittance);

    boolean existsByReferenceQuittance(String referenceQuittance);
}
