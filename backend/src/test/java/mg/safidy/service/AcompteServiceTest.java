package mg.safidy.service;

import mg.safidy.model.Acompte;
import mg.safidy.model.Contribuable;
import mg.safidy.model.DeclarationIR;
import mg.safidy.repository.AcompteRepository;
import mg.safidy.repository.ContribuableRepository;
import mg.safidy.repository.DeclarationIRRepository;
import mg.safidy.repository.ParametreFiscalRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AcompteServiceTest {

    @Mock
    private AcompteRepository acompteRepository;
    @Mock
    private ContribuableRepository contribuableRepository;
    @Mock
    private ParametreFiscalRepository parametreRepository;
    @Mock
    private DeclarationIRRepository declarationRepository;

    private AcompteService service;
    private final Contribuable contribuable = new Contribuable();

    @BeforeEach
    void setUp() {
        service = new AcompteService(acompteRepository, contribuableRepository,
                parametreRepository, declarationRepository);
    }

    @Test
    void aucunAcompteProvisionnelSansDeclarationN1() {
        when(contribuableRepository.findById(1L)).thenReturn(Optional.of(contribuable));
        when(declarationRepository.findByContribuableIdContribuableAndAnnee(1L, 2024))
                .thenReturn(Optional.empty());

        List<Acompte> acomptes = service.creerAcomptesProvisionnels(1L, 2025, 10_000_000L);

        assertTrue(acomptes.isEmpty());
        verify(acompteRepository, never()).save(any(Acompte.class));
    }

    @Test
    void aucunAcompteProvisionnelSiIrN1Nul() {
        List<Acompte> acomptes = service.creerAcomptesProvisionnels(1L, 2025, 0L);

        assertTrue(acomptes.isEmpty());
        verify(acompteRepository, never()).save(any(Acompte.class));
    }

    @Test
    void genereDeuxAcomptesDeCinquantePourcentSurIrTotalN1() {
        DeclarationIR declaration = declaration(2025, 40_000_000L, "VALIDEE");
        when(contribuableRepository.findById(1L)).thenReturn(Optional.of(contribuable));
        when(declarationRepository.findByContribuableIdContribuableAndAnnee(1L, 2025))
                .thenReturn(Optional.of(declaration));
        when(parametreRepository.findByCode("TAUX_ACOMPTE")).thenReturn(Optional.empty());
        when(acompteRepository.existsByContribuableIdContribuableAndAnneeAndTypeAcompte(
                1L, 2026, AcompteService.TYPE_PROVISIONNEL)).thenReturn(false);
        when(acompteRepository.save(any(Acompte.class))).thenAnswer(call -> call.getArgument(0));

        // L'IR persiste N-1 est la reference, meme si l'argument appelant est different.
        List<Acompte> acomptes = service.creerAcomptesProvisionnels(1L, 2026, 1L);

        assertEquals(2, acomptes.size());
        assertEquals(40_000_000L, acomptes.get(0).getBaseIrN1());
        assertEquals(20_000_000L, acomptes.get(0).getMontantAr());
        assertEquals(50, acomptes.get(0).getTauxPct());
        assertEquals(LocalDate.of(2026, 5, 15), acomptes.get(0).getDateEcheance());
        assertEquals(LocalDate.of(2026, 11, 15), acomptes.get(1).getDateEcheance());
        assertEquals(40_000_000L, acomptes.get(1).getBaseIrN1());
        assertEquals(20_000_000L, acomptes.get(1).getMontantAr());
    }

    @Test
    void echeancesMaiCombineSoldeN1EtAcompteEtNovembreLeSecondAcompte() {
        DeclarationIR declaration = declaration(2025, 40_000_000L, "VALIDEE");
        declaration.setAcomptesVerses(0L);
        declaration.setSoldeAPayer(40_000_000L);
        when(declarationRepository.findByContribuableIdContribuableAndAnnee(1L, 2025))
                .thenReturn(Optional.of(declaration));
        when(parametreRepository.findByCode("TAUX_ACOMPTE")).thenReturn(Optional.empty());

        Map<String, Object> echeances = service.calculerEcheances(1L, 2026);
        @SuppressWarnings("unchecked")
        Map<String, Object> mai = (Map<String, Object>) echeances.get("echeance15Mai");
        @SuppressWarnings("unchecked")
        Map<String, Object> novembre = (Map<String, Object>) echeances.get("echeance15Novembre");

        assertTrue((Boolean) echeances.get("eligible"));
        assertEquals(40_000_000L, echeances.get("irN1Total"));
        assertEquals(40_000_000L, mai.get("soldeN1"));
        assertEquals(20_000_000L, mai.get("acompte1N"));
        assertEquals(60_000_000L, mai.get("total"));
        assertEquals(LocalDate.of(2026, 5, 15), mai.get("date"));
        assertEquals(20_000_000L, novembre.get("acompte2N"));
        assertEquals(20_000_000L, novembre.get("total"));
        assertEquals(LocalDate.of(2026, 11, 15), novembre.get("date"));
    }

    @Test
    void echeancesIneligiblesSansDeclarationIrN1Validee() {
        when(declarationRepository.findByContribuableIdContribuableAndAnnee(1L, 2025))
                .thenReturn(Optional.empty());

        Map<String, Object> echeances = service.calculerEcheances(1L, 2026);

        assertFalse((Boolean) echeances.get("eligible"));
        assertFalse(echeances.containsKey("echeance15Mai"));
    }

    @Test
    void chronologieMontrePremiereAnneeEtLesSoldesDesAnneesSuivantes() {
        DeclarationIR declaration2026 = declaration(2026, 50_000_000L, "VALIDEE");
        declaration2026.setAcomptesVerses(40_000_000L);
        declaration2026.setSoldeAPayer(10_000_000L);
        DeclarationIR declaration2025 = declaration(2025, 40_000_000L, "PAYEE");
        declaration2025.setAcomptesVerses(0L);
        declaration2025.setSoldeAPayer(40_000_000L);
        when(declarationRepository.findByContribuableIdContribuableOrderByAnneeDesc(1L))
                .thenReturn(List.of(declaration2026, declaration2025));
        when(parametreRepository.findByCode("TAUX_ACOMPTE")).thenReturn(Optional.empty());

        List<Map<String, Object>> chronologie = service.calculerChronologie(1L);
        @SuppressWarnings("unchecked")
        Map<String, Object> echeance2026 = chronologie.get(1);
        @SuppressWarnings("unchecked")
        Map<String, Object> mai2027 = (Map<String, Object>) chronologie.get(2).get("echeance15Mai");

        assertEquals(2025, chronologie.get(0).get("annee"));
        assertFalse((Boolean) chronologie.get(0).get("eligible"));
        assertEquals(60_000_000L, ((Map<?, ?>) echeance2026.get("echeance15Mai")).get("total"));
        assertEquals(10_000_000L, mai2027.get("soldeN1"));
        assertEquals(25_000_000L, mai2027.get("acompte1N"));
        assertEquals(35_000_000L, mai2027.get("total"));
    }

    private DeclarationIR declaration(int annee, long irDu, String statut) {
        DeclarationIR declaration = new DeclarationIR();
        declaration.setAnnee(annee);
        declaration.setIrDu(irDu);
        declaration.setStatut(statut);
        return declaration;
    }
}
