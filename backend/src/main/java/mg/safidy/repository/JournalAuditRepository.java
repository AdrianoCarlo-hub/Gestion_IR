package mg.safidy.repository;

import mg.safidy.model.JournalAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface JournalAuditRepository extends JpaRepository<JournalAudit, Long> {

    List<JournalAudit> findByAgentIdAgentOrderByDateHeureDesc(Long idAgent);

    List<JournalAudit> findAllByOrderByDateHeureDesc();
}
