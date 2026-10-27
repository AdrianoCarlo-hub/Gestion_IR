package mg.safidy.dto;

import java.time.LocalDate;

/**
 * Ligne du tableau des impayes : declaration validee non totalement reglee.
 */
public record DeclarationImpayeeDTO(
        Long idDeclaration,
        Integer annee,
        String nif,
        String raisonSociale,
        String telephone,
        String email,
        Long irDu,
        Long dejaPaye,
        Long resteAPayer,
        LocalDate dateLimite,
        String statut) {
}
