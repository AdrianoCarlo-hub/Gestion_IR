package mg.safidy.controller;

import mg.safidy.dto.LoginRequest;
import mg.safidy.dto.LoginResponse;
import mg.safidy.exception.BusinessException;
import mg.safidy.model.Agent;
import mg.safidy.repository.AgentRepository;
import mg.safidy.security.JwtService;
import mg.safidy.service.AgentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AgentRepository agentRepository;
    private final AgentService agentService;
    private final JwtService jwtService;

    public AuthController(AgentRepository agentRepository,
                           AgentService agentService,
                           JwtService jwtService) {
        this.agentRepository = agentRepository;
        this.agentService = agentService;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest req) {
        if (req.getEmail() == null || req.getEmail().isBlank()
                || req.getMotDePasse() == null || req.getMotDePasse().isBlank()) {
            throw new BusinessException("E-mail et mot de passe obligatoires");
        }

        Agent agent = agentRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new BusinessException("E-mail ou mot de passe incorrect"));

        if (!"ACTIF".equals(agent.getStatut())) {
            throw new BusinessException("Compte non actif ou bloque");
        }

        if (!agentService.verifierMotDePasse(req.getMotDePasse(), agent.getMotDePasseHash())) {
            agentService.enregistrerEchecConnexion(agent);
            throw new BusinessException("E-mail ou mot de passe incorrect");
        }

        agentService.enregistrerConnexionReussie(agent);

        String token = jwtService.genererToken(agent);
        LoginResponse resp = new LoginResponse(
                token,
                agent.getIdAgent(),
                agent.getNom(),
                agent.getPrenom(),
                agent.getEmail(),
                agent.getRole());

        return ResponseEntity.ok(resp);
    }
}
