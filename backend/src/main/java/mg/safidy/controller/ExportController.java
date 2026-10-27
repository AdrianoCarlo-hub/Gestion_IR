package mg.safidy.controller;

import jakarta.servlet.http.HttpServletResponse;
import mg.safidy.model.Acompte;
import mg.safidy.model.Contribuable;
import mg.safidy.model.DeclarationIR;
import mg.safidy.model.Paiement;
import mg.safidy.model.Penalite;
import mg.safidy.repository.AcompteRepository;
import mg.safidy.repository.ContribuableRepository;
import mg.safidy.repository.DeclarationIRRepository;
import mg.safidy.repository.PaiementRepository;
import mg.safidy.repository.PenaliteRepository;
import mg.safidy.dto.DeclarationImpayeeDTO;
import mg.safidy.service.DeclarationIRService;
import mg.safidy.service.ExcelExportService;
import mg.safidy.service.ExcelExportService.ColonneDef;
import mg.safidy.service.ExcelExportService.TypeColonne;
import mg.safidy.service.PdfService;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/export")
public class ExportController {

    private final ContribuableRepository contribuableRepo;
    private final DeclarationIRRepository declarationRepo;
    private final PaiementRepository paiementRepo;
    private final AcompteRepository acompteRepo;
    private final PenaliteRepository penaliteRepo;
    private final DeclarationIRService declarationService;
    private final ExcelExportService excelService;
    private final PdfService pdfService;

    public ExportController(ContribuableRepository contribuableRepo,
                             DeclarationIRRepository declarationRepo,
                             PaiementRepository paiementRepo,
                             AcompteRepository acompteRepo,
                             PenaliteRepository penaliteRepo,
                             DeclarationIRService declarationService,
                             ExcelExportService excelService,
                             PdfService pdfService) {
        this.contribuableRepo = contribuableRepo;
        this.declarationRepo = declarationRepo;
        this.paiementRepo = paiementRepo;
        this.acompteRepo = acompteRepo;
        this.penaliteRepo = penaliteRepo;
        this.declarationService = declarationService;
        this.excelService = excelService;
        this.pdfService = pdfService;
    }

    @GetMapping("/contribuables.xlsx")
    public void exportContribuables(HttpServletResponse response) throws Exception {
        List<ColonneDef> colonnes = List.of(
            new ColonneDef("NIF", TypeColonne.TEXTE, 14),
            new ColonneDef("STAT", TypeColonne.TEXTE, 20),
            new ColonneDef("Raison sociale", TypeColonne.TEXTE, 30),
            new ColonneDef("Forme juridique", TypeColonne.TEXTE, 16),
            new ColonneDef("Dirigeant", TypeColonne.TEXTE, 20),
            new ColonneDef("CIN", TypeColonne.TEXTE, 16),
            new ColonneDef("Adresse", TypeColonne.TEXTE, 30),
            new ColonneDef("Telephone", TypeColonne.TEXTE, 16),
            new ColonneDef("Secteur", TypeColonne.TEXTE, 18),
            new ColonneDef("Regime", TypeColonne.TEXTE, 16),
            new ColonneDef("Statut", TypeColonne.TEXTE, 12)
        );

        List<List<Object>> lignes = new ArrayList<>();
        for (Contribuable c : contribuableRepo.findAll()) {
            List<Object> ligne = new ArrayList<>();
            ligne.add(c.getNif());
            ligne.add(c.getStat() == null ? "" : c.getStat());
            ligne.add(c.getRaisonSociale());
            ligne.add(c.getFormeJuridique());
            ligne.add(c.getNomDirigeant());
            ligne.add(c.getCinDirigeant());
            ligne.add(c.getAdresse());
            ligne.add(c.getTelephone() == null ? "" : c.getTelephone());
            ligne.add(c.getSecteur() != null ? c.getSecteur().getLibelle() : "");
            ligne.add(c.getRegime());
            ligne.add(c.getStatut());
            lignes.add(ligne);
        }
        excelService.ecrire(response, "contribuables.xlsx",
            "Liste des contribuables", colonnes, lignes);
    }

