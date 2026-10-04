package mg.safidy.service;

import mg.safidy.exception.BusinessException;
import mg.safidy.model.Agent;
import mg.safidy.model.Acompte;
import mg.safidy.model.Contribuable;
import mg.safidy.model.SuspensionActivite;
import mg.safidy.repository.AcompteRepository;
import mg.safidy.repository.AgentRepository;
import mg.safidy.repository.ContribuableRepository;
import mg.safidy.repository.SuspensionActiviteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class SuspensionService {

    private final SuspensionActiviteRepository suspensionRepository;
    private final ContribuableRepository contribuableRepository;
    private final AgentRepository agentRepository;
    private final AcompteRepository acompteRepository;

    public SuspensionService(SuspensionActiviteRepository suspensionRepository,
                              ContribuableRepository contribuableRepository,
                              AgentRepository agentRepository,
                              AcompteRepository acompteRepository) {
        this.suspensionRepository = suspensionRepository;
        this.contribuableRepository = contribuableRepository;
        this.agentRepository = agentRepository;
        this.acompteRepository = acompteRepository;
    }

    public List<SuspensionActivite> listerParContribuable(Long idContribuable) {
        return suspensionRepository.findByContribuableIdContribuableOrderByDateArretDesc(idContribuable);
    }

    @Transactional
    public SuspensionActivite declarerArret(Long idContribuable, LocalDate dateArret,
                                             String motif, String refDeclaration, Long idAgent) {
        Contribuable c = contribuableRepository.findById(idContribuable)
                .orElseThrow(() -> new BusinessException("Contribuable introuvable"));

        if (!"ACTIF".equals(c.getStatut())) {
            throw new BusinessException("Contribuable non actif : " + c.getStatut());
        }
        if (suspensionRepository.findByContribuableIdContribuableAndStatut(idContribuable, "EN_COURS").isPresent()) {
            throw new BusinessException("Cette entreprise est deja suspendue");
        }
        if (dateArret == null || dateArret.isAfter(LocalDate.now())) {
            throw new BusinessException("Date d'arret invalide");
        }
        if (motif == null || !(motif.equals("MANQUE_ACTIVITE") || motif.equals("TRAVAUX")
                || motif.equals("SAISON") || motif.equals("DIFFICULTE_FINANCIERE")
                || motif.equals("AUTRE"))) {
            throw new BusinessException("Motif d'arret invalide");
        }

        Agent agent = agentRepository.findById(idAgent)
                .orElseThrow(() -> new BusinessException("Agent introuvable"));

        SuspensionActivite s = new SuspensionActivite();
        s.setContribuable(c);
        s.setDateArret(dateArret);
        s.setMotif(motif);
        s.setRefDeclaration(refDeclaration);
        s.setStatut("EN_COURS");
        s.setAgentArret(agent);
        s.setDateCreation(LocalDateTime.now());
        SuspensionActivite saved = suspensionRepository.save(s);

        c.setStatut("SUSPENDU");
        contribuableRepository.save(c);

        int anneeCourante = LocalDate.now().getYear();
        List<Acompte> acomptes = acompteRepository
                .findByContribuableIdContribuableAndAnneeOrderByNumeroAsc(idContribuable, anneeCourante);
        for (Acompte a : acomptes) {
            if ("A_PAYER".equals(a.getStatut()) && a.getDateEcheance().isAfter(dateArret)) {
                a.setStatut("SUSPENDU");
                acompteRepository.save(a);
            }
        }
        return saved;
    }

    @Transactional
    public SuspensionActivite declarerReprise(Long idSuspension, LocalDate dateReprise, Long idAgent) {
        SuspensionActivite s = suspensionRepository.findById(idSuspension)
                .orElseThrow(() -> new BusinessException("Suspension introuvable"));
        if (!"EN_COURS".equals(s.getStatut())) {
            throw new BusinessException("Cette suspension est deja cloturee");
        }
        if (dateReprise == null || !dateReprise.isAfter(s.getDateArret())) {
            throw new BusinessException("Date de reprise doit etre posterieure a la date d'arret");
        }
        if (dateReprise.isAfter(LocalDate.now())) {
            throw new BusinessException("Date de reprise dans le futur interdite");
        }

        Agent agent = agentRepository.findById(idAgent)
                .orElseThrow(() -> new BusinessException("Agent introuvable"));

        s.setDateReprise(dateReprise);
        s.setStatut("TERMINEE");
        s.setAgentReprise(agent);
        SuspensionActivite saved = suspensionRepository.save(s);

        Contribuable c = s.getContribuable();
        c.setStatut("ACTIF");
        contribuableRepository.save(c);
        return saved;
    }

    @Transactional
    public SuspensionActivite annuler(Long idSuspension) {
        SuspensionActivite s = suspensionRepository.findById(idSuspension)
                .orElseThrow(() -> new BusinessException("Suspension introuvable"));
        s.setStatut("ANNULEE");
        SuspensionActivite saved = suspensionRepository.save(s);
        Contribuable c = s.getContribuable();
        c.setStatut("ACTIF");
        contribuableRepository.save(c);
        return saved;
    }
}
