package mg.safidy.controller;

import mg.safidy.config.AuditLogger;
import mg.safidy.dto.DeclarationIRSearchCriteria;
import mg.safidy.exception.BusinessException;
import mg.safidy.model.DeclarationIR;
import mg.safidy.model.LigneCharge;
import mg.safidy.repository.DeclarationIRRepository;
import mg.safidy.service.DeclarationIRService;
import mg.safidy.service.StatutAutomatiqueService;
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
    private final DeclarationIRRepository repo;
    private final AuditLogger audit;
    private final StatutAutomatiqueService statutAutomatiqueService;

    public DeclarationIRController(DeclarationIRService service,
                                     DeclarationIRRepository repo,
                                     AuditLogger audit,
                                     StatutAutomatiqueService statutAutomatiqueService) {
        this.service = service;
        this.repo = repo;
        this.audit = audit;
        this.statutAutomatiqueService = statutAutomatiqueService;
    }

    @GetMapping
    public List<DeclarationIR> lister(
            @RequestParam(required = false) Integer annee,
            @RequestParam(required = false) String statut,
            @RequestParam(required = false) Long idContribuable,
            @RequestParam(required = false) String nomContribuable,
            @RequestParam(required = false) Long idAgent,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateDebut,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFin,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateDepotFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateDepotTo,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateCreationFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateCreationTo,
            @RequestParam(required = false) Long caHtMin,
            @RequestParam(required = false) Long caHtMax,
            @RequestParam(required = false) Long irDuMin,
            @RequestParam(required = false) Long irDuMax,
            @RequestParam(required = false) Long soldeAPayerMin,
            @RequestParam(required = false) Long soldeAPayerMax,
            @RequestParam(required = false) Integer moisActifs) {
        // Passage automatique en EN_RETARD des declarations echues (sans scheduler)
        statutAutomatiqueService.appliquerRetards();
        
        DeclarationIRSearchCriteria criteria = new DeclarationIRSearchCriteria();
        criteria.setAnnee(annee);
        criteria.setStatut(statut);
        criteria.setIdContribuable(idContribuable);
        criteria.setNomContribuable(nomContribuable);
        criteria.setIdAgent(idAgent);
        criteria.setDateDebut(dateDebut);
        criteria.setDateFin(dateFin);
        criteria.setDateDepotFrom(dateDepotFrom);
        criteria.setDateDepotTo(dateDepotTo);
        criteria.setDateCreationFrom(dateCreationFrom);
        criteria.setDateCreationTo(dateCreationTo);
        criteria.setCaHtMin(caHtMin);
        criteria.setCaHtMax(caHtMax);
        criteria.setIrDuMin(irDuMin);
        criteria.setIrDuMax(irDuMax);
        criteria.setSoldeAPayerMin(soldeAPayerMin);
        criteria.setSoldeAPayerMax(soldeAPayerMax);
        criteria.setMoisActifs(moisActifs);
        
        return service.rechercher(criteria);
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

    @PutMapping("/{id}/mois-actifs")
    public ResponseEntity<DeclarationIR> modifierMoisActifs(@PathVariable Long id,
                                                             @RequestParam Integer moisActifs) {
        DeclarationIR saved = service.modifierMoisActifs(id, moisActifs);
        audit.log("MODIFICATION_MOIS_ACTIFS", "declaration_ir", id, "moisActifs=" + moisActifs);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/{id}/charges")
    public ResponseEntity<LigneCharge> ajouterCharge(@PathVariable Long id,
                                                      @RequestBody LigneCharge lc) {
        return ResponseEntity.ok(service.ajouterCharge(id, lc.getCategorie(),
                lc.getCategorieLibre(), lc.getMontantAr(), lc.getJustificatifRef()));
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
        DeclarationIR saved = service.marquerPayee(id);
        audit.log("MARQUER_PAYEE", "declaration_ir", id, null);
        return ResponseEntity.ok(saved);
    }

    @PatchMapping("/{id}/statut")
    public DeclarationIR changerStatut(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String statut = body.get("statut");
        if (statut == null || !(statut.equals("BROUILLON") || statut.equals("VALIDEE")
                || statut.equals("PAYEE") || statut.equals("EN_RETARD"))) {
            throw new BusinessException("Statut invalide : " + statut);
        }
        DeclarationIR d = service.trouverParId(id);
        String ancien = d.getStatut();
        d.setStatut(statut);
        if ("VALIDEE".equals(statut) && d.getDateDepot() == null) {
            d.setDateDepot(LocalDate.now());
        }
        repo.save(d);
        audit.log("CHANGEMENT_STATUT_DECLARATION", "declaration_ir", id,
                  "ancien=" + ancien + " nouveau=" + statut);
        return d;
    }
}
