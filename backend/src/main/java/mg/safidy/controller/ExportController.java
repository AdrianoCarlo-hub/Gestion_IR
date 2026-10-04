package mg.safidy.controller;

import jakarta.servlet.http.HttpServletResponse;
import mg.safidy.model.Contribuable;
import mg.safidy.model.DeclarationIR;
import mg.safidy.model.Paiement;
import mg.safidy.repository.ContribuableRepository;
import mg.safidy.repository.DeclarationIRRepository;
import mg.safidy.repository.PaiementRepository;
import mg.safidy.service.ExcelExportService;
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

    @GetMapping("/contribuables.xlsx")
    public void exportContribuables(HttpServletResponse response) throws Exception {
        List<String> entetes = List.of(
            "NIF", "STAT", "Raison sociale", "Forme juridique",
            "Dirigeant", "CIN", "Adresse", "Telephone",
            "Secteur", "Regime", "Statut");

        List<List<Object>> lignes = new ArrayList<>();
        for (Contribuable c : contribuableRepo.findAll()) {
            lignes.add(List.of(
                c.getNif(),
                c.getStat() == null ? "" : c.getStat(),
                c.getRaisonSociale(),
                c.getFormeJuridique(),
                c.getNomDirigeant(),
                c.getCinDirigeant(),
                c.getAdresse(),
                c.getTelephone() == null ? "" : c.getTelephone(),
                c.getSecteur() != null ? c.getSecteur().getLibelle() : "",
                c.getRegime(),
                c.getStatut()
            ));
        }
        excelService.ecrire(response, "contribuables.xlsx", entetes, lignes);
    }

    @GetMapping("/declarations.xlsx")
    public void exportDeclarations(HttpServletResponse response) throws Exception {
        List<String> entetes = List.of(
            "NIF", "Contribuable", "Annee",
            "CA HT", "Charges", "Resultat",
            "Base imposable", "IR brut", "Minimum", "IR du",
            "Acomptes", "Solde a payer", "Credit", "Statut");

        List<List<Object>> lignes = new ArrayList<>();
        for (DeclarationIR d : declarationRepo.findAll()) {
            lignes.add(List.of(
                d.getContribuable() != null ? d.getContribuable().getNif() : "",
                d.getContribuable() != null ? d.getContribuable().getRaisonSociale() : "",
                d.getAnnee(),
                d.getCaHt(),
                d.getTotalCharges(),
                d.getResultatComptable(),
                d.getBaseImposable(),
                d.getIrBrut(),
                d.getMinimumPerception(),
                d.getIrDu(),
                d.getAcomptesVerses(),
                d.getSoldeAPayer(),
                d.getCreditImpot(),
                d.getStatut()
            ));
        }
        excelService.ecrire(response, "declarations.xlsx", entetes, lignes);
    }

    @GetMapping("/paiements.xlsx")
    public void exportPaiements(HttpServletResponse response) throws Exception {
        List<String> entetes = List.of(
            "Quittance", "Date", "Contribuable", "NIF",
            "Type", "Mode", "Montant (Ar)", "Annule");

        List<List<Object>> lignes = new ArrayList<>();
        for (Paiement p : paiementRepo.findAll()) {
            lignes.add(List.of(
                p.getReferenceQuittance(),
                String.valueOf(p.getDatePaiement()),
                p.getContribuable() != null ? p.getContribuable().getRaisonSociale() : "",
                p.getContribuable() != null ? p.getContribuable().getNif() : "",
                p.getTypePaiement(),
                p.getMode(),
                p.getMontantAr(),
                Boolean.TRUE.equals(p.getAnnule()) ? "OUI" : "NON"
            ));
        }
        excelService.ecrire(response, "paiements.xlsx", entetes, lignes);
    }

    @GetMapping("/quittance/{idPaiement}.pdf")
    public void quittance(@PathVariable Long idPaiement, HttpServletResponse response)
            throws Exception {
        Paiement p = paiementRepo.findById(idPaiement).orElseThrow();
        pdfService.genererQuittance(response, p);
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
