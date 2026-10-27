package mg.safidy.service;

import mg.safidy.exception.BusinessException;
import mg.safidy.model.Acompte;
import mg.safidy.model.Agent;
import mg.safidy.model.Contribuable;
import mg.safidy.model.DeclarationIR;
import mg.safidy.model.Paiement;
import mg.safidy.model.Penalite;
import mg.safidy.repository.AcompteRepository;
import mg.safidy.repository.AgentRepository;
import mg.safidy.repository.ContribuableRepository;
import mg.safidy.repository.DeclarationIRRepository;
import mg.safidy.repository.PaiementRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaiementServiceTest {

    @Mock
    private PaiementRepository paiementRepository;
    @Mock
    private ContribuableRepository contribuableRepository;
    @Mock
    private DeclarationIRRepository declarationRepository;
    @Mock
    private AcompteRepository acompteRepository;
    @Mock
    private AgentRepository agentRepository;
    @Mock
    private PenaliteService penaliteService;
    @Mock
    private AcompteService acompteService;

    private PaiementService service;

    private final Contribuable contribuable = new Contribuable();
    private final Agent agent = new Agent();
    private final DeclarationIR declaration = new DeclarationIR();

    @BeforeEach
    void setUp() {
        service = new PaiementService(paiementRepository, contribuableRepository,
                declarationRepository, acompteRepository, agentRepository,
                penaliteService, acompteService);

        contribuable.setIdContribuable(1L);
        contribuable.setStatut("ACTIF");
        agent.setIdAgent(9L);

        declaration.setIdDeclaration(1L);
        declaration.setAnnee(LocalDate.now().getYear());
        declaration.setIrDu(12_000_000L);
        declaration.setAcomptesVerses(10_000_000L);
        declaration.setContribuable(contribuable);
    }

    // =====================================================
    // Recapitulatif
    // =====================================================

    @Test
    void recapitulatifTous_appliqueLaFormuleDuSolde() {
        when(declarationRepository.findById(1L)).thenReturn(Optional.of(declaration));
        when(penaliteService.totalDues(1L)).thenReturn(1_500_000L);
        when(acompteService.montantAcompteProvisionnel(12_000_000L)).thenReturn(6_000_000L);

        Map<String, Object> recap = service.recapitulatif(1L, "TOUS", LocalDate.now());

        // 12M IR + 1.5M penalite + 6M 1er acompte - 10M verses = 9.5M
        assertEquals(12_000_000L, recap.get("irDu"));
        assertEquals(1_500_000L, recap.get("penalites"));
        assertEquals(6_000_000L, recap.get("premierAcompte"));
        assertEquals(10_000_000L, recap.get("acomptesVerses"));
        assertEquals(9_500_000L, recap.get("total"));
    }

    @Test
    void recapitulatifDeuxiemeAcompte_sansInteretAvantLe15Novembre() {
        when(declarationRepository.findById(1L)).thenReturn(Optional.of(declaration));
        when(acompteService.montantAcompteProvisionnel(12_000_000L)).thenReturn(6_000_000L);

        Map<String, Object> recap = service.recapitulatif(
                1L, "2EME_ACOMPTE", LocalDate.now());

        assertEquals(6_000_000L, recap.get("acompte2"));
        assertEquals(0L, recap.get("interetRetard"));
        assertEquals(6_000_000L, recap.get("total"));
    }

    @Test
    void recapitulatifDeuxiemeAcompte_avecInteretApresLe15Novembre() {
        // Echeance du 15 novembre de N+1 deja depassee
        declaration.setAnnee(LocalDate.now().getYear() - 2);
        int anneeAcompte = declaration.getAnnee() + 1;
        LocalDate date = LocalDate.now();
        long mois = ChronoUnit.MONTHS.between(
                LocalDate.of(anneeAcompte, 11, 1), date.withDayOfMonth(1));
        long interetAttendu = (6_000_000L * Math.max(1L, mois)) / 100;

        when(declarationRepository.findById(1L)).thenReturn(Optional.of(declaration));
        when(acompteService.montantAcompteProvisionnel(12_000_000L)).thenReturn(6_000_000L);

        Map<String, Object> recap = service.recapitulatif(1L, "2EME_ACOMPTE", date);

        // 1 % x 6M x mois ecoules depuis le 1er novembre
        assertEquals(interetAttendu, recap.get("interetRetard"));
        assertEquals(6_000_000L + interetAttendu, recap.get("total"));
    }

    // =====================================================
    // Reglement TOUS
    // =====================================================

    @Test
    void reglementTous_metAJourDeclarationAcompteEtPenalites() {
        declaration.setAcomptesVerses(0L);
        Acompte acompte1 = acompte(declaration.getAnnee() + 1, 1);
        LocalDate datePaiement = LocalDate.now();
        when(contribuableRepository.findById(1L)).thenReturn(Optional.of(contribuable));
        when(declarationRepository.findById(1L)).thenReturn(Optional.of(declaration));
        when(paiementRepository.findByDeclarationIdDeclaration(1L)).thenReturn(List.of());
        when(penaliteService.totalDues(1L)).thenReturn(0L);
        when(acompteService.montantAcompteProvisionnel(12_000_000L)).thenReturn(6_000_000L);
        when(agentRepository.findById(9L)).thenReturn(Optional.of(agent));
        when(acompteRepository
                .findByContribuableIdContribuableAndAnneeAndNumero(1L, declaration.getAnnee() + 1, 1))
                .thenReturn(Optional.of(acompte1));
        when(acompteRepository.save(any(Acompte.class))).thenAnswer(c -> c.getArgument(0));
        when(paiementRepository.save(any(Paiement.class))).thenAnswer(c -> c.getArgument(0));

        Paiement p = service.enregistrer(1L, 1L, null, "TOUS", null,
                datePaiement, "VIREMENT", 9L);

        assertEquals("TOUS", p.getTypeReglement());
        // 12M + 0 + 6M - 0 = 18M (aucun acompte verse en base dans ce test)
        assertEquals(18_000_000L, p.getMontantAr());
        assertEquals("PAYEE", declaration.getStatut());
        assertEquals("PAYE", acompte1.getStatut());
        assertEquals(datePaiement, acompte1.getDatePaiement());
        verify(penaliteService).marquerPayees(1L);
        verify(acompteRepository).save(acompte1);
    }

    @Test
    void reglementTous_interditSiDejaRegle() {
        Paiement dejaPaye = new Paiement();
        dejaPaye.setAnnule(false);
        dejaPaye.setTypeReglement("TOUS");

        when(contribuableRepository.findById(1L)).thenReturn(Optional.of(contribuable));
        when(declarationRepository.findById(1L)).thenReturn(Optional.of(declaration));
        when(paiementRepository.findByDeclarationIdDeclaration(1L)).thenReturn(List.of(dejaPaye));

        assertThrows(BusinessException.class, () -> service.enregistrer(
                1L, 1L, null, "TOUS", null, LocalDate.now(), "VIREMENT", 9L));
    }

    @Test
    void reglementTous_declareeSansDetteInterditeSiContribuableNonActif() {
        contribuable.setStatut("CESSE");
        declaration.setIrDu(0L);
        declaration.setSoldeAPayer(0L);

        when(contribuableRepository.findById(1L)).thenReturn(Optional.of(contribuable));
        when(declarationRepository.findById(1L)).thenReturn(Optional.of(declaration));
        when(paiementRepository.findByDeclarationIdDeclaration(1L)).thenReturn(List.of());

        assertThrows(BusinessException.class, () -> service.enregistrer(
                1L, 1L, null, "TOUS", null, LocalDate.now(), "VIREMENT", 9L));
    }

    // =====================================================
    // Reglement 2EME_ACOMPTE
    // =====================================================

    @Test
    void reglementDeuxiemeAcompte_payeAcompteEtInterets() {
        // L echeance (15 novembre de N+1) est deja passee : interets de retard dus
        declaration.setAnnee(LocalDate.now().getYear() - 2);
        int anneeAcompte = declaration.getAnnee() + 1;
        LocalDate datePaiement = LocalDate.now();
        long mois = ChronoUnit.MONTHS.between(
                LocalDate.of(anneeAcompte, 11, 1), datePaiement.withDayOfMonth(1));
        long interetAttendu = (6_000_000L * Math.max(1L, mois)) / 100;

        Acompte acompte2 = acompte(anneeAcompte, 2);
        acompte2.setIdAcompte(42L);
        Penalite interet = new Penalite();
        interet.setIdPenalite(77L);

        when(contribuableRepository.findById(1L)).thenReturn(Optional.of(contribuable));
        when(declarationRepository.findById(1L)).thenReturn(Optional.of(declaration));
        when(paiementRepository.findByDeclarationIdDeclaration(1L)).thenReturn(List.of());
        when(penaliteService.totalDues(1L)).thenReturn(0L);
        when(acompteService.montantAcompteProvisionnel(12_000_000L)).thenReturn(6_000_000L);
        when(agentRepository.findById(9L)).thenReturn(Optional.of(agent));
        when(acompteRepository
                .findByContribuableIdContribuableAndAnneeAndNumero(1L, anneeAcompte, 2))
                .thenReturn(Optional.of(acompte2));
        when(acompteRepository.save(any(Acompte.class))).thenAnswer(c -> c.getArgument(0));
        when(paiementRepository.save(any(Paiement.class))).thenAnswer(c -> c.getArgument(0));
        when(penaliteService.calculerInteretRetardAcompte(eq(42L), eq(datePaiement)))
                .thenReturn(interet);

        Paiement p = service.enregistrer(1L, 1L, null, "2EME_ACOMPTE", null,
                datePaiement, "MOBILE_MONEY", 9L);

        assertEquals("2EME_ACOMPTE", p.getTypeReglement());
        // 6M d acompte + interets de retard (1 % par mois commence)
        assertEquals(6_000_000L + interetAttendu, p.getMontantAr());
        assertEquals("PAYE", acompte2.getStatut());
        assertEquals(datePaiement, acompte2.getDatePaiement());
        verify(penaliteService).marquerPayee(77L);
        verify(penaliteService, never()).marquerPayees(any());
        verify(declarationRepository, never()).save(any(DeclarationIR.class));
    }

    @Test
    void reglementDeuxiemeAcompte_sansInteretAvantEcheance() {
        // Echeance du 15 novembre de N+1 encore ouverte : pas d interet
        int anneeAcompte = LocalDate.now().getYear() + 1;
        Acompte acompte2 = acompte(anneeAcompte, 2);

        when(contribuableRepository.findById(1L)).thenReturn(Optional.of(contribuable));
        when(declarationRepository.findById(1L)).thenReturn(Optional.of(declaration));
        when(paiementRepository.findByDeclarationIdDeclaration(1L)).thenReturn(List.of());
        when(penaliteService.totalDues(1L)).thenReturn(0L);
        when(acompteService.montantAcompteProvisionnel(12_000_000L)).thenReturn(6_000_000L);
        when(agentRepository.findById(9L)).thenReturn(Optional.of(agent));
        when(acompteRepository
                .findByContribuableIdContribuableAndAnneeAndNumero(1L, anneeAcompte, 2))
                .thenReturn(Optional.of(acompte2));
        when(acompteRepository.save(any(Acompte.class))).thenAnswer(c -> c.getArgument(0));
        when(paiementRepository.save(any(Paiement.class))).thenAnswer(c -> c.getArgument(0));

        Paiement p = service.enregistrer(1L, 1L, null, "2EME_ACOMPTE", null,
                LocalDate.now(), "VIREMENT", 9L);

        assertEquals(6_000_000L, p.getMontantAr());
        verify(penaliteService, never()).calculerInteretRetardAcompte(any(), any());
        verify(penaliteService, never()).marquerPayee(any());
    }

    // =====================================================
    // Validations communes
    // =====================================================

    @Test
    void dateDePaiementFutureInterdite() {
        when(contribuableRepository.findById(1L)).thenReturn(Optional.of(contribuable));

        assertThrows(BusinessException.class, () -> service.enregistrer(
                1L, 1L, null, "TOUS", null, LocalDate.now().plusDays(1),
                "VIREMENT", 9L));
    }

    @Test
    void modeDePaiementInvalide() {
        when(contribuableRepository.findById(1L)).thenReturn(Optional.of(contribuable));

        assertThrows(BusinessException.class, () -> service.enregistrer(
                1L, 1L, null, "TOUS", null, LocalDate.now(), "CB", 9L));
    }

    private Acompte acompte(int annee, int numero) {
        Acompte a = new Acompte();
        a.setContribuable(contribuable);
        a.setAnnee(annee);
        a.setNumero(numero);
        a.setTypeAcompte(AcompteService.TYPE_PROVISIONNEL);
        a.setStatut("A_PAYER");
        a.setMontantAr(6_000_000L);
        return a;
    }
}
