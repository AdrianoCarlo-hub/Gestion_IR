package mg.safidy.repository;

import mg.safidy.model.UtilisationDeficit;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface UtilisationDeficitRepository extends JpaRepository<UtilisationDeficit, Long> {

    List<UtilisationDeficit> findByDeficitIdDeficit(Long idDeficit);

    List<UtilisationDeficit> findByDeclarationIdDeclaration(Long idDeclaration);
}
