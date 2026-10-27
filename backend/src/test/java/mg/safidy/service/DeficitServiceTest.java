package mg.safidy.service;

import mg.safidy.model.Contribuable;
import mg.safidy.model.Deficit;
import mg.safidy.model.DeclarationIR;
import mg.safidy.model.ParametreFiscal;
import mg.safidy.model.UtilisationDeficit;
import mg.safidy.repository.ContribuableRepository;
import mg.safidy.repository.DeficitRepository;
import mg.safidy.repository.DeclarationIRRepository;
import mg.safidy.repository.ParametreFiscalRepository;
import mg.safidy.repository.UtilisationDeficitRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DeficitServiceTest {

    @Mock
    private DeficitRepository deficitRepository;
    @Mock
    private UtilisationDeficitRepository utilisationRepository;
    @Mock
    private ContribuableRepository contribuableRepository;
    @Mock
    private DeclarationIRRepository declarationRepository;
    @Mock
    private ParametreFiscalRepository parametreRepository;

    private DeficitService service;
    private final Contribuable contribuable = new Contribuable();

    @BeforeEach
    void setUp() {
        service = new DeficitService(deficitRepository, utilisationRepository,
                contribuableRepository, declarationRepository, parametreRepository);
        contribuable.setIdContribuable(1L);
    }

    @Test
    void dureeReport_lueEnParametreSinonCinqAns() {
        when(parametreRepository.findByCode("DUREE_REPORT_DEFICIT")).thenReturn(Optional.empty());
        assertEquals(5, service.dureeReport());

        ParametreFiscal p = new ParametreFiscal();
        p.setValeur(new BigDecimal("8"));
        when(parametreRepository.findByCode("DUREE_REPORT_DEFICIT")).thenReturn(Optional.of(p));
        assertEquals(8, service.dureeReport());
    }

    @Test
    void creerAutomatique_appliqueDureeReportParametree() {
        ParametreFiscal p = new ParametreFiscal();
        p.setValeur(new BigDecimal("8"));
        when(parametreRepository.findByCode("DUREE_REPORT_DEFICIT")).thenReturn(Optional.of(p));
        when(contribuableRepository.findById(1L)).thenReturn(Optional.of(contribuable));
        when(deficitRepository.findByContribuableIdContribuableOrderByAnneeOrigineAsc(1L))
                .thenReturn(List.of());
        when(deficitRepository.save(any(Deficit.class))).thenAnswer(c -> c.getArgument(0));

        Deficit d = service.creerAutomatique(1L, 2026, 40_000_000L);

        assertEquals(Integer.valueOf(2034), d.getAnneeExpiration());
        assertEquals("ACTIF", d.getStatut());
        assertEquals(40_000_000L, d.getSolde());
    }

    @Test
    void creerAutomatique_idempotentNeDoublePasLeDeficit() {
        Deficit existant = deficit(2026, 40_000_000L, 0L, "ACTIF");
        when(contribuableRepository.findById(1L)).thenReturn(Optional.of(contribuable));
        when(deficitRepository.findByContribuableIdContribuableOrderByAnneeOrigineAsc(1L))
                .thenReturn(List.of(existant));
        when(parametreRepository.findByCode("DUREE_REPORT_DEFICIT")).thenReturn(Optional.empty());
        when(deficitRepository.save(any(Deficit.class))).thenAnswer(c -> c.getArgument(0));

        Deficit d = service.creerAutomatique(1L, 2026, 55_000_000L);

        assertSame(existant, d);
        assertEquals(55_000_000L, d.getSolde());
        verify(deficitRepository).save(existant);
    }

    @Test
    void creerAutomatique_neModifiePasHistoriqueDejaImpute() {
        Deficit utilise = deficit(2026, 40_000_000L, 15_000_000L, "ACTIF");
        utilise.setSolde(25_000_000L);
        when(contribuableRepository.findById(1L)).thenReturn(Optional.of(contribuable));
        when(deficitRepository.findByContribuableIdContribuableOrderByAnneeOrigineAsc(1L))
                .thenReturn(List.of(utilise));

        Deficit d = service.creerAutomatique(1L, 2026, 99_000_000L);

        assertSame(utilise, d);
        assertEquals(40_000_000L, d.getMontantInitial());
        assertEquals(25_000_000L, d.getSolde());
        verify(deficitRepository, never()).save(any(Deficit.class));
    }

    @Test
    void imputerAutomatique_fifoEtPlafonneAuBenefice() {
        int annee = LocalDate.now().getYear();
        Deficit ancien = deficit(annee - 4, 5_000_000L, 0L, "ACTIF");
        Deficit recent = deficit(annee - 1, 10_000_000L, 0L, "ACTIF");
        DeclarationIR decl = new DeclarationIR();
        decl.setIdDeclaration(7L);

        when(declarationRepository.findById(7L)).thenReturn(Optional.of(decl));
        when(deficitRepository.findByContribuableIdContribuableAndStatutOrderByAnneeOrigineAsc(
                1L, "ACTIF")).thenReturn(List.of(ancien, recent));
        when(utilisationRepository.save(any(UtilisationDeficit.class)))
                .thenAnswer(c -> c.getArgument(0));
        when(deficitRepository.save(any(Deficit.class))).thenAnswer(c -> c.getArgument(0));

        long impute = service.imputerAutomatique(1L, 7L, 12_000_000L);

        assertEquals(12_000_000L, impute);
        assertEquals(0L, ancien.getSolde());
        assertEquals("EPUISE", ancien.getStatut());
        // 12M de benefice : 5M sur l ancien, 7M sur le recent (solde 10M - 7M)
        assertEquals(3_000_000L, recent.getSolde());
        assertEquals("ACTIF", recent.getStatut());
    }

    @Test
    void imputerAutomatique_sansBeneficeNaRienAFaire() {
        assertEquals(0L, service.imputerAutomatique(1L, 7L, 0L));
        verify(utilisationRepository, never()).save(any(UtilisationDeficit.class));
    }

    @Test
    void reverserImputation_restaurSoldeEtStatut() {
        Deficit d = deficit(2024, 10_000_000L, 4_000_000L, "EPUISE");
        d.setSolde(6_000_000L);
        UtilisationDeficit u = new UtilisationDeficit();
        u.setDeficit(d);
        u.setMontantImpute(4_000_000L);
        when(utilisationRepository.findByDeclarationIdDeclaration(7L)).thenReturn(List.of(u));
        when(deficitRepository.save(any(Deficit.class))).thenAnswer(c -> c.getArgument(0));

        service.reverserImputation(7L);

        assertEquals(0L, d.getMontantUtilise());
        assertEquals(10_000_000L, d.getSolde());
        assertEquals("ACTIF", d.getStatut());
        verify(utilisationRepository).delete(u);
    }

    @Test
    void expirerDeficits_passeEnExpireCeuxDelaLaDuree() {
        int anneeCourante = LocalDate.now().getYear();
        Deficit expire = deficit(2010, 10_000_000L, 0L, "ACTIF");
        expire.setAnneeExpiration(anneeCourante - 1);
        Deficit valide = deficit(anneeCourante - 1, 5_000_000L, 0L, "ACTIF");
        valide.setAnneeExpiration(anneeCourante + 3);

        when(deficitRepository.findAll()).thenReturn(List.of(expire, valide));
        when(deficitRepository.save(any(Deficit.class))).thenAnswer(c -> c.getArgument(0));

        assertEquals(1, service.expirerDeficits());
        assertEquals("EXPIRE", expire.getStatut());
        assertEquals("ACTIF", valide.getStatut());
    }

    private Deficit deficit(int annee, long montant, long utilise, String statut) {
        Deficit d = new Deficit();
        d.setContribuable(contribuable);
        d.setAnneeOrigine(annee);
        d.setMontantInitial(montant);
        d.setMontantUtilise(utilise);
        d.setSolde(montant - utilise);
        d.setAnneeExpiration(annee + 5);
        d.setStatut(statut);
        return d;
    }
}
