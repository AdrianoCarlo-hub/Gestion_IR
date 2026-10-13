package mg.safidy.service;

import mg.safidy.exception.BusinessException;
import mg.safidy.model.Acompte;
import mg.safidy.model.Agent;
import mg.safidy.model.Contribuable;
import mg.safidy.model.DeclarationIR;
import mg.safidy.model.Paiement;
import mg.safidy.repository.AcompteRepository;
import mg.safidy.repository.AgentRepository;
import mg.safidy.repository.ContribuableRepository;
import mg.safidy.repository.DeclarationIRRepository;
import mg.safidy.repository.PaiementRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class PaiementService {

    private final PaiementRepository paiementRepository;
    private final ContribuableRepository contribuableRepository;
    private final DeclarationIRRepository declarationRepository;
    private final AcompteRepository acompteRepository;
    private final AgentRepository agentRepository;

    public PaiementService(PaiementRepository paiementRepository,
                            ContribuableRepository contribuableRepository,
                            DeclarationIRRepository declarationRepository,
                            AcompteRepository acompteRepository,
                            AgentRepository agentRepository) {
        this.paiementRepository = paiementRepository;
        this.contribuableRepository = contribuableRepository;
        this.declarationRepository = declarationRepository;
        this.acompteRepository = acompteRepository;
        this.agentRepository = agentRepository;
    }

    public List<Paiement> lister() {
        return paiementRepository.findAll();
    }

    public List<Paiement> listerParContribuable(Long idContribuable) {
        return paiementRepository.findByContribuableIdContribuableOrderByDatePaiementDesc(idContribuable);
    }

    public Paiement trouverParId(Long id) {
        return paiementRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Paiement introuvable : id=" + id));
    }

    @Transactional
    public Paiement enregistrer(Long idContribuable, Long idDeclaration, Long idAcompte,
                                 String typePaiement, Long montantAr, LocalDate datePaiement,
                                 String mode, Long idAgent) {

        Contribuable c = contribuableRepository.findById(idContribuable)
                .orElseThrow(() -> new BusinessException("Contribuable introuvable"));

        if (montantAr == null || montantAr <= 0) {
            throw new BusinessException("Montant du paiement > 0 requis");
        }
        if (datePaiement == null || datePaiement.isAfter(LocalDate.now())) {
            throw new BusinessException("Date de paiement dans le futur interdite");
        }
        if (mode == null || !(mode.equals("VIREMENT") || mode.equals("CHEQUE")
                || mode.equals("ESPECES") || mode.equals("MOBILE_MONEY"))) {
            throw new BusinessException("Mode de paiement invalide");
        }

        DeclarationIR d = null;
        if (idDeclaration != null) {
            d = declarationRepository.findById(idDeclaration)
                    .orElseThrow(() -> new BusinessException("Declaration introuvable"));
        }
        Acompte a = null;
        if (idAcompte != null) {
            a = acompteRepository.findById(idAcompte)
                    .orElseThrow(() -> new BusinessException("Acompte introuvable"));
        }
        if (d == null && a == null) {
            throw new BusinessException("Paiement doit viser une declaration ou un acompte");
        }

        // Regle CT8 : un contribuable SUSPENDU/CESSE/RADIE ne peut payer
        // que pour solder une dette existante.
        String statutContribuable = c.getStatut();
        if (!"ACTIF".equals(statutContribuable)) {
            boolean soldeUneDette =
                (d != null && d.getSoldeAPayer() != null && d.getSoldeAPayer() > 0)
                || (a != null && !"PAYE".equals(a.getStatut()));
            if (!soldeUneDette) {
                throw new BusinessException(
                    "Entreprise " + statutContribuable
                    + " : paiement autorise uniquement pour solder une dette existante");
            }
        }

        Agent agent = agentRepository.findById(idAgent)
                .orElseThrow(() -> new BusinessException("Agent introuvable"));

        Paiement p = new Paiement();
        p.setContribuable(c);
        p.setDeclaration(d);
        p.setAcompte(a);
        p.setTypePaiement(typePaiement);
        p.setMontantAr(montantAr);
        p.setDatePaiement(datePaiement);
        p.setMode(mode);
        p.setReferenceQuittance(genererQuittance(datePaiement));
        p.setAgent(agent);
        p.setAnnule(false);
        p.setDateCreation(LocalDateTime.now());

        Paiement saved = paiementRepository.save(p);

        if (a != null) {
            a.setStatut("PAYE");
            acompteRepository.save(a);
        }

        if (d != null) {
            long totalPaye = paiementRepository.findByDeclarationIdDeclaration(d.getIdDeclaration())
                    .stream().filter(x -> !Boolean.TRUE.equals(x.getAnnule()))
                    .mapToLong(Paiement::getMontantAr).sum();
            if (d.getIrDu() != null && totalPaye >= d.getIrDu()) {
                d.setStatut("PAYEE");
                declarationRepository.save(d);
            }
        }

        return saved;
    }

    @Transactional
    public Paiement annuler(Long idPaiement, String motif) {
        Paiement p = trouverParId(idPaiement);
        if (Boolean.TRUE.equals(p.getAnnule())) {
            throw new BusinessException("Paiement deja annule");
        }
        if (motif == null || motif.isBlank()) {
            throw new BusinessException("Motif d'annulation obligatoire");
        }
        p.setAnnule(true);
        p.setMotifAnnulation(motif);
        return paiementRepository.save(p);
    }

    private String genererQuittance(LocalDate datePaiement) {
        String datePart = datePaiement.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long n = System.currentTimeMillis() % 100000;
        String ref = "Q-" + datePart + "-" + String.format("%05d", n);
        int essai = 0;
        while (paiementRepository.existsByReferenceQuittance(ref) && essai < 5) {
            n = (n + 1) % 100000;
            ref = "Q-" + datePart + "-" + String.format("%05d", n);
            essai++;
        }
        return ref;
    }
}
