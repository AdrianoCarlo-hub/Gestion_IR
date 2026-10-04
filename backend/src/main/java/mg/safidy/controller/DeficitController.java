package mg.safidy.controller;

import mg.safidy.model.Deficit;
import mg.safidy.service.DeficitService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/deficits")
public class DeficitController {

    private final DeficitService service;

    public DeficitController(DeficitService service) {
        this.service = service;
    }

    @GetMapping
    public List<Deficit> lister() {
        return service.listerTout();
    }

    @GetMapping("/contribuable/{idContribuable}")
    public List<Deficit> parContribuable(@PathVariable Long idContribuable) {
        return service.listerParContribuable(idContribuable);
    }

    @GetMapping("/contribuable/{idContribuable}/actifs")
    public List<Deficit> actifs(@PathVariable Long idContribuable) {
        return service.listerActifs(idContribuable);
    }

    @PostMapping
    public ResponseEntity<Deficit> creer(@RequestBody Map<String, Object> body) {
        Long idContribuable = Long.valueOf(body.get("idContribuable").toString());
        Integer annee = Integer.valueOf(body.get("anneeOrigine").toString());
        Long montant = Long.valueOf(body.get("montant").toString());
        return ResponseEntity.ok(service.creer(idContribuable, annee, montant));
    }

    @PostMapping("/expirer")
    public ResponseEntity<Map<String, Integer>> expirer() {
        int n = service.expirerDeficits();
        return ResponseEntity.ok(Map.of("expires", n));
    }
}
