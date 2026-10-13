package mg.safidy.repository;

import mg.safidy.model.Acompte;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface AcompteRepository extends JpaRepository<Acompte, Long> {

    List<Acompte> findByContribuableIdContribuableAndAnneeOrderByNumeroAsc(
        Long idContribuable, Integer annee);

    Optional<Acompte> findByContribuableIdContribuableAndAnneeAndNumero(
        Long idContribuable, Integer annee, Integer numero);

    List<Acompte> findByStatutOrderByDateEcheanceAsc(String statut);

    List<Acompte> findByContribuableIdContribuableOrderByAnneeAsc(Long idContribuable);

    List<Acompte> findByContribuableIdContribuableAndTypeAcompteOrderByAnneeAsc(
        Long idContribuable, String typeAcompte);

    long countByContribuableIdContribuableAndTypeAcompte(Long idContribuable, String typeAcompte);

    List<Acompte> findByContribuableIdContribuableAndAnneeOrderByTypeAcompteAscNumeroAsc(
        Long idContribuable, Integer annee);

    List<Acompte> findByContribuableIdContribuableAndAnneeAndTypeAcompte(
        Long idContribuable, Integer annee, String typeAcompte);

    boolean existsByContribuableIdContribuableAndAnneeAndTypeAcompte(
        Long idContribuable, Integer annee, String typeAcompte);
}
