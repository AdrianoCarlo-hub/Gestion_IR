package mg.safidy.controller;

import mg.safidy.model.Acompte;
import mg.safidy.repository.AcompteRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/acomptes")
public class AcompteController {

    private final AcompteRepository repo;

    public AcompteController(AcompteRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<Acompte> lister() {
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
}