    @GetMapping("/declarations.xlsx")
    public void exportDeclarations(HttpServletResponse response) throws Exception {
        List<ColonneDef> colonnes = List.of(
            new ColonneDef("NIF", TypeColonne.TEXTE, 14),
            new ColonneDef("Contribuable", TypeColonne.TEXTE, 30),
            new ColonneDef("Annee", TypeColonne.ENTIER, 10),
            new ColonneDef("CA HT", TypeColonne.MONTANT, 18),
            new ColonneDef("Charges", TypeColonne.MONTANT, 18),
            new ColonneDef("Resultat", TypeColonne.MONTANT, 18),
            new ColonneDef("Base imposable", TypeColonne.MONTANT, 18),
            new ColonneDef("IR brut", TypeColonne.MONTANT, 18),
            new ColonneDef("Minimum", TypeColonne.MONTANT, 18),
            new ColonneDef("IR du", TypeColonne.MONTANT, 18),
            new ColonneDef("Acomptes", TypeColonne.MONTANT, 18),
            new ColonneDef("Solde a payer", TypeColonne.MONTANT, 18),
            new ColonneDef("Credit", TypeColonne.MONTANT, 18),
            new ColonneDef("Statut", TypeColonne.TEXTE, 14)
        );

        List<List<Object>> lignes = new ArrayList<>();
        for (DeclarationIR d : declarationRepo.findAll()) {
            List<Object> ligne = new ArrayList<>();
            ligne.add(d.getContribuable() != null ? d.getContribuable().getNif() : "");
            ligne.add(d.getContribuable() != null ? d.getContribuable().getRaisonSociale() : "");
            ligne.add(d.getAnnee());
            ligne.add(d.getCaHt());
            ligne.add(d.getTotalCharges());
            ligne.add(d.getResultatComptable());
            ligne.add(d.getBaseImposable());
            ligne.add(d.getIrBrut());
            ligne.add(d.getMinimumPerception());
            ligne.add(d.getIrDu());
            ligne.add(d.getAcomptesVerses());
            ligne.add(d.getSoldeAPayer());
            ligne.add(d.getCreditImpot());
            ligne.add(d.getStatut());
            lignes.add(ligne);
        }
        excelService.ecrire(response, "declarations.xlsx",
            "Liste des declarations d impot sur les revenus", colonnes, lignes);
    }

    @GetMapping("/paiements.xlsx")
    public void exportPaiements(HttpServletResponse response) throws Exception {
        List<ColonneDef> colonnes = List.of(
            new ColonneDef("Quittance", TypeColonne.TEXTE, 18),
            new ColonneDef("Date", TypeColonne.DATE, 14),
            new ColonneDef("Contribuable", TypeColonne.TEXTE, 30),
            new ColonneDef("NIF", TypeColonne.TEXTE, 14),
            new ColonneDef("Type", TypeColonne.TEXTE, 14),
            new ColonneDef("Mode", TypeColonne.TEXTE, 14),
            new ColonneDef("Montant (Ar)", TypeColonne.MONTANT, 18),
            new ColonneDef("Annule", TypeColonne.BOOLEEN, 10)
        );

        List<List<Object>> lignes = new ArrayList<>();
        for (Paiement p : paiementRepo.findAll()) {
            List<Object> ligne = new ArrayList<>();
            ligne.add(p.getReferenceQuittance());
            ligne.add(p.getDatePaiement());
            ligne.add(p.getContribuable() != null ? p.getContribuable().getRaisonSociale() : "");
            ligne.add(p.getContribuable() != null ? p.getContribuable().getNif() : "");
            ligne.add(p.getTypePaiement());
            ligne.add(p.getMode());
            ligne.add(p.getMontantAr());
            ligne.add(Boolean.TRUE.equals(p.getAnnule()));
            lignes.add(ligne);
        }
        excelService.ecrire(response, "paiements.xlsx",
            "Liste des paiements enregistres", colonnes, lignes);
    }

