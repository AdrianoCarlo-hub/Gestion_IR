package mg.safidy.security;

import mg.safidy.model.Agent;
import mg.safidy.repository.AgentRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final AgentRepository agentRepository;

    public CustomUserDetailsService(AgentRepository agentRepository) {
        this.agentRepository = agentRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Agent agent = agentRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Agent introuvable : " + email));

        if (!"ACTIF".equals(agent.getStatut())) {
            throw new UsernameNotFoundException("Compte non actif : " + agent.getStatut());
        }

        return new User(
                agent.getEmail(),
                agent.getMotDePasseHash(),
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + agent.getRole()))
        );
    }
}
