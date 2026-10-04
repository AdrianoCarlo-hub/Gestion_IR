package mg.safidy.controller;

import mg.safidy.model.SuspensionActivite;
import mg.safidy.service.SuspensionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/suspensions")
public class SuspensionController {

    private final SuspensionService service;

    public SuspensionController(SuspensionService service) {
        this.service = service;
    }

    @GetMapping("/contribuable/{idContribuable}")
    public List<SuspensionActivite> parContribuable(@PathVariable Long idContribuable) {
        return service.listerParContribuable(idContribuable);
    }

    @PostMapping("/arret")
    public ResponseEntity<SuspensionActivite> declarerArret(@RequestBody Map<String, Object> body) {
        Long idContribuable = Long.valueOf(body.get("idContribuable").toString());
        LocalDate dateArret = LocalDate.parse(body.get("dateArret").toString());
        String motif = body.get("motif").toString();
        String refDecl = body.get("refDeclaration") == null ? null : body.get("refDeclaration").toString();
        Long idAgent = Long.valueOf(body.get("idAgent").toString());
        return ResponseEntity.ok(service.declarerArret(idContribuable, dateArret, motif, refDecl, idAgent));
    }

    @PostMapping("/{id}/reprise")
    public ResponseEntity<SuspensionActivite> declarerReprise(@PathVariable Long id,
                                                                @RequestBody Map<String, Object> body) {
        LocalDate dateReprise = LocalDate.parse(body.get("dateReprise").toString());
        Long idAgent = Long.valueOf(body.get("idAgent").toString());
        return ResponseEntity.ok(service.declarerReprise(id, dateReprise, idAgent));
    }

    @PostMapping("/{id}/annuler")
    public ResponseEntity<SuspensionActivite> annuler(@PathVariable Long id) {
        return ResponseEntity.ok(service.annuler(id));
    }
}
