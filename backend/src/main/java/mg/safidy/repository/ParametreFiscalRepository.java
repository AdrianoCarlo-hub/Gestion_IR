package mg.safidy.repository;

import mg.safidy.model.ParametreFiscal;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ParametreFiscalRepository extends JpaRepository<ParametreFiscal, Long> {

    Optional<ParametreFiscal> findByCode(String code);
}
