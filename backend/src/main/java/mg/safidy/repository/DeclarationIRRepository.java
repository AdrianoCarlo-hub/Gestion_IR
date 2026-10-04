package mg.safidy.repository;

import mg.safidy.model.DeclarationIR;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface DeclarationIRRepository extends JpaRepository<DeclarationIR, Long> {

    List<DeclarationIR> findByContribuableIdContribuableOrderByAnneeDesc(Long idContribuable);

    Optional<DeclarationIR> findByContribuableIdContribuableAndAnnee(Long idContribuable, Integer annee);

    boolean existsByContribuableIdContribuableAndAnnee(Long idContribuable, Integer annee);

    List<DeclarationIR> findByAnneeOrderByDateCreationDesc(Integer annee);

    List<DeclarationIR> findByStatutOrderByDateCreationDesc(String statut);
}
