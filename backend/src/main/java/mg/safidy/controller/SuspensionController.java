package mg.safidy.controller;

import mg.safidy.dto.ImpactFiscalDTO;
import mg.safidy.dto.SituationActiviteDTO;
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

    @GetMapping("/situation/{idContribuable}")
    public SituationActiviteDTO situation(@PathVariable Long idContribuable) {
        return service.situation(idContribuable);
    }

    @PostMapping("/contribuable/{idContribuable}/statut")
    public ResponseEntity<Void> changerStatut(@PathVariable Long idContribuable,
                                               @RequestBody Map<String, Object> body) {
        String statut = body.get("statut").toString();
        Long idAgent = Long.valueOf(body.get("idAgent").toString());
        LocalDate dateArret = body.get("dateArret") == null
            ? null : LocalDate.parse(body.get("dateArret").toString());
        LocalDate dateReprise = body.get("dateReprise") == null
            ? null : LocalDate.parse(body.get("dateReprise").toString());
        String motif = body.get("motif") == null ? null : body.get("motif").toString();
        service.changerStatutDepuisSuspensions(idContribuable, statut, idAgent,
            dateArret, motif, dateReprise);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/simuler/{idContribuable}")
    public ImpactFiscalDTO simuler(@PathVariable Long idContribuable,
                                   @RequestParam(required = false) String dateArret) {
        LocalDate date = (dateArret == null || dateArret.isBlank())
                ? LocalDate.now() : LocalDate.parse(dateArret);
        return service.calculerImpactFiscalVeilleuse(idContribuable, date);
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

    @PostMapping("/veilleuse")
    public ResponseEntity<SuspensionActivite> veilleuse(@RequestBody Map<String, Object> body) {
        return declarerArret(body);
    }

    @PostMapping("/cessation")
    public ResponseEntity<SuspensionActivite> cessation(@RequestBody Map<String, Object> body) {
        Long idContribuable = Long.valueOf(body.get("idContribuable").toString());
        LocalDate dateArret = LocalDate.parse(body.get("dateArret").toString());
        String motif = body.get("motif") == null ? null : body.get("motif").toString();
        String justificatif = body.get("justificatif") == null ? null : body.get("justificatif").toString();
        Long idAgent = Long.valueOf(body.get("idAgent").toString());
        return ResponseEntity.ok(
                service.declarerCessation(idContribuable, dateArret, motif, justificatif, idAgent));
    }

    @PostMapping("/{id}/reprise")
    public ResponseEntity<SuspensionActivite> declarerReprise(@PathVariable Long id,
                                                                @RequestBody Map<String, Object> body) {
        LocalDate dateReprise = LocalDate.parse(body.get("dateReprise").toString());
        Long idAgent = Long.valueOf(body.get("idAgent").toString());
        return ResponseEntity.ok(service.declarerReprise(id, dateReprise, idAgent));
    }

    @PostMapping("/{id}/attestation-radiation")
    public ResponseEntity<SuspensionActivite> attestationRadiation(@PathVariable Long id) {
        return ResponseEntity.ok(service.genererAttestationRadiation(id));
    }

    @PostMapping("/{id}/annuler")
    public ResponseEntity<SuspensionActivite> annuler(@PathVariable Long id) {
        return ResponseEntity.ok(service.annuler(id));
    }
}
