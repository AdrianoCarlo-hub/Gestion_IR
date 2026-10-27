package mg.safidy.service;

import mg.safidy.dto.DeclarationImpayeeDTO;
import mg.safidy.model.Contribuable;
import mg.safidy.model.DeclarationIR;
import mg.safidy.repository.AgentRepository;
import mg.safidy.repository.ContribuableRepository;
import mg.safidy.repository.DeclarationIRRepository;
import mg.safidy.repository.LigneChargeRepository;
import mg.safidy.repository.PaiementRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DeclarationImpayeeServiceTest {

    @Mock
    private DeclarationIRRepository declarationRepository;
    @Mock
    private ContribuableRepository contribuableRepository;
    @Mock
    private AgentRepository agentRepository;
    @Mock
    private LigneChargeRepository ligneChargeRepository;
    @Mock
    private PaiementRepository paiementRepository;
    @Mock
    private AcompteService acompteService;
    @Mock
    private IRCalculationService irCalculationService;
    @Mock
    private DeficitService deficitService;
    @Mock
    private PenaliteService penaliteService;

    private DeclarationIRService service;

    @BeforeEach
    void setUp() {
        service = new DeclarationIRService(declarationRepository, contribuableRepository,
            agentRepository, ligneChargeRepository, paiementRepository, acompteService,
            irCalculationService, deficitService, penaliteService);
    }

    private DeclarationIR decl(long id, int annee, String statut, long irDu) {
        DeclarationIR d = new DeclarationIR();
        d.setIdDeclaration(id);
        d.setAnnee(annee);
        d.setStatut(statut);
        d.setIrDu(irDu);
        Contribuable c = new Contribuable();
        c.setNif("1000000001");
        c.setRaisonSociale("SARL TEST");
        d.setContribuable(c);
        return d;
    }

    @Test
    void declarationValideePartiellementPayeeEstImpayee() {
        int annee = LocalDate.now().getYear();
        when(declarationRepository.findByAnneeOrderByDateCreationDesc(annee))
            .thenReturn(List.of(decl(1L, annee, "VALIDEE", 1000L)));
        when(paiementRepository.sommeRegleeParDeclaration(1L)).thenReturn(400L);

        List<DeclarationImpayeeDTO> lignes = service.listerImpayees(annee);

        assertEquals(1, lignes.size());
        DeclarationImpayeeDTO l = lignes.get(0);
        assertEquals(1000L, l.irDu());
        assertEquals(400L, l.dejaPaye());
        assertEquals(600L, l.resteAPayer());
        assertEquals("SARL TEST", l.raisonSociale());
    }

    @Test
    void declarationEntierementPayeeEstExclue() {
        int annee = LocalDate.now().getYear();
        when(declarationRepository.findByAnneeOrderByDateCreationDesc(annee))
            .thenReturn(List.of(decl(1L, annee, "VALIDEE", 1000L)));
        when(paiementRepository.sommeRegleeParDeclaration(1L)).thenReturn(1000L);

        assertTrue(service.listerImpayees(annee).isEmpty());
    }

    @Test
    void declarationNonValideeEstExclue() {
        int annee = LocalDate.now().getYear();
        when(declarationRepository.findByAnneeOrderByDateCreationDesc(annee))
            .thenReturn(List.of(decl(1L, annee, "BROUILLON", 1000L)));

        assertTrue(service.listerImpayees(annee).isEmpty());
    }

    @Test
    void declarationEnRetardImpayeeEstIncluse() {
        int annee = LocalDate.now().getYear();
        when(declarationRepository.findByAnneeOrderByDateCreationDesc(annee))
            .thenReturn(List.of(decl(7L, annee, "EN_RETARD", 500L)));
        when(paiementRepository.sommeRegleeParDeclaration(7L)).thenReturn(0L);

        List<DeclarationImpayeeDTO> lignes = service.listerImpayees(annee);

        assertEquals(1, lignes.size());
        assertEquals(500L, lignes.get(0).resteAPayer());
        assertEquals(0L, lignes.get(0).dejaPaye());
    }

    @Test
    void anneeParDefautEstAnneeCourante() {
        int annee = LocalDate.now().getYear();
        when(declarationRepository.findByAnneeOrderByDateCreationDesc(annee))
            .thenReturn(List.of());

        assertTrue(service.listerImpayees(null).isEmpty());
    }
}
