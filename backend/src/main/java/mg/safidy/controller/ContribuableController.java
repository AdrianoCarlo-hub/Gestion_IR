package mg.safidy.controller;

import mg.safidy.config.AuditLogger;
import mg.safidy.dto.SituationFiscaleDTO;
import mg.safidy.model.Contribuable;
import mg.safidy.model.DeclarationIR;
import mg.safidy.model.Paiement;
import mg.safidy.repository.DeclarationIRRepository;
import mg.safidy.repository.PaiementRepository;
import mg.safidy.service.ContribuableService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/contribuables")
public class ContribuableController {

    private final ContribuableService service;
    private final AuditLogger audit;
    private final DeclarationIRRepository declarationRepo;
    private final PaiementRepository paiementRepo;

    public ContribuableController(ContribuableService service,
                                    AuditLogger audit,
                                    DeclarationIRRepository declarationRepo,
                                    PaiementRepository paiementRepo) {
        this.service = service;
        this.audit = audit;
        this.declarationRepo = declarationRepo;
        this.paiementRepo = paiementRepo;
    }

    @GetMapping
    public List<Contribuable> lister(
            @RequestParam(required = false) String motCle,
            @RequestParam(required = false) String statut,
            @RequestParam(required = false) Long idSecteur) {
        return service.rechercher(motCle, statut, idSecteur);
    }

    @GetMapping("/{id}")
    public Contribuable trouver(@PathVariable Long id) {
        return service.trouverParId(id);
    }

    @GetMapping("/nif/{nif}")
    public Contribuable trouverParNif(@PathVariable String nif) {
        return service.trouverParNif(nif);
    }

    @PostMapping
    public ResponseEntity<Contribuable> creer(@RequestBody Contribuable c) {
        Contribuable saved = service.creer(c);
        audit.log("CREATION_CONTRIBUABLE", "contribuable", saved.getIdContribuable(),
                  "NIF=" + saved.getNif() + " raison=" + saved.getRaisonSociale());
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Contribuable> modifier(@PathVariable Long id,
                                                   @RequestBody Contribuable c) {
        Contribuable saved = service.modifier(id, c);
        audit.log("MODIFICATION_CONTRIBUABLE", "contribuable", id, "NIF=" + saved.getNif());
        return ResponseEntity.ok(saved);
    }

    @PatchMapping("/{id}/statut")
    public ResponseEntity<Contribuable> changerStatut(@PathVariable Long id,
                                                       @RequestParam String statut) {
        Contribuable saved = service.changerStatut(id, statut);
        audit.log("CHANGEMENT_STATUT", "contribuable", id, "nouveau statut=" + statut);
        return ResponseEntity.ok(saved);
    }

    /**
     * Situation fiscale d'un contribuable : impots dus, payes, reste a payer,
     * avec la liste detaillee des declarations et des paiements.
     */
    @GetMapping("/{id}/situation-fiscale")
    public SituationFiscaleDTO situationFiscale(@PathVariable Long id) {
        Contribuable c = service.trouverParId(id);

        SituationFiscaleDTO dto = new SituationFiscaleDTO();
        dto.setIdContribuable(c.getIdContribuable());
        dto.setNif(c.getNif());
        dto.setRaisonSociale(c.getRaisonSociale());

        // Declarations du contribuable
        List<DeclarationIR> declarations =
            declarationRepo.findByContribuableIdContribuableOrderByAnneeDesc(id);

        long totalDu = 0L;
        long totalSolde = 0L;
        int nbImpayees = 0;
        boolean enRetard = false;
        LocalDate aujourdhui = LocalDate.now();

        for (DeclarationIR d : declarations) {
            SituationFiscaleDTO.DeclarationResume dr = new SituationFiscaleDTO.DeclarationResume();
            dr.setIdDeclaration(d.getIdDeclaration());
            dr.setAnnee(d.getAnnee());
            dr.setIrDu(d.getIrDu());
            dr.setAcomptesVerses(d.getAcomptesVerses());
            dr.setSoldeAPayer(d.getSoldeAPayer());
            dr.setStatut(d.getStatut());
            dr.setDateLimite(d.getDateLimite() != null ? d.getDateLimite().toString() : null);
            dr.setDateDepot(d.getDateDepot() != null ? d.getDateDepot().toString() : null);
            dto.getDeclarations().add(dr);

            if (d.getIrDu() != null) totalDu += d.getIrDu();
            if (d.getSoldeAPayer() != null && d.getSoldeAPayer() > 0) {
                totalSolde += d.getSoldeAPayer();
                nbImpayees++;
            }
            if ("EN_RETARD".equals(d.getStatut())) {
                enRetard = true;
            }
            // Si la date limite est depassee et pas payee
            if (d.getDateLimite() != null
                    && d.getDateLimite().isBefore(aujourdhui)
                    && d.getSoldeAPayer() != null
                    && d.getSoldeAPayer() > 0
                    && !"PAYEE".equals(d.getStatut())) {
                enRetard = true;
            }
        }

        // Paiements
        List<Paiement> paiements = paiementRepo
            .findByContribuableIdContribuableOrderByDatePaiementDesc(id);

        long totalPaye = 0L;
        for (Paiement p : paiements) {
            SituationFiscaleDTO.PaiementResume pr = new SituationFiscaleDTO.PaiementResume();
            pr.setIdPaiement(p.getIdPaiement());
            pr.setReferenceQuittance(p.getReferenceQuittance());
            pr.setDatePaiement(p.getDatePaiement() != null ? p.getDatePaiement().toString() : null);
            pr.setMontantAr(p.getMontantAr());
            pr.setTypePaiement(p.getTypePaiement());
            pr.setMode(p.getMode());
            pr.setAnnule(Boolean.TRUE.equals(p.getAnnule()));
            dto.getPaiements().add(pr);

            if (!Boolean.TRUE.equals(p.getAnnule()) && p.getMontantAr() != null) {
                totalPaye += p.getMontantAr();
            }
        }

        dto.setTotalDu(totalDu);
        dto.setTotalPaye(totalPaye);
        dto.setResteAPayer(Math.max(0, totalSolde));
        dto.setEnRetard(enRetard);
        dto.setNbDeclarationsImpayees(nbImpayees);

        return dto;
    }
}
