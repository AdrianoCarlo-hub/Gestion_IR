package mg.safidy.controller;

import mg.safidy.dto.SituationPenalitesDTO;
import mg.safidy.model.Penalite;
import mg.safidy.repository.PenaliteRepository;
import mg.safidy.service.PenaliteService;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/penalites")
public class PenaliteController {

    private final PenaliteService service;
    private final PenaliteRepository repo;

    public PenaliteController(PenaliteService service, PenaliteRepository repo) {
        this.service = service;
        this.repo = repo;
    }

    @GetMapping("/declaration/{idDeclaration}")
    public List<Penalite> parDeclaration(@PathVariable Long idDeclaration) {
        return repo.findByDeclarationIdDeclaration(idDeclaration);
    }

    @GetMapping("/situation/{id}")
    public SituationPenalitesDTO situation(@PathVariable Long id,
                                           @RequestParam(required = false) Integer annee) {
        return service.calculerSituation(id, annee);
    }

    @PostMapping("/amende-depot")
    public Penalite amendeDepot(@RequestBody Map<String, String> body) {
        Long id = Long.valueOf(body.get("idDeclaration"));
        LocalDate date = LocalDate.parse(body.get("dateDepot"));
        return service.appliquerAmendeDepotTardif(id, date);
    }

    @PostMapping("/interet-retard")
    public Penalite interetRetard(@RequestBody Map<String, String> body) {
        Long id = Long.valueOf(body.get("idDeclaration"));
        LocalDate date = LocalDate.parse(body.get("datePaiement"));
        return service.appliquerMajorationRetard(id, date);
    }

    @PostMapping("/calculer-depot/{idDecl}")
    public Penalite calculerDepot(@PathVariable Long idDecl,
                                  @RequestBody(required = false) Map<String, String> body) {
        LocalDate date = (body != null && body.get("dateDepot") != null)
                ? LocalDate.parse(body.get("dateDepot"))
                : LocalDate.now();
        return service.appliquerAmendeDepotTardif(idDecl, date);
    }

    @PostMapping("/calculer-majoration/{idDecl}")
    public Penalite calculerMajoration(@PathVariable Long idDecl,
                                       @RequestBody(required = false) Map<String, String> body) {
        LocalDate date = (body != null && body.get("datePaiement") != null)
                ? LocalDate.parse(body.get("datePaiement"))
                : LocalDate.now();
        return service.appliquerMajorationRetard(idDecl, date);
    }

    @PostMapping("/specifique/{idDecl}")
    public Penalite specifique(@PathVariable Long idDecl, @RequestBody Map<String, Object> body) {
        String motif = body.get("motif").toString();
        Long complement = body.get("complementImpot") == null
                ? null : Long.valueOf(body.get("complementImpot").toString());
        return service.appliquerAmendeSpecifique(idDecl, motif, complement);
    }

    @PostMapping("/{id}/remise-gracieuse")
    public Penalite remiseGracieuse(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return service.demanderRemiseGracieuse(id, body.get("motif"), body.get("justificatif"));
    }

    @PostMapping("/{id}/decider-remise")
    public Penalite deciderRemise(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        boolean accordee = Boolean.parseBoolean(String.valueOf(body.get("accordee")));
        String decision = body.get("decision") == null ? null : body.get("decision").toString();
        Long idAgent = body.get("idAgent") == null ? null : Long.valueOf(body.get("idAgent").toString());
        return service.deciderRemise(id, accordee, decision, idAgent);
    }

    @PostMapping("/{id}/annuler")
    public Penalite annuler(@PathVariable Long id,
                            @RequestBody(required = false) Map<String, String> body) {
        String motif = body == null ? null : body.get("motif");
        return service.annuler(id, motif);
    }

    @PatchMapping("/{id}/statut")
    public Penalite changerStatut(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return service.changerStatut(id, body.get("statut"));
    }
}
