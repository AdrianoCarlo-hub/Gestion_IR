package mg.safidy.controller;

import mg.safidy.model.DeclarationIR;
import mg.safidy.repository.*;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;

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

    @GetMapping("/par-annee")
    public List<Map<String, Object>> parAnnee() {
        Map<Integer, long[]> aggr = new TreeMap<>();

        for (DeclarationIR d : declarationRepo.findAll()) {
            int annee = d.getAnnee() == null ? 0 : d.getAnnee();
            long[] v = aggr.getOrDefault(annee, new long[]{0L, 0L, 0L});
            v[0] += d.getIrDu() == null ? 0 : d.getIrDu();
            v[1] += d.getSoldeAPayer() == null ? 0 : d.getSoldeAPayer();
            v[2] += 1;
            aggr.put(annee, v);
        }

        List<Map<String, Object>> liste = new ArrayList<>();
        for (Map.Entry<Integer, long[]> e : aggr.entrySet()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("annee", e.getKey());
            m.put("irDu", e.getValue()[0]);
            m.put("soldeAPayer", e.getValue()[1]);
            m.put("nbDeclarations", e.getValue()[2]);
            liste.add(m);
        }
        return liste;
    }

    @GetMapping("/par-secteur")
    public List<Map<String, Object>> parSecteur() {
        Map<String, long[]> aggr = new TreeMap<>();
        Map<String, String> libelles = new HashMap<>();

        for (DeclarationIR d : declarationRepo.findAll()) {
            if (d.getContribuable() == null || d.getContribuable().getSecteur() == null) continue;
            String code = d.getContribuable().getSecteur().getCode();
            String lib = d.getContribuable().getSecteur().getLibelle();
            long[] v = aggr.getOrDefault(code, new long[]{0L, 0L});
            v[0] += d.getIrDu() == null ? 0 : d.getIrDu();
            v[1] += 1;
            aggr.put(code, v);
            libelles.put(code, lib);
        }

        List<Map<String, Object>> liste = new ArrayList<>();
        for (Map.Entry<String, long[]> e : aggr.entrySet()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("code", e.getKey());
            m.put("libelle", libelles.get(e.getKey()));
            m.put("irDu", e.getValue()[0]);
            m.put("nbDeclarations", e.getValue()[1]);
            liste.add(m);
        }
        return liste;
    }

    @GetMapping("/par-statut")
    public List<Map<String, Object>> parStatut() {
        Map<String, Long> aggr = new TreeMap<>();
        for (DeclarationIR d : declarationRepo.findAll()) {
            String st = d.getStatut() == null ? "INCONNU" : d.getStatut();
            aggr.put(st, aggr.getOrDefault(st, 0L) + 1);
        }
        List<Map<String, Object>> liste = new ArrayList<>();
        for (Map.Entry<String, Long> e : aggr.entrySet()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("statut", e.getKey());
            m.put("nombre", e.getValue());
            liste.add(m);
        }
        return liste;
    }
}