    @GetMapping("/acomptes.xlsx")
    public void exportAcomptes(HttpServletResponse response) throws Exception {
        List<ColonneDef> colonnes = List.of(
            new ColonneDef("NIF", TypeColonne.TEXTE, 14),
            new ColonneDef("Contribuable", TypeColonne.TEXTE, 30),
            new ColonneDef("Exercice", TypeColonne.ENTIER, 10),
            new ColonneDef("Numero", TypeColonne.ENTIER, 10),
            new ColonneDef("Type", TypeColonne.TEXTE, 16),
            new ColonneDef("Base IR N-1", TypeColonne.MONTANT, 18),
            new ColonneDef("Montant", TypeColonne.MONTANT, 18),
            new ColonneDef("Echeance", TypeColonne.DATE, 14),
            new ColonneDef("Statut", TypeColonne.TEXTE, 14),
            new ColonneDef("Date de paiement", TypeColonne.DATE, 16)
        );

        List<List<Object>> lignes = new ArrayList<>();
        for (Acompte a : acompteRepo.findAll()) {
            List<Object> ligne = new ArrayList<>();
            ligne.add(a.getContribuable() != null ? a.getContribuable().getNif() : "");
            ligne.add(a.getContribuable() != null ? a.getContribuable().getRaisonSociale() : "");
            ligne.add(a.getAnnee());
            ligne.add(a.getNumero());
            ligne.add(a.getTypeAcompte());
            ligne.add(a.getBaseIrN1());
            ligne.add(a.getMontantAr());
            ligne.add(a.getDateEcheance());
            ligne.add(a.getStatut());
            ligne.add(a.getDatePaiement() == null ? "" : a.getDatePaiement());
            lignes.add(ligne);
        }
        excelService.ecrire(response, "acomptes.xlsx",
            "Liste des acomptes provisionnels", colonnes, lignes);
    }

    @GetMapping("/penalites.xlsx")
    public void exportPenalites(HttpServletResponse response) throws Exception {
        List<ColonneDef> colonnes = List.of(
            new ColonneDef("NIF", TypeColonne.TEXTE, 14),
            new ColonneDef("Contribuable", TypeColonne.TEXTE, 30),
            new ColonneDef("Exercice", TypeColonne.ENTIER, 10),
            new ColonneDef("Type", TypeColonne.TEXTE, 22),
            new ColonneDef("Base de calcul", TypeColonne.MONTANT, 18),
            new ColonneDef("Nb mois", TypeColonne.ENTIER, 10),
            new ColonneDef("Taux %", TypeColonne.TEXTE, 10),
            new ColonneDef("Montant", TypeColonne.MONTANT, 18),
            new ColonneDef("Statut", TypeColonne.TEXTE, 14),
            new ColonneDef("Date limite", TypeColonne.DATE, 14),
            new ColonneDef("Motif", TypeColonne.TEXTE, 28)
        );

        List<List<Object>> lignes = new ArrayList<>();
        for (Penalite p : penaliteRepo.findAll()) {
            DeclarationIR d = p.getDeclaration();
            List<Object> ligne = new ArrayList<>();
            ligne.add(d != null && d.getContribuable() != null
                ? d.getContribuable().getNif() : "");
            ligne.add(d != null && d.getContribuable() != null
                ? d.getContribuable().getRaisonSociale() : "");
            ligne.add(d != null ? d.getAnnee() : "");
            ligne.add(p.getType());
            ligne.add(p.getBaseCalculAr() == null ? 0L : p.getBaseCalculAr());
            ligne.add(p.getNbMois());
            ligne.add(p.getTauxPct() == null ? "" : p.getTauxPct().toPlainString());
            ligne.add(p.getMontantAr());
            ligne.add(p.getStatut());
            ligne.add(p.getDateLimite() == null ? "" : p.getDateLimite());
            ligne.add(p.getMotif() == null ? "" : p.getMotif());
            lignes.add(ligne);
        }
        excelService.ecrire(response, "penalites.xlsx",
            "Liste des penalites fiscales", colonnes, lignes);
    }

