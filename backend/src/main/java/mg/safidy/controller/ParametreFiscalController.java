package mg.safidy.controller;

import mg.safidy.config.AuditLogger;
import mg.safidy.model.ParametreFiscal;
import mg.safidy.service.ParametreFiscalService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * Module ADMIN : parametres fiscaux. Lecture pour ADMIN/RESPONSABLE,
 * modification pour ADMIN uniquement.
 */
@RestController
@RequestMapping("/api/parametres")
public class ParametreFiscalController {

    private final ParametreFiscalService service;
    private final AuditLogger audit;

    public ParametreFiscalController(ParametreFiscalService service, AuditLogger audit) {
        this.service = service;
        this.audit = audit;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE')")
    public List<ParametreFiscal> lister() {
        return service.lister();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','RESPONSABLE')")
    public ParametreFiscal trouver(@PathVariable Long id) {
        return service.trouverParId(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ParametreFiscal modifier(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        BigDecimal valeur = new BigDecimal(body.get("valeur").toString());
        ParametreFiscal saved = service.modifierValeur(id, valeur);
        audit.log("MODIFICATION_PARAMETRE", "parametre_fiscal", id,
                  "code=" + saved.getCode() + " valeur=" + valeur);
        return saved;
    }
}
