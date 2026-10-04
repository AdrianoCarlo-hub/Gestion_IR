package mg.safidy.service;

import mg.safidy.exception.BusinessException;
import mg.safidy.model.Agent;
import mg.safidy.model.CentreFiscal;
import mg.safidy.model.Contribuable;
import mg.safidy.model.SecteurActivite;
import mg.safidy.repository.AgentRepository;
import mg.safidy.repository.CentreFiscalRepository;
import mg.safidy.repository.ContribuableRepository;
import mg.safidy.repository.SecteurActiviteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ContribuableService {

    private final ContribuableRepository contribuableRepository;
    private final SecteurActiviteRepository secteurRepository;
    private final CentreFiscalRepository centreRepository;
    private final AgentRepository agentRepository;

    public ContribuableService(ContribuableRepository contribuableRepository,
                                SecteurActiviteRepository secteurRepository,
                                CentreFiscalRepository centreRepository,
                                AgentRepository agentRepository) {
        this.contribuableRepository = contribuableRepository;
        this.secteurRepository = secteurRepository;
        this.centreRepository = centreRepository;
        this.agentRepository = agentRepository;
    }

    public List<Contribuable> lister() {
        return contribuableRepository.findAll();
    }

    public Contribuable trouverParId(Long id) {
        return contribuableRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Contribuable introuvable : id=" + id));
    }

    public Contribuable trouverParNif(String nif) {
        return contribuableRepository.findByNif(nif)
                .orElseThrow(() -> new BusinessException("Aucun contribuable avec le NIF " + nif));
    }

    public List<Contribuable> rechercher(String motCle, String statut, Long idSecteur) {
        String mc = (motCle == null || motCle.isBlank()) ? null : motCle.trim();
        String st = (statut == null || statut.isBlank()) ? null : statut.trim();
        return contribuableRepository.rechercher(mc, st, idSecteur);
    }

    @Transactional
    public Contribuable creer(Contribuable c) {
        valider(c, true);
        resoudreRelations(c);
        if (c.getStatut() == null) c.setStatut("ACTIF");
        if (c.getMoisCloture() == null) c.setMoisCloture(12);
        c.setDateCreation(LocalDateTime.now());
        return contribuableRepository.save(c);
    }

    @Transactional
    public Contribuable modifier(Long id, Contribuable c) {
        Contribuable existant = trouverParId(id);
        if (!existant.getNif().equals(c.getNif()) && contribuableRepository.existsByNif(c.getNif())) {
            throw new BusinessException("NIF deja utilise : " + c.getNif());
        }
        valider(c, false);
        existant.setNif(c.getNif());
        existant.setStat(c.getStat());
        existant.setRaisonSociale(c.getRaisonSociale());
        existant.setFormeJuridique(c.getFormeJuridique());
        existant.setNomDirigeant(c.getNomDirigeant());
        existant.setCinDirigeant(c.getCinDirigeant());
        existant.setAdresse(c.getAdresse());
        existant.setTelephone(c.getTelephone());
        existant.setEmail(c.getEmail());
        existant.setRegime(c.getRegime());
        existant.setDateImmatriculation(c.getDateImmatriculation());
        existant.setMoisCloture(c.getMoisCloture());

        if (c.getSecteur() != null && c.getSecteur().getIdSecteur() != null) {
            SecteurActivite s = secteurRepository.findById(c.getSecteur().getIdSecteur())
                    .orElseThrow(() -> new BusinessException("Secteur introuvable"));
            existant.setSecteur(s);
        }
        return contribuableRepository.save(existant);
    }

    @Transactional
    public Contribuable changerStatut(Long id, String nouveauStatut) {
        Contribuable c = trouverParId(id);
        c.setStatut(nouveauStatut);
        return contribuableRepository.save(c);
    }

    private void valider(Contribuable c, boolean creation) {
        if (c.getNif() == null || !c.getNif().matches("\\d{10}")) {
            throw new BusinessException("NIF : 10 chiffres requis");
        }
        if (creation && contribuableRepository.existsByNif(c.getNif())) {
            throw new BusinessException("NIF deja utilise : " + c.getNif());
        }
        if (c.getRaisonSociale() == null || c.getRaisonSociale().isBlank()) {
            throw new BusinessException("Raison sociale obligatoire");
        }
        if (c.getCinDirigeant() == null || !c.getCinDirigeant().matches("\\d{12}")) {
            throw new BusinessException("CIN : 12 chiffres requis");
        }
        if (c.getStat() != null && !c.getStat().isBlank() && !c.getStat().matches("\\d{17}")) {
            throw new BusinessException("STAT : 17 chiffres si renseigne");
        }
        if (c.getTelephone() != null && !c.getTelephone().isBlank()
                && !c.getTelephone().matches("0\\d{9}")) {
            throw new BusinessException("Telephone : 10 chiffres attendus");
        }
        if (c.getDateImmatriculation() != null && c.getDateImmatriculation().isAfter(LocalDate.now())) {
            throw new BusinessException("Date d'immatriculation dans le futur interdite");
        }
    }

    private void resoudreRelations(Contribuable c) {
        if (c.getSecteur() == null || c.getSecteur().getIdSecteur() == null) {
            throw new BusinessException("Secteur d'activite obligatoire");
        }
        SecteurActivite s = secteurRepository.findById(c.getSecteur().getIdSecteur())
                .orElseThrow(() -> new BusinessException("Secteur introuvable"));
        c.setSecteur(s);

        if (c.getCentre() == null || c.getCentre().getIdCentre() == null) {
            throw new BusinessException("Centre fiscal obligatoire");
        }
        CentreFiscal cf = centreRepository.findById(c.getCentre().getIdCentre())
                .orElseThrow(() -> new BusinessException("Centre fiscal introuvable"));
        c.setCentre(cf);

        if (c.getAgent() == null || c.getAgent().getIdAgent() == null) {
            throw new BusinessException("Agent obligatoire");
        }
        Agent a = agentRepository.findById(c.getAgent().getIdAgent())
                .orElseThrow(() -> new BusinessException("Agent introuvable"));
        c.setAgent(a);
    }
}
