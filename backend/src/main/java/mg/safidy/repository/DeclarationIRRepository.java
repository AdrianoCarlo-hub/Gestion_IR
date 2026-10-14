package mg.safidy.repository;

import mg.safidy.dto.DeclarationIRSearchCriteria;
import mg.safidy.model.DeclarationIR;
import mg.safidy.repository.specification.DeclarationIRSpecifications;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import java.util.List;
import java.util.Optional;

public interface DeclarationIRRepository extends JpaRepository<DeclarationIR, Long>, JpaSpecificationExecutor<DeclarationIR> {

    List<DeclarationIR> findByContribuableIdContribuableOrderByAnneeDesc(Long idContribuable);

    Optional<DeclarationIR> findByContribuableIdContribuableAndAnnee(Long idContribuable, Integer annee);

    boolean existsByContribuableIdContribuableAndAnnee(Long idContribuable, Integer annee);

    List<DeclarationIR> findByAnneeOrderByDateCreationDesc(Integer annee);

    List<DeclarationIR> findByStatutOrderByDateCreationDesc(String statut);

    default List<DeclarationIR> searchByCriteria(DeclarationIRSearchCriteria criteria) {
        Specification<DeclarationIR> spec = DeclarationIRSpecifications.buildSpecification(criteria);
        return findAll(spec, Sort.by("dateCreation").descending());
    }
}
