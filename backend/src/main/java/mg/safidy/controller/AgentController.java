package mg.safidy.controller;

import mg.safidy.config.AuditLogger;
import mg.safidy.exception.BusinessException;
import mg.safidy.model.Agent;
import mg.safidy.model.CentreFiscal;
import mg.safidy.service.AgentService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Module ADMIN : gestion des comptes agents. Reserve au role ADMIN.
 */
@RestController
@RequestMapping("/api/agents")
@PreAuthorize("hasRole('ADMIN')")
public class AgentController {

    private final AgentService service;
    private final AuditLogger audit;

    public AgentController(AgentService service, AuditLogger audit) {
        this.service = service;
        this.audit = audit;
    }

    @GetMapping
    public List<Agent> lister() {
        return service.lister();
    }

    @GetMapping("/{id}")
    public Agent trouver(@PathVariable Long id) {
        return service.trouverParId(id);
    }

    @PostMapping
    public Agent creer(@RequestBody Map<String, Object> body) {
        Agent agent = new Agent();
        agent.setMatricule(texte(body, "matricule"));
        agent.setNom(texte(body, "nom"));
        agent.setPrenom(texte(body, "prenom"));
        agent.setEmail(texte(body, "email"));
        agent.setRole(texte(body, "role"));
        if (body.get("statut") != null) agent.setStatut(texte(body, "statut"));

        if (body.get("idCentre") == null) {
            throw new BusinessException("Centre fiscal obligatoire");
        }
        CentreFiscal centre = new CentreFiscal();
        centre.setIdCentre(Long.valueOf(body.get("idCentre").toString()));
        agent.setCentre(centre);

        Agent saved = service.creer(agent, texte(body, "motDePasse"));
        audit.log("CREATION_AGENT", "agent", saved.getIdAgent(), "matricule=" + saved.getMatricule());
        return saved;
    }

    @PutMapping("/{id}")
    public Agent modifier(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Agent modif = new Agent();
        modif.setNom(texte(body, "nom"));
        modif.setPrenom(texte(body, "prenom"));
        modif.setEmail(texte(body, "email"));
        modif.setRole(texte(body, "role"));
        Agent saved = service.modifier(id, modif);
        audit.log("MODIFICATION_AGENT", "agent", id, "matricule=" + saved.getMatricule());
        return saved;
    }

    @PatchMapping("/{id}/statut")
    public Agent changerStatut(@PathVariable Long id, @RequestParam String statut) {
        Agent saved = service.changerStatut(id, statut);
        audit.log("CHANGEMENT_STATUT_AGENT", "agent", id, "nouveau statut=" + statut);
        return saved;
    }

    @PostMapping("/{id}/reinitialiser-mot-de-passe")
    public Agent reinitialiserMotDePasse(@PathVariable Long id,
                                          @RequestBody Map<String, String> body) {
        Agent saved = service.reinitialiserMotDePasse(id, body.get("motDePasse"));
        audit.log("REINITIALISATION_MOT_DE_PASSE", "agent", id, null);
        return saved;
    }

    private String texte(Map<String, Object> body, String cle) {
        Object v = body.get(cle);
        return v == null ? null : v.toString();
    }
}
