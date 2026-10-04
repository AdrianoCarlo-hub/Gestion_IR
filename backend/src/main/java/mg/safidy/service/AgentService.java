package mg.safidy.service;

import mg.safidy.exception.BusinessException;
import mg.safidy.model.Agent;
import mg.safidy.model.CentreFiscal;
import mg.safidy.repository.AgentRepository;
import mg.safidy.repository.CentreFiscalRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AgentService {

    private static final int MAX_TENTATIVES = 5;

    private final AgentRepository agentRepository;
    private final CentreFiscalRepository centreRepository;
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AgentService(AgentRepository agentRepository,
                         CentreFiscalRepository centreRepository) {
        this.agentRepository = agentRepository;
        this.centreRepository = centreRepository;
    }

    public List<Agent> lister() {
        return agentRepository.findAll();
    }

    public Agent trouverParId(Long id) {
        return agentRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Agent introuvable : id=" + id));
    }

    public Agent trouverParEmail(String email) {
        return agentRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("Aucun agent avec l'email " + email));
    }

    @Transactional
    public Agent creer(Agent agent, String motDePasseClair) {
        valider(agent, motDePasseClair, true);

        if (agent.getCentre() == null || agent.getCentre().getIdCentre() == null) {
            throw new BusinessException("Centre fiscal obligatoire");
        }
        CentreFiscal c = centreRepository.findById(agent.getCentre().getIdCentre())
                .orElseThrow(() -> new BusinessException("Centre fiscal introuvable"));
        agent.setCentre(c);

        agent.setMotDePasseHash(passwordEncoder.encode(motDePasseClair));
        if (agent.getStatut() == null) agent.setStatut("ACTIF");
        if (agent.getTentativesEchec() == null) agent.setTentativesEchec(0);
        agent.setDateCreation(LocalDateTime.now());
        return agentRepository.save(agent);
    }

    @Transactional
    public Agent modifier(Long id, Agent modif) {
        Agent a = trouverParId(id);
        if (!a.getEmail().equals(modif.getEmail()) && agentRepository.existsByEmail(modif.getEmail())) {
            throw new BusinessException("Email deja utilise : " + modif.getEmail());
        }
        a.setNom(modif.getNom());
        a.setPrenom(modif.getPrenom());
        a.setEmail(modif.getEmail());
        a.setRole(modif.getRole());
        return agentRepository.save(a);
    }

    @Transactional
    public Agent changerStatut(Long id, String statut) {
        Agent a = trouverParId(id);
        a.setStatut(statut);
        if ("ACTIF".equals(statut)) a.setTentativesEchec(0);
        return agentRepository.save(a);
    }

    @Transactional
    public Agent reinitialiserMotDePasse(Long id, String nouveauMotDePasse) {
        if (nouveauMotDePasse == null || nouveauMotDePasse.length() < 8) {
            throw new BusinessException("Mot de passe : 8 caracteres minimum");
        }
        Agent a = trouverParId(id);
        a.setMotDePasseHash(passwordEncoder.encode(nouveauMotDePasse));
        a.setTentativesEchec(0);
        return agentRepository.save(a);
    }

    @Transactional
    public void enregistrerConnexionReussie(Agent a) {
        a.setTentativesEchec(0);
        a.setDerniereConnexion(LocalDateTime.now());
        agentRepository.save(a);
    }

    @Transactional
    public void enregistrerEchecConnexion(Agent a) {
        int n = (a.getTentativesEchec() == null ? 0 : a.getTentativesEchec()) + 1;
        a.setTentativesEchec(n);
        if (n >= MAX_TENTATIVES) {
            a.setStatut("BLOQUE");
        }
        agentRepository.save(a);
    }

    public boolean verifierMotDePasse(String clair, String hash) {
        return passwordEncoder.matches(clair, hash);
    }

    private void valider(Agent a, String mdp, boolean creation) {
        if (a.getMatricule() == null || a.getMatricule().isBlank()) {
            throw new BusinessException("Matricule obligatoire");
        }
        if (creation && agentRepository.existsByMatricule(a.getMatricule())) {
            throw new BusinessException("Matricule deja utilise");
        }
        if (a.getNom() == null || a.getNom().isBlank()) {
            throw new BusinessException("Nom obligatoire");
        }
        if (a.getPrenom() == null || a.getPrenom().isBlank()) {
            throw new BusinessException("Prenom obligatoire");
        }
        if (a.getEmail() == null || !a.getEmail().matches("^[\\w.+-]+@[\\w-]+\\.[\\w.-]+$")) {
            throw new BusinessException("Email invalide");
        }
        if (creation && agentRepository.existsByEmail(a.getEmail())) {
            throw new BusinessException("Email deja utilise");
        }
        if (mdp == null || mdp.length() < 8) {
            throw new BusinessException("Mot de passe : 8 caracteres minimum");
        }
        if (a.getRole() == null || !(a.getRole().equals("AGENT")
                || a.getRole().equals("RESPONSABLE")
                || a.getRole().equals("ADMIN"))) {
            throw new BusinessException("Role invalide");
        }
    }
}
