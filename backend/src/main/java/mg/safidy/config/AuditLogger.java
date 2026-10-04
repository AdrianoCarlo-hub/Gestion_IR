package mg.safidy.config;

import jakarta.servlet.http.HttpServletRequest;
import mg.safidy.model.Agent;
import mg.safidy.repository.AgentRepository;
import mg.safidy.service.JournalAuditService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Component
public class AuditLogger {

    private final JournalAuditService auditService;
    private final AgentRepository agentRepository;

    public AuditLogger(JournalAuditService auditService, AgentRepository agentRepository) {
        this.auditService = auditService;
        this.agentRepository = agentRepository;
    }

    public void log(String action, String table, Long idCible, String details) {
        try {
            String ip = "inconnue";
            ServletRequestAttributes attrs =
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                HttpServletRequest req = attrs.getRequest();
                ip = req.getRemoteAddr();
            }

            Long idAgent = null;
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getName() != null) {
                Agent agent = agentRepository.findByEmail(auth.getName()).orElse(null);
                if (agent != null) idAgent = agent.getIdAgent();
            }

            auditService.journaliser(idAgent, action, table, idCible, ip, details);
        } catch (Exception e) {
            // Ne jamais casser une requete a cause de l'audit
        }
    }
}
