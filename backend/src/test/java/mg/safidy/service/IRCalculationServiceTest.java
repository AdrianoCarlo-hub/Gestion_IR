package mg.safidy.service;

import mg.safidy.dto.ResultatCalculIR;
import mg.safidy.model.Contribuable;
import mg.safidy.model.SecteurActivite;
import mg.safidy.repository.ParametreFiscalRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

@ExtendWith(MockitoExtension.class)
class IRCalculationServiceTest {

    @Mock
    private ParametreFiscalRepository parametreRepository;

    private IRCalculationService service;

    @BeforeEach
    void setUp() {
        // Aucun parametre en base : le service retombe sur les taux par defaut (IR 20 %, acompte 50 %).
        service = new IRCalculationService(parametreRepository);
    }

    private Contribuable contribuable(String categorie, long fixe, String pct) {
        SecteurActivite s = new SecteurActivite();
        s.setMinFixeAr(fixe);
        s.setMinPctCa(new BigDecimal(pct));
        Contribuable c = new Contribuable();
        c.setSecteur(s);
        return c;
    }

    /** Exemple officiel SU6 : industriel, arret le 1er juillet, 6 mois actifs. */
    @Test
    void minimumProrataMoisActifs_et_irBrut20Pourcent() {
        Contribuable c = contribuable("PRIORITAIRE", 500_000L, "0.0100");

        ResultatCalculIR r = service.calculer(
                c,
                300_000_000L,
                200_000_000L,
                0L,
                0L,
                0L,
                0L,
                0L,
                6);

        assertEquals(100_000_000L, r.getResultatComptable());
        assertEquals(100_000_000L, r.getBaseImposable());
        assertEquals(20_000_000L, r.getIrBrut());
        // 500 000 x 6/12 + 1 % x 300 000 000 = 250 000 + 3 000 000
        assertEquals(3_250_000L, r.getMinimumPerception());
        assertEquals(20_000_000L, r.getIrDu());
        assertEquals(20_000_000L, r.getSoldeAPayer());
    }

    /** Minimum general quand le resultat est nul. */
    @Test
    void minimumGeneral_sansResultat() {
        Contribuable c = contribuable("GENERAL", 1_000_000L, "0.0100");

        ResultatCalculIR r = service.calculer(c, 0L, 0L, 0L, 0L, 0L, 0L, 0L, 12);

        assertEquals(0L, r.getIrBrut());
        assertEquals(1_000_000L, r.getMinimumPerception());
        assertEquals(1_000_000L, r.getIrDu());
    }

    /** Base negative : generation automatique d'un deficit. */
    @Test
    void baseNegative_genereDeficit() {
        Contribuable c = contribuable("GENERAL", 1_000_000L, "0.0100");

        ResultatCalculIR r = service.calculer(c, 100_000_000L, 150_000_000L,
                0L, 0L, 0L, 0L, 0L, 12);

        assertEquals(50_000_000L, r.getDeficitGenere());
        assertEquals(0L, r.getDeficitImpute());
        assertEquals(0L, r.getBaseImposable());
        assertEquals(0L, r.getIrBrut());
        // Le minimum reste du : 1 000 000 + 1 % x 100 000 000 = 2 000 000
        assertEquals(2_000_000L, r.getMinimumPerception());
        assertEquals(2_000_000L, r.getIrDu());
    }

    /** Imputation d'un deficit disponible sur une base positive. */
    @Test
    void deficitImpute_surBasePositive() {
        Contribuable c = contribuable("GENERAL", 1_000_000L, "0.0100");

        ResultatCalculIR r = service.calculer(c, 100_000_000L, 90_000_000L,
                0L, 0L, 0L, 4_000_000L, 0L, 12);

        assertEquals(10_000_000L, r.getBaseImposable() + r.getDeficitImpute());
        assertEquals(4_000_000L, r.getDeficitImpute());
        assertEquals(6_000_000L, r.getBaseImposable());
        assertEquals(1_200_000L, r.getIrBrut());
        // irDu = max(IR brut ; minimum 2 000 000)
        assertEquals(2_000_000L, r.getIrDu());
    }

    /** Charges sans facture reintegrees automatiquement. */
    @Test
    void chargesSansFacture_reintegrees() {
        Contribuable c = contribuable("CARBURANT", 0L, "0.0020");

        ResultatCalculIR r = service.calculer(c, 100_000_000L, 90_000_000L,
                5_000_000L, 0L, 0L, 0L, 0L, 12);

        assertEquals(5_000_000L, r.getTotalReintegrations());
        // 100M - 90M + 5M = 15M
        assertEquals(15_000_000L, r.getBaseImposable());
        assertEquals(3_000_000L, r.getIrBrut());
        // 0 + 0.2 % x 100M = 200 000
        assertEquals(200_000L, r.getMinimumPerception());
        assertEquals(3_000_000L, r.getIrDu());
    }

    /** Acomptes superieurs a l'IR du : credit d'impot. */
    @Test
    void acomptesSuperieurs_creditImpot() {
        Contribuable c = contribuable("PRIORITAIRE", 500_000L, "0.0100");

        ResultatCalculIR r = service.calculer(c, 300_000_000L, 200_000_000L,
                0L, 0L, 0L, 0L, 25_000_000L, 12);

        assertEquals(20_000_000L, r.getIrDu());
        assertEquals(0L, r.getSoldeAPayer());
        assertEquals(5_000_000L, r.getCreditImpot());
    }

    /** L'arrondi de la base au millier inferieur. */
    @Test
    void base_arrondieAuMillierInferieur() {
        Contribuable c = contribuable("GENERAL", 1_000_000L, "0.0100");

        ResultatCalculIR r = service.calculer(c, 1_999_999L, 0L, 0L, 0L, 0L, 0L, 0L, 12);

        assertEquals(1_999_000L, r.getBaseImposable());
        assertEquals(399_800L, r.getIrBrut());
    }

    /** Sante/Education en REEL_OPTION : taux sectoriel 10 %. */
    @Test
    void tauxSecteurSanteReelOption_10Pourcent() {
        Contribuable c = contribuable("SANTE_EDUC", 200_000L, "0.0020");
        c.setRegime("REEL_OPTION");
        c.getSecteur().setTauxIr(new BigDecimal("10"));

        ResultatCalculIR r = service.calculer(c, 300_000_000L, 200_000_000L,
                0L, 0L, 0L, 0L, 0L, 12);

        assertEquals(new BigDecimal("10"), r.getTauxApplique());
        assertEquals(10_000_000L, r.getIrBrut());
        assertEquals(10_000_000L, r.getIrDu());
    }

    /** Sante/Education en REEL_OBLIGATOIRE : l'option 10 % ne s'applique pas (20 %). */
    @Test
    void tauxSecteurSanteReelObligatoire_20Pourcent() {
        Contribuable c = contribuable("SANTE_EDUC", 200_000L, "0.0020");
        c.setRegime("REEL_OBLIGATOIRE");
        c.getSecteur().setTauxIr(new BigDecimal("10"));

        ResultatCalculIR r = service.calculer(c, 300_000_000L, 200_000_000L,
                0L, 0L, 0L, 0L, 0L, 12);

        assertEquals(new BigDecimal("20"), r.getTauxApplique());
        assertEquals(20_000_000L, r.getIrBrut());
    }
}
