package mg.safidy.controller;

import mg.safidy.model.SecteurActivite;
import mg.safidy.repository.SecteurActiviteRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/secteurs")
public class SecteurController {

    private final SecteurActiviteRepository repo;

    public SecteurController(SecteurActiviteRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<SecteurActivite> lister() {
        return repo.findByActifTrueOrderByLibelleAsc();
    }

    @GetMapping("/tous")
    public List<SecteurActivite> listerTous() {
        return repo.findAll();
    }

    @GetMapping("/{id}")
    public SecteurActivite trouver(@PathVariable Long id) {
        return repo.findById(id).orElseThrow();
    }
}
