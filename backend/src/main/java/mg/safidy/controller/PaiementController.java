package mg.safidy.controller;

import mg.safidy.model.Paiement;
import mg.safidy.service.PaiementService;
import mg.safidy.config.AuditLogger;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/paiements")
public class PaiementController {

    private final PaiementService service;
    private final AuditLogger audit;

    public PaiementController(PaiementService service, AuditLogger audit) {
        this.service = service;
        this.audit = audit;
    }

    @GetMapping
    public List<Paiement> lister() {
        return service.lister();
    }

    @GetMapping("/{id}")
    public Paiement trouver(@PathVariable Long id) {
        return service.trouverParId(id);
    }

    @GetMapping("/contribuable/{idContribuable}")
    public List<Paiement> listerParContribuable(@PathVariable Long idContribuable) {
        return service.listerParContribuable(idContribuable);
    }

    @PostMapping
    public ResponseEntity<Paiement> enregistrer(@RequestBody Map<String, Object> body) {
        Long idContribuable = Long.valueOf(body.get("idContribuable").toString());
        Long idDeclaration = body.get("idDeclaration") == null ? null
                : Long.valueOf(body.get("idDeclaration").toString());
        Long idAcompte = body.get("idAcompte") == null ? null
                : Long.valueOf(body.get("idAcompte").toString());
        String type = body.get("typePaiement").toString();
        Long montant = Long.valueOf(body.get("montantAr").toString());
        LocalDate date = LocalDate.parse(body.get("datePaiement").toString());
        String mode = body.get("mode").toString();
        Long idAgent = Long.valueOf(body.get("idAgent").toString());

        Paiement p = service.enregistrer(idContribuable, idDeclaration, idAcompte,
                type, montant, date, mode, idAgent);
        audit.log("ENREGISTREMENT_PAIEMENT", "paiement", p.getIdPaiement(),
                  "Quittance=" + p.getReferenceQuittance() + " Montant=" + montant + " Ar");
        return ResponseEntity.ok(p);
    }

    @PostMapping("/{id}/annuler")
    public ResponseEntity<Paiement> annuler(@PathVariable Long id,
                                             @RequestBody Map<String, String> body) {
        Paiement p = service.annuler(id, body.get("motif"));
        audit.log("ANNULATION_PAIEMENT", "paiement", id, "Motif=" + body.get("motif"));
        return ResponseEntity.ok(p);
    }
}
