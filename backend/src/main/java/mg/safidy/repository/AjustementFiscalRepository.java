package mg.safidy.repository;

import mg.safidy.model.AjustementFiscal;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AjustementFiscalRepository extends JpaRepository<AjustementFiscal, Long> {

    List<AjustementFiscal> findByDeclarationIdDeclaration(Long idDeclaration);
}
