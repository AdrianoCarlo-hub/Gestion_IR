package mg.safidy.controller;

import mg.safidy.repository.*;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/statistiques")
public class StatistiqueController {

    private final ContribuableRepository contribuableRepo;
    private final DeclarationIRRepository declarationRepo;
    private final PaiementRepository paiementRepo;
    private final AcompteRepository acompteRepo;
    private final DeficitRepository deficitRepo;

    public StatistiqueController(ContribuableRepository contribuableRepo,
                                  DeclarationIRRepository declarationRepo,
                                  PaiementRepository paiementRepo,
                                  AcompteRepository acompteRepo,
                                  DeficitRepository deficitRepo) {
        this.contribuableRepo = contribuableRepo;
        this.declarationRepo = declarationRepo;
        this.paiementRepo = paiementRepo;
        this.acompteRepo = acompteRepo;
        this.deficitRepo = deficitRepo;
    }

    @GetMapping("/resume")
    public Map<String, Object> resume() {
        Map<String, Object> m = new HashMap<>();

        long nbContribuables = contribuableRepo.count();
        long nbDeclarations = declarationRepo.count();
        long nbPaiements = paiementRepo.count();
        long nbAcomptes = acompteRepo.count();
        long nbDeficitsActifs = deficitRepo.findAll().stream()
                .filter(d -> "ACTIF".equals(d.getStatut())).count();

        long irTotal = declarationRepo.findAll().stream()
                .mapToLong(d -> d.getIrDu() == null ? 0 : d.getIrDu()).sum();

        long encaisse = paiementRepo.findAll().stream()
                .filter(p -> !Boolean.TRUE.equals(p.getAnnule()))
                .mapToLong(p -> p.getMontantAr() == null ? 0 : p.getMontantAr()).sum();

        long soldeAPayer = declarationRepo.findAll().stream()
                .mapToLong(d -> d.getSoldeAPayer() == null ? 0 : d.getSoldeAPayer()).sum();

        m.put("contribuables", nbContribuables);
        m.put("declarations", nbDeclarations);
        m.put("paiements", nbPaiements);
        m.put("acomptes", nbAcomptes);
        m.put("deficitsActifs", nbDeficitsActifs);
        m.put("irTotal", irTotal);
        m.put("encaisse", encaisse);
        m.put("soldeAPayer", soldeAPayer);

        double taux = irTotal == 0 ? 0 : (double) encaisse / irTotal * 100;
        m.put("tauxRecouvrement", Math.round(taux * 100.0) / 100.0);

        return m;
    }
}
