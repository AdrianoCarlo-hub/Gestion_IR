package mg.safidy.controller;

import mg.safidy.config.AuditLogger;
import mg.safidy.model.Contribuable;
import mg.safidy.service.ContribuableService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/contribuables")
public class ContribuableController {

    private final ContribuableService service;
    private final AuditLogger audit;

    public ContribuableController(ContribuableService service, AuditLogger audit) {
        this.service = service;
        this.audit = audit;
    }

    @GetMapping
    public List<Contribuable> lister(
            @RequestParam(required = false) String motCle,
            @RequestParam(required = false) String statut,
            @RequestParam(required = false) Long idSecteur) {
        return service.rechercher(motCle, statut, idSecteur);
    }

    @GetMapping("/{id}")
    public Contribuable trouver(@PathVariable Long id) {
        return service.trouverParId(id);
    }

    @GetMapping("/nif/{nif}")
    public Contribuable trouverParNif(@PathVariable String nif) {
        return service.trouverParNif(nif);
    }

    @PostMapping
    public ResponseEntity<Contribuable> creer(@RequestBody Contribuable c) {
        Contribuable saved = service.creer(c);
        audit.log("CREATION_CONTRIBUABLE", "contribuable", saved.getIdContribuable(),
                  "NIF=" + saved.getNif() + " raison=" + saved.getRaisonSociale());
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Contribuable> modifier(@PathVariable Long id,
                                                   @RequestBody Contribuable c) {
        Contribuable saved = service.modifier(id, c);
        audit.log("MODIFICATION_CONTRIBUABLE", "contribuable", id, "NIF=" + saved.getNif());
        return ResponseEntity.ok(saved);
    }

    @PatchMapping("/{id}/statut")
    public ResponseEntity<Contribuable> changerStatut(@PathVariable Long id,
                                                       @RequestParam String statut) {
        Contribuable saved = service.changerStatut(id, statut);
        audit.log("CHANGEMENT_STATUT", "contribuable", id, "nouveau statut=" + statut);
        return ResponseEntity.ok(saved);
    }
}
