package mg.safidy.controller;

import jakarta.servlet.http.HttpServletResponse;
import mg.safidy.model.Contribuable;
import mg.safidy.model.DeclarationIR;
import mg.safidy.model.Paiement;
import mg.safidy.repository.ContribuableRepository;
import mg.safidy.repository.DeclarationIRRepository;
import mg.safidy.repository.PaiementRepository;
import mg.safidy.service.ExcelExportService;
import mg.safidy.service.ExcelExportService.ColonneDef;
import mg.safidy.service.ExcelExportService.TypeColonne;
import mg.safidy.service.PdfService;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/export")
public class ExportController {

    private final ContribuableRepository contribuableRepo;
    private final DeclarationIRRepository declarationRepo;
    private final PaiementRepository paiementRepo;
    private final ExcelExportService excelService;
    private final PdfService pdfService;

    public ExportController(ContribuableRepository contribuableRepo,
                             DeclarationIRRepository declarationRepo,
                             PaiementRepository paiementRepo,
                             ExcelExportService excelService,
                             PdfService pdfService) {
        this.contribuableRepo = contribuableRepo;
        this.declarationRepo = declarationRepo;
        this.paiementRepo = paiementRepo;
        this.excelService = excelService;
        this.pdfService = pdfService;
    }

    // ============================================================
    // CONTRIBUABLES
    // ============================================================
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
        excelService.ecrire(response, "contribuables.xlsx", colonnes, lignes);
    }

    // ============================================================
    // DECLARATIONS
    // ============================================================
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
        excelService.ecrire(response, "declarations.xlsx", colonnes, lignes);
    }

    // ============================================================
    // PAIEMENTS
    // ============================================================
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
        excelService.ecrire(response, "paiements.xlsx", colonnes, lignes);
    }

    // ============================================================
    // QUITTANCE PDF (inchange)
    // ============================================================
    @GetMapping("/quittance/{idPaiement}.pdf")
    public void quittance(@PathVariable Long idPaiement, HttpServletResponse response)
            throws Exception {
        Paiement p = paiementRepo.findById(idPaiement).orElseThrow();
        pdfService.genererQuittance(response, p);
    }

    // ============================================================
    // STATISTIQUES PDF (inchange)
    // ============================================================
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

        java.util.Map<String, Object> stats = new java.util.HashMap<>();
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
