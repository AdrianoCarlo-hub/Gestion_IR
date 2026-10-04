package mg.safidy.repository;

import mg.safidy.model.SuspensionActivite;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SuspensionActiviteRepository extends JpaRepository<SuspensionActivite, Long> {

    List<SuspensionActivite> findByContribuableIdContribuableOrderByDateArretDesc(Long idContribuable);

    Optional<SuspensionActivite> findByContribuableIdContribuableAndStatut(
        Long idContribuable, String statut);
}
