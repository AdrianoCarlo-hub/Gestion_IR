package mg.safidy.controller;

import mg.safidy.model.CentreFiscal;
import mg.safidy.repository.CentreFiscalRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/centres")
public class CentreFiscalController {

    private final CentreFiscalRepository repo;

    public CentreFiscalController(CentreFiscalRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<CentreFiscal> lister() {
        return repo.findAll();
    }
}
