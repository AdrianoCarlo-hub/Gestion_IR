package mg.safidy.service;

import mg.safidy.model.Acompte;
import mg.safidy.model.DeclarationIR;
import mg.safidy.repository.AcompteRepository;
import mg.safidy.repository.DeclarationIRRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

/**
 * Applique automatiquement le statut EN_RETARD :
 *  - declarations non payees dont la date limite est depassee ;
 *  - acomptes a payer dont l'echeance est depassee.
 */
@Service
public class StatutAutomatiqueService {

    private final DeclarationIRRepository declarationRepository;
    private final AcompteRepository acompteRepository;

    public StatutAutomatiqueService(DeclarationIRRepository declarationRepository,
                                     AcompteRepository acompteRepository) {
        this.declarationRepository = declarationRepository;
        this.acompteRepository = acompteRepository;
    }

    @Transactional
    public Map<String, Object> appliquerRetards() {
        LocalDate aujourdHui = LocalDate.now();
        int declarationsMisAJour = 0;
        int acomptesMisAJour = 0;

        for (DeclarationIR d : declarationRepository.findAll()) {
            if (d.getDateLimite() == null) continue;
            if ("PAYEE".equals(d.getStatut()) || "EN_RETARD".equals(d.getStatut())) continue;
            if (d.getDateLimite().isBefore(aujourdHui)) {
                d.setStatut("EN_RETARD");
                declarationRepository.save(d);
                declarationsMisAJour++;
            }
        }

        for (Acompte a : acompteRepository.findAll()) {
            if (a.getDateEcheance() == null) continue;
            if (!"A_PAYER".equals(a.getStatut())) continue;
            if (a.getDateEcheance().isBefore(aujourdHui)) {
                a.setStatut("EN_RETARD");
                acompteRepository.save(a);
                acomptesMisAJour++;
            }
        }

        Map<String, Object> resultat = new HashMap<>();
        resultat.put("declarationsEnRetard", declarationsMisAJour);
        resultat.put("acomptesEnRetard", acomptesMisAJour);
        resultat.put("date", aujourdHui.toString());
        return resultat;
    }
}