    @GetMapping("/impayees.xlsx")
    public void exportImpayees(
            @RequestParam(required = false) Integer annee,
            HttpServletResponse response) throws Exception {
        List<DeclarationImpayeeDTO> impayees = declarationService.listerImpayees(annee);
        int anneeCible = annee != null ? annee : LocalDate.now().getYear();

        List<ColonneDef> colonnes = List.of(
            new ColonneDef("NIF", TypeColonne.TEXTE, 14),
            new ColonneDef("Contribuable", TypeColonne.TEXTE, 30),
            new ColonneDef("Exercice", TypeColonne.ENTIER, 10),
            new ColonneDef("IR du", TypeColonne.MONTANT, 18),
            new ColonneDef("Deja paye", TypeColonne.MONTANT, 18),
            new ColonneDef("Reste a payer", TypeColonne.MONTANT, 18),
            new ColonneDef("Date limite", TypeColonne.DATE, 14),
            new ColonneDef("Statut", TypeColonne.TEXTE, 14)
        );

        List<List<Object>> lignes = new ArrayList<>();
        for (DeclarationImpayeeDTO i : impayees) {
            List<Object> ligne = new ArrayList<>();
            ligne.add(i.nif());
            ligne.add(i.raisonSociale());
            ligne.add(i.annee());
            ligne.add(i.irDu());
            ligne.add(i.dejaPaye());
            ligne.add(i.resteAPayer());
            ligne.add(i.dateLimite() == null ? "" : i.dateLimite());
            ligne.add(i.statut());
            lignes.add(ligne);
        }
        excelService.ecrire(response, "impayees-" + anneeCible + ".xlsx",
            "Impayes - recouvrement exercice " + anneeCible, colonnes, lignes);
    }

    @GetMapping("/quittance/{idPaiement}.pdf")
    public void quittance(@PathVariable Long idPaiement, HttpServletResponse response)
            throws Exception {
        Paiement p = paiementRepo.findById(idPaiement).orElseThrow();
        pdfService.genererQuittance(response, p);
    }

    @GetMapping("/fiche-declaration/{id}.pdf")
    public void ficheDeclaration(@PathVariable Long id, HttpServletResponse response)
            throws Exception {
        DeclarationIR d = declarationRepo.findById(id).orElseThrow();
        pdfService.genererFicheDeclaration(response, d);
    }

    @GetMapping("/bilan.pdf")
    public void bilan(@RequestParam(required = false) Integer annee,
                      HttpServletResponse response) throws Exception {
        int anneeCible = annee != null ? annee : LocalDate.now().getYear();
        List<DeclarationIR> decls = declarationRepo.findByAnneeOrderByDateCreationDesc(anneeCible);

        long caTotal = decls.stream()
            .mapToLong(d -> d.getCaHt() == null ? 0 : d.getCaHt()).sum();
        long irTotal = decls.stream()
            .mapToLong(d -> d.getIrDu() == null ? 0 : d.getIrDu()).sum();
        long encaisse = paiementRepo.sommeEncaisseeAnnee(anneeCible);
        long reste = Math.max(irTotal - encaisse, 0);
        double taux = irTotal == 0 ? 0 : Math.min((double) encaisse / irTotal * 100, 100);

        pdfService.genererBilanAnnuel(response, anneeCible, caTotal, irTotal,
            encaisse, reste, taux);
    }

    @GetMapping("/statistiques.pdf")
    public void statistiques(HttpServletResponse response) throws Exception {
        long irTotal = declarationRepo.findAll().stream()
            .mapToLong(d -> d.getIrDu() == null ? 0 : d.getIrDu()).sum();
        long encaisse = paiementRepo.findAll().stream()
            .filter(p -> !Boolean.TRUE.equals(p.getAnnule()))
            .mapToLong(p -> p.getMontantAr() == null ? 0 : p.getMontantAr()).sum();
        long solde = declarationRepo.findAll().stream()
            .mapToLong(d -> d.getSoldeAPayer() == null ? 0 : d.getSoldeAPayer()).sum();

        double taux = irTotal == 0 ? 0 : (double) encaisse / irTotal * 100;

        Map<String, Object> stats = new java.util.HashMap<>();
        stats.put("contribuables", contribuableRepo.count());
        stats.put("declarations", declarationRepo.count());
        stats.put("paiements", paiementRepo.count());
        stats.put("acomptes", 0L);
        stats.put("deficitsActifs", 0L);
        stats.put("irTotal", irTotal);
        stats.put("encaisse", encaisse);
        stats.put("soldeAPayer", solde);
        stats.put("tauxRecouvrement", Math.round(taux * 100.0) / 100.0);

        pdfService.genererStatistiques(response, stats);
    }
}
