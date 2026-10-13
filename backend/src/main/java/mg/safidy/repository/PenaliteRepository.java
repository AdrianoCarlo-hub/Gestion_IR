package mg.safidy.repository;

import mg.safidy.model.Penalite;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PenaliteRepository extends JpaRepository<Penalite, Long> {

    List<Penalite> findByDeclarationIdDeclaration(Long idDeclaration);

    List<Penalite> findByStatut(String statut);

    List<Penalite> findByDeclarationIdDeclarationOrderByDateCreationDesc(Long idDeclaration);

    List<Penalite> findByDeclarationIdDeclarationAndStatut(Long idDeclaration, String statut);

    List<Penalite> findByDeclarationContribuableIdContribuableOrderByDateCreationDesc(Long idContribuable);

    long countByDeclarationIdDeclarationAndStatut(Long idDeclaration, String statut);
}
