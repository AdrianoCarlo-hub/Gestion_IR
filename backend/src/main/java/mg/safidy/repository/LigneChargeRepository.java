package mg.safidy.repository;

import mg.safidy.model.LigneCharge;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LigneChargeRepository extends JpaRepository<LigneCharge, Long> {

    List<LigneCharge> findByDeclarationIdDeclaration(Long idDeclaration);
}
