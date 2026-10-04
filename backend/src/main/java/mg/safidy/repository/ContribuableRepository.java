package mg.safidy.repository;

import mg.safidy.model.Contribuable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface ContribuableRepository extends JpaRepository<Contribuable, Long> {

    Optional<Contribuable> findByNif(String nif);

    boolean existsByNif(String nif);

    List<Contribuable> findByStatutOrderByRaisonSocialeAsc(String statut);

    @Query("SELECT c FROM Contribuable c " +
           "WHERE (:motCle = '' OR " +
           "  LOWER(c.nif) LIKE LOWER(CONCAT('%', :motCle, '%')) OR " +
           "  LOWER(c.raisonSociale) LIKE LOWER(CONCAT('%', :motCle, '%')) OR " +
           "  LOWER(c.telephone) LIKE LOWER(CONCAT('%', :motCle, '%')) OR " +
           "  LOWER(c.stat) LIKE LOWER(CONCAT('%', :motCle, '%'))) " +
           "AND (:statut = '' OR c.statut = :statut) " +
           "AND (:idSecteur = 0 OR c.secteur.idSecteur = :idSecteur) " +
           "ORDER BY c.raisonSociale ASC")
    List<Contribuable> rechercher(
        @Param("motCle") String motCle,
        @Param("statut") String statut,
        @Param("idSecteur") Long idSecteur);
}
