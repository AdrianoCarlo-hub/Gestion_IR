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
    private final AcompteService acompteService;

    public ContribuableService(ContribuableRepository contribuableRepository,
                                SecteurActiviteRepository secteurRepository,
                                CentreFiscalRepository centreRepository,
                                AgentRepository agentRepository,
                                AcompteService acompteService) {
        this.contribuableRepository = contribuableRepository;
        this.secteurRepository = secteurRepository;
        this.centreRepository = centreRepository;
        this.agentRepository = agentRepository;
        this.acompteService = acompteService;
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
        String mc = (motCle == null || motCle.isBlank()) ? "" : motCle.trim();
        String st = (statut == null || statut.isBlank()) ? "" : statut.trim();
        Long sec = (idSecteur == null) ? 0L : idSecteur;
        return contribuableRepository.rechercher(mc, st, sec);
    }

    @Transactional
    public Contribuable creer(Contribuable c) {
        valider(c, true);
        resoudreRelations(c);
        if (c.getStatut() == null) c.setStatut("ACTIF");
        if (c.getMoisCloture() == null) c.setMoisCloture(12);
        c.setDateCreation(LocalDateTime.now());
        Contribuable saved = contribuableRepository.save(c);

        // Regle : un acompte de debut d'activite (CREATION) est genere automatiquement.
        acompteService.creerAcompteCreation(saved.getIdContribuable());

        return saved;
    }

    @Transactional
    public Contribuable modifier(Long id, Contribuable c) {
        Contribuable existant = trouverParId(id);
        valider(c, false);
        if (!existant.getNif().equals(c.getNif()) && contribuableRepository.existsByNif(c.getNif())) {
            throw new BusinessException("Ce NIF existe deja : " + c.getNif());
        }
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

    /**
     * Validations metier strictes.
     *
     * Regles :
     *  - NIF : 10 chiffres exactement, unique
     *  - CIN : 12 chiffres, le 6e chiffre doit etre 0 ou 1
     *  - STAT : 17 chiffres si renseigne
     *  - Telephone : 10 chiffres commencant par 031, 032, 033, 034 ou 038
     *  - Date immatriculation : dans le passe, >= 1900
     *  - Raison sociale, dirigeant, adresse : obligatoires
     */
    private void valider(Contribuable c, boolean creation) {
        // NIF : 10 chiffres
        if (c.getNif() == null || !c.getNif().matches("\\d{10}")) {
            throw new BusinessException("NIF : 10 chiffres requis");
        }
        if (creation && contribuableRepository.existsByNif(c.getNif())) {
            throw new BusinessException("Ce NIF existe deja : " + c.getNif());
        }

        // STAT : 17 chiffres si renseigne
        if (c.getStat() != null && !c.getStat().isBlank()
                && !c.getStat().matches("\\d{17}")) {
            throw new BusinessException("STAT : 17 chiffres si renseigne");
        }

        // CIN : 12 chiffres dont le 6e doit etre 0 ou 1
        if (c.getCinDirigeant() == null || c.getCinDirigeant().isBlank()) {
            throw new BusinessException("CIN du dirigeant obligatoire");
        }
        if (!c.getCinDirigeant().matches("\\d{12}")) {
            throw new BusinessException("CIN : 12 chiffres requis");
        }
        // Le 6e chiffre (index 5) doit etre 0 ou 1
        char sixiemeChiffre = c.getCinDirigeant().charAt(5);
        if (sixiemeChiffre != '0' && sixiemeChiffre != '1') {
            throw new BusinessException("CIN : le 6eme chiffre doit etre 0 ou 1");
        }

        // Telephone : 10 chiffres, prefixe 031/032/033/034/038
        if (c.getTelephone() != null && !c.getTelephone().isBlank()) {
            if (!c.getTelephone().matches("\\d{10}")) {
                throw new BusinessException("Telephone : 10 chiffres requis");
            }
            String prefixe = c.getTelephone().substring(0, 3);
            if (!prefixe.equals("031") && !prefixe.equals("032")
                    && !prefixe.equals("033") && !prefixe.equals("034")
                    && !prefixe.equals("038")) {
                throw new BusinessException(
                    "Telephone : doit commencer par 031, 032, 033, 034 ou 038");
            }
        }

        // Raison sociale obligatoire
        if (c.getRaisonSociale() == null || c.getRaisonSociale().isBlank()) {
            throw new BusinessException("Raison sociale obligatoire");
        }
        if (c.getRaisonSociale().trim().length() < 2
                || c.getRaisonSociale().trim().length() > 150) {
            throw new BusinessException("Raison sociale : 2 a 150 caracteres");
        }

        // Nom du dirigeant
        if (c.getNomDirigeant() == null || c.getNomDirigeant().isBlank()) {
            throw new BusinessException("Nom du dirigeant obligatoire");
        }

        // Adresse
        if (c.getAdresse() == null || c.getAdresse().isBlank()) {
            throw new BusinessException("Adresse obligatoire");
        }

        // Date d'immatriculation : dans le passe, >= 1900
        if (c.getDateImmatriculation() == null) {
            throw new BusinessException("Date d'immatriculation obligatoire");
        }
        if (c.getDateImmatriculation().isAfter(LocalDate.now())) {
            throw new BusinessException("Date d'immatriculation dans le futur interdite");
        }
        if (c.getDateImmatriculation().getYear() < 1900) {
            throw new BusinessException("Date d'immatriculation invalide (>= 1900)");
        }

        // Mois cloture : 1 a 12
        if (c.getMoisCloture() != null
                && (c.getMoisCloture() < 1 || c.getMoisCloture() > 12)) {
            throw new BusinessException("Mois de cloture : 1 a 12");
        }

        // Forme juridique
        if (c.getFormeJuridique() == null || c.getFormeJuridique().isBlank()) {
            throw new BusinessException("Forme juridique obligatoire");
        }

        // Regime
        if (c.getRegime() == null || c.getRegime().isBlank()) {
            throw new BusinessException("Regime obligatoire");
        }
        if (!c.getRegime().equals("REEL_OBLIGATOIRE")
                && !c.getRegime().equals("REEL_OPTION")) {
            throw new BusinessException("Regime invalide (REEL_OBLIGATOIRE ou REEL_OPTION)");
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
