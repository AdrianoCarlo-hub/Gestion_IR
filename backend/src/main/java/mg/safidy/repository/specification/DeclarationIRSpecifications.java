package mg.safidy.repository.specification;

import mg.safidy.dto.DeclarationIRSearchCriteria;
import mg.safidy.model.DeclarationIR;
import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

public class DeclarationIRSpecifications {

    public static Specification<DeclarationIR> buildSpecification(DeclarationIRSearchCriteria criteria) {
        if (criteria == null) {
            return (root, query, cb) -> cb.conjunction();
        }

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Recherche par année
            if (criteria.getAnnee() != null) {
                predicates.add(cb.equal(root.get("annee"), criteria.getAnnee()));
            }

            // Recherche par statut
            if (criteria.getStatut() != null && !criteria.getStatut().isEmpty()) {
                predicates.add(cb.equal(root.get("statut"), criteria.getStatut()));
            }

            // Recherche par idContribuable
            if (criteria.getIdContribuable() != null) {
                predicates.add(cb.equal(root.get("contribuable").get("idContribuable"), criteria.getIdContribuable()));
            }

            // Recherche par nom de contribuable (recherche partielle)
            if (criteria.getNomContribuable() != null && !criteria.getNomContribuable().isEmpty()) {
                String searchPattern = "%" + criteria.getNomContribuable().toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(root.get("contribuable").get("nom")), searchPattern));
            }

            // Recherche par idAgent
            if (criteria.getIdAgent() != null) {
                predicates.add(cb.equal(root.get("agent").get("idAgent"), criteria.getIdAgent()));
            }

            // Recherche par date de début
            if (criteria.getDateDebut() != null) {
                predicates.add(cb.equal(root.get("dateDebut"), criteria.getDateDebut()));
            }

            // Recherche par date de fin
            if (criteria.getDateFin() != null) {
                predicates.add(cb.equal(root.get("dateFin"), criteria.getDateFin()));
            }

            // Recherche par plage de date de dépôt
            if (criteria.getDateDepotFrom() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("dateDepot"), criteria.getDateDepotFrom()));
            }
            if (criteria.getDateDepotTo() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("dateDepot"), criteria.getDateDepotTo()));
            }

            // Recherche par plage de date de création
            if (criteria.getDateCreationFrom() != null) {
                LocalDateTime fromDateTime = criteria.getDateCreationFrom().atStartOfDay();
                predicates.add(cb.greaterThanOrEqualTo(root.get("dateCreation"), fromDateTime));
            }
            if (criteria.getDateCreationTo() != null) {
                LocalDateTime toDateTime = criteria.getDateCreationTo().atTime(LocalTime.MAX);
                predicates.add(cb.lessThanOrEqualTo(root.get("dateCreation"), toDateTime));
            }

            // Recherche par CA HT minimum
            if (criteria.getCaHtMin() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("caHt"), criteria.getCaHtMin()));
            }

            // Recherche par CA HT maximum
            if (criteria.getCaHtMax() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("caHt"), criteria.getCaHtMax()));
            }

            // Recherche par IR dû minimum
            if (criteria.getIrDuMin() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("irDu"), criteria.getIrDuMin()));
            }

            // Recherche par IR dû maximum
            if (criteria.getIrDuMax() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("irDu"), criteria.getIrDuMax()));
            }

            // Recherche par solde à payer minimum
            if (criteria.getSoldeAPayerMin() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("soldeAPayer"), criteria.getSoldeAPayerMin()));
            }

            // Recherche par solde à payer maximum
            if (criteria.getSoldeAPayerMax() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("soldeAPayer"), criteria.getSoldeAPayerMax()));
            }

            // Recherche par mois actifs
            if (criteria.getMoisActifs() != null) {
                predicates.add(cb.equal(root.get("moisActifs"), criteria.getMoisActifs()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
