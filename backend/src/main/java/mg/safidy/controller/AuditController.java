package mg.safidy.controller;

import mg.safidy.model.JournalAudit;
import mg.safidy.service.JournalAuditService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit")
public class AuditController {

    private final JournalAuditService service;

    public AuditController(JournalAuditService service) {
        this.service = service;
    }

    @GetMapping
    public List<JournalAudit> lister() {
        return service.listerTout();
    }

    @GetMapping("/agent/{idAgent}")
    public List<JournalAudit> parAgent(@PathVariable Long idAgent) {
        return service.listerParAgent(idAgent);
    }
}
