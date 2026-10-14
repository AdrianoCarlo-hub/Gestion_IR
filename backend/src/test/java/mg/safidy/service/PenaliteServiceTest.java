package mg.safidy.service;

import mg.safidy.model.Acompte;
import mg.safidy.model.Contribuable;
import mg.safidy.model.DeclarationIR;
import mg.safidy.model.Penalite;
import mg.safidy.repository.AcompteRepository;
import mg.safidy.repository.DeclarationIRRepository;
import mg.safidy.repository.ParametreFiscalRepository;
import mg.safidy.repository.PenaliteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PenaliteServiceTest {

    @Mock
    private PenaliteRepository penaliteRepository;
    @Mock
    private DeclarationIRRepository declarationRepository;
    @Mock
    private ParametreFiscalRepository parametreRepository;
    @Mock
    private AcompteRepository acompteRepository;

    private PenaliteService service;

    @BeforeEach
    void setUp() {
        service = new PenaliteService(penaliteRepository, declarationRepository,
                parametreRepository, acompteRepository);
    }

    @Test
    void majorationRetardCalculeSurSoldeNetEtCompteLesMoisCommences() {
        DeclarationIR declaration = new DeclarationIR();
        declaration.setIdDeclaration(10L);
        declaration.setAnnee(2026);
        declaration.setCaHt(50_000_000L);
        declaration.setDateLimite(LocalDate.of(2026, 5, 15));
        declaration.setSoldeAPayer(2_000_000L);

        when(declarationRepository.findById(10L)).thenReturn(Optional.of(declaration));
        when(penaliteRepository.save(any(Penalite.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Penalite penalite = service.appliquerMajorationRetard(10L, LocalDate.of(2026, 8, 10));

        assertEquals("MAJORATION", penalite.getType());
        assertEquals(2_000_000L, penalite.getBaseCalculAr());
        assertEquals(3, penalite.getNbMois());
        assertEquals(60_000L, penalite.getMontantAr());
    }

    @Test
    void interetRetardAcompteAppliqueSurMontantAcompteEtCompteLesMoisCommences() {
        DeclarationIR declaration = new DeclarationIR();
        declaration.setIdDeclaration(99L);
        declaration.setAnnee(2027);

        Acompte acompte = new Acompte();
        acompte.setIdAcompte(42L);
        acompte.setAnnee(2027);
        acompte.setMontantAr(25_000_000L);
        acompte.setDateEcheance(LocalDate.of(2027, 5, 15));
        acompte.setStatut("A_PAYER");
        Contribuable contribuable = new Contribuable();
        contribuable.setIdContribuable(7L);
        acompte.setContribuable(contribuable);

        when(acompteRepository.findById(42L)).thenReturn(Optional.of(acompte));
        when(declarationRepository.findByContribuableIdContribuableAndAnnee(7L, 2027))
                .thenReturn(Optional.of(declaration));
        when(penaliteRepository.save(any(Penalite.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Penalite penalite = service.calculerInteretRetardAcompte(42L, LocalDate.of(2027, 8, 10));

        assertEquals("INTERET_RETARD_ACOMPTE", penalite.getType());
        assertEquals(25_000_000L, penalite.getBaseCalculAr());
        assertEquals(3, penalite.getNbMois());
        assertEquals(750_000L, penalite.getMontantAr());
    }
}
