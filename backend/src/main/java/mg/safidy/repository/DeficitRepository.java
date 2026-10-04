package mg.safidy.repository;

import mg.safidy.model.Deficit;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DeficitRepository extends JpaRepository<Deficit, Long> {

    List<Deficit> findByContribuableIdContribuableOrderByAnneeOrigineAsc(Long idContribuable);

    List<Deficit> findByContribuableIdContribuableAndStatutOrderByAnneeOrigineAsc(
        Long idContribuable, String statut);
}
