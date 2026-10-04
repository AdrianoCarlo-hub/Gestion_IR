package mg.safidy.controller;

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

    @PostMapping("/amende-depot")
    public Penalite amendeDepot(@RequestBody Map<String, String> body) {
        Long id = Long.valueOf(body.get("idDeclaration"));
        LocalDate date = LocalDate.parse(body.get("dateDepot"));
        return service.calculerAmendeDepotTardif(id, date);
    }

    @PostMapping("/interet-retard")
    public Penalite interetRetard(@RequestBody Map<String, String> body) {
        Long id = Long.valueOf(body.get("idDeclaration"));
        LocalDate date = LocalDate.parse(body.get("datePaiement"));
        return service.calculerInteretRetard(id, date);
    }

    @PostMapping("/{id}/annuler")
    public Penalite annuler(@PathVariable Long id) {
        return service.annuler(id);
    }
}
