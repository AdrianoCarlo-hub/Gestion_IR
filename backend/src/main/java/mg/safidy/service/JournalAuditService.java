package mg.safidy.service;

import mg.safidy.model.Agent;
import mg.safidy.model.JournalAudit;
import mg.safidy.repository.AgentRepository;
import mg.safidy.repository.JournalAuditRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class JournalAuditService {

    private final JournalAuditRepository journalRepository;
    private final AgentRepository agentRepository;

    public JournalAuditService(JournalAuditRepository journalRepository,
                                AgentRepository agentRepository) {
        this.journalRepository = journalRepository;
        this.agentRepository = agentRepository;
    }

    public List<JournalAudit> listerTout() {
        return journalRepository.findAllByOrderByDateHeureDesc();
    }

    public List<JournalAudit> listerParAgent(Long idAgent) {
        return journalRepository.findByAgentIdAgentOrderByDateHeureDesc(idAgent);
    }

    @Transactional
    public JournalAudit journaliser(Long idAgent, String action, String tableCible,
                                     Long idCible, String adresseIp, String details) {
        JournalAudit j = new JournalAudit();
        if (idAgent != null) {
            Agent a = agentRepository.findById(idAgent).orElse(null);
            j.setAgent(a);
        }
        j.setAction(action);
        j.setTableCible(tableCible);
        j.setIdCible(idCible);
        j.setAdresseIp(adresseIp);
        j.setDetails(details);
        j.setDateHeure(LocalDateTime.now());
        return journalRepository.save(j);
    }
}
