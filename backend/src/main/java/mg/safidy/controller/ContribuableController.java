package mg.safidy.controller;

import mg.safidy.model.Contribuable;
import mg.safidy.service.ContribuableService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/contribuables")
public class ContribuableController {

    private final ContribuableService service;

    public ContribuableController(ContribuableService service) {
        this.service = service;
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
        return ResponseEntity.ok(service.creer(c));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Contribuable> modifier(@PathVariable Long id,
                                                   @RequestBody Contribuable c) {
        return ResponseEntity.ok(service.modifier(id, c));
    }

    @PatchMapping("/{id}/statut")
    public ResponseEntity<Contribuable> changerStatut(@PathVariable Long id,
                                                       @RequestParam String statut) {
        return ResponseEntity.ok(service.changerStatut(id, statut));
    }
}
