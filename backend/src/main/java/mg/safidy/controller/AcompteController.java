package mg.safidy.controller;

import mg.safidy.config.AuditLogger;
import mg.safidy.dto.SituationAcomptesDTO;
import mg.safidy.model.Acompte;
import mg.safidy.repository.AcompteRepository;
import mg.safidy.service.AcompteService;
import mg.safidy.service.StatutAutomatiqueService;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/acomptes")
public class AcompteController {

    private final AcompteRepository repo;
    private final AcompteService service;
    private final AuditLogger audit;
    private final StatutAutomatiqueService statutAutomatiqueService;

    public AcompteController(AcompteRepository repo, AcompteService service, AuditLogger audit,
                              StatutAutomatiqueService statutAutomatiqueService) {
        this.repo = repo;
        this.service = service;
        this.audit = audit;
        this.statutAutomatiqueService = statutAutomatiqueService;
    }

    @GetMapping
    public List<Acompte> lister() {
        // Passage automatique en EN_RETARD des acomptes echus (sans scheduler)
        statutAutomatiqueService.appliquerRetards();
        return repo.findAll();
    }

    @GetMapping("/contribuable/{id}")
    public List<Acompte> parContribuable(@PathVariable Long id) {
        return repo.findByContribuableIdContribuableOrderByAnneeAsc(id);
    }

    @GetMapping("/statut/{statut}")
    public List<Acompte> parStatut(@PathVariable String statut) {
        return repo.findByStatutOrderByDateEcheanceAsc(statut);
    }

    @GetMapping("/{id}")
    public Acompte trouver(@PathVariable Long id) {
        return repo.findById(id).orElseThrow();
    }

    @PatchMapping("/{id}/statut")
    public Acompte changerStatut(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String statut = body.get("statut");
        Acompte ancien = service.trouverParId(id);
        String statutPrecedent = ancien.getStatut();
        Acompte a = service.changerStatut(id, statut);
        audit.log("CHANGEMENT_STATUT_ACOMPTE", "acompte", id,
                  "ancien=" + statutPrecedent + " nouveau=" + statut);
        return a;
    }

    @GetMapping("/situation/{id}")
    public SituationAcomptesDTO situation(@PathVariable Long id,
                                          @RequestParam(required = false) Integer annee) {
        return service.calculerSituationAcomptes(id, annee);
    }

    @PostMapping("/douane")
    public Acompte enregistrerDouane(@RequestBody Map<String, Object> body) {
        Long idContribuable = Long.valueOf(body.get("idContribuable").toString());
        String reference = body.get("referenceDouane").toString();
        Long valeurCaf = Long.valueOf(body.get("valeurCaf").toString());
        Integer annee = body.get("annee") == null ? null : Integer.valueOf(body.get("annee").toString());
        LocalDate date = body.get("date") == null ? null : LocalDate.parse(body.get("date").toString());
        Acompte a = service.enregistrerAcompteDouane(idContribuable, reference, valeurCaf, annee, date);
        audit.log("CREATION_ACOMPTE_DOUANE", "acompte", a.getIdAcompte(),
                  "ref=" + reference + " caf=" + valeurCaf);
        return a;
    }

    @PostMapping("/{id}/suspendre")
    public Acompte suspendre(@PathVariable Long id) {
        Acompte a = service.demanderSuspension(id);
        audit.log("SUSPENSION_ACOMPTE", "acompte", id, "statut=SUSPENDU");
        return a;
    }

    @PostMapping("/{id}/reactiver")
    public Acompte reactiver(@PathVariable Long id) {
        Acompte a = service.reactiver(id);
        audit.log("REACTIVATION_ACOMPTE", "acompte", id, "statut=A_PAYER");
        return a;
    }
}
