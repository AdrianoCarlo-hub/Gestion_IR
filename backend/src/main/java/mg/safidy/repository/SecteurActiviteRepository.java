package mg.safidy.repository;

import mg.safidy.model.SecteurActivite;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SecteurActiviteRepository extends JpaRepository<SecteurActivite, Long> {

    Optional<SecteurActivite> findByCode(String code);

    List<SecteurActivite> findByActifTrueOrderByLibelleAsc();
}
