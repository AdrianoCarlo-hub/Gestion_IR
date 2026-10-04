package mg.safidy.controller;

import mg.safidy.model.DeclarationIR;
import mg.safidy.model.LigneCharge;
import mg.safidy.service.DeclarationIRService;
import mg.safidy.config.AuditLogger;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/declarations")
public class DeclarationIRController {

    private final DeclarationIRService service;
    private final AuditLogger audit;

    public DeclarationIRController(DeclarationIRService service, AuditLogger audit) {
        this.service = service;
        this.audit = audit;
    }

    @GetMapping
    public List<DeclarationIR> lister(@RequestParam(required = false) Integer annee) {
        if (annee != null) return service.listerParAnnee(annee);
        return service.lister();
    }

    @GetMapping("/{id}")
    public DeclarationIR trouver(@PathVariable Long id) {
        return service.trouverParId(id);
    }

    @GetMapping("/contribuable/{idContribuable}")
    public List<DeclarationIR> listerParContribuable(@PathVariable Long idContribuable) {
        return service.listerParContribuable(idContribuable);
    }

    @GetMapping("/{id}/charges")
    public List<LigneCharge> listerCharges(@PathVariable Long id) {
        return service.listerCharges(id);
    }

    @PostMapping
    public ResponseEntity<DeclarationIR> creer(@RequestBody Map<String, Object> body) {
        Long idContribuable = Long.valueOf(body.get("idContribuable").toString());
        Integer annee = Integer.valueOf(body.get("annee").toString());
        LocalDate dateDebut = LocalDate.parse(body.get("dateDebut").toString());
        LocalDate dateFin = LocalDate.parse(body.get("dateFin").toString());
        Long idAgent = Long.valueOf(body.get("idAgent").toString());
        return ResponseEntity.ok(service.creerBrouillon(idContribuable, annee, dateDebut, dateFin, idAgent));
    }

    @PutMapping("/{id}/ca")
    public ResponseEntity<DeclarationIR> modifierCaHt(@PathVariable Long id,
                                                       @RequestParam Long caHt) {
        return ResponseEntity.ok(service.modifierCaHt(id, caHt));
    }

    @PostMapping("/{id}/charges")
    public ResponseEntity<LigneCharge> ajouterCharge(@PathVariable Long id,
                                                      @RequestBody LigneCharge lc) {
        return ResponseEntity.ok(service.ajouterCharge(id, lc.getCategorie(),
                lc.getLibelle(), lc.getMontantAr(), lc.getJustificatifRef()));
    }

    @DeleteMapping("/charges/{idLigne}")
    public ResponseEntity<Void> supprimerCharge(@PathVariable Long idLigne) {
        service.supprimerCharge(idLigne);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/calculer")
    public ResponseEntity<DeclarationIR> calculer(@PathVariable Long id,
                                                   @RequestBody Map<String, Object> body) {
        Long reintegrations = body.get("totalReintegrations") == null ? 0L
                : Long.valueOf(body.get("totalReintegrations").toString());
        Long deductions = body.get("totalDeductions") == null ? 0L
                : Long.valueOf(body.get("totalDeductions").toString());
        Long acomptes = body.get("acomptesVerses") == null ? 0L
                : Long.valueOf(body.get("acomptesVerses").toString());
        DeclarationIR saved = service.calculerEtEnregistrer(id, reintegrations, deductions, acomptes);
        audit.log("CALCUL_IR", "declaration_ir", id, "IR du=" + saved.getIrDu() + " Ar");
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/{id}/valider")
    public ResponseEntity<DeclarationIR> valider(@PathVariable Long id) {
        DeclarationIR saved = service.valider(id);
        audit.log("VALIDATION_DECLARATION", "declaration_ir", id,
                  "IR du=" + saved.getIrDu() + " Ar");
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/{id}/marquer-payee")
    public ResponseEntity<DeclarationIR> marquerPayee(@PathVariable Long id) {
        return ResponseEntity.ok(service.marquerPayee(id));
    }
}
