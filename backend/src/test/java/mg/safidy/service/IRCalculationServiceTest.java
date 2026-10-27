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
        // SOLDE TOTAL = IR du + 1er acompte (50 %) - acomptes verses
        assertEquals(10_000_000L, r.getPremierAcompte());
        assertEquals(30_000_000L, r.getSoldeAPayer());
        assertEquals(30_000_000L, r.getTotalAPayer());
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

    /** Une charge sans justificatif n'est pas reintegree automatiquement. */
    @Test
    void chargesSansFacture_nonReintegreesAutomatiquement() {
        Contribuable c = contribuable("CARBURANT", 0L, "0.0020");

        ResultatCalculIR r = service.calculer(c, 100_000_000L, 90_000_000L,
                5_000_000L, 0L, 0L, 0L, 0L, 12);

        assertEquals(0L, r.getTotalReintegrations());
        // 100M - 90M = 10M
        assertEquals(10_000_000L, r.getBaseImposable());
        assertEquals(2_000_000L, r.getIrBrut());
        // 0 + 0.2 % x 100M = 200 000
        assertEquals(200_000L, r.getMinimumPerception());
        assertEquals(2_000_000L, r.getIrDu());
    }

    /** Exemple de regression : les charges restees sans justificatif ne gonflent pas la base. */
    @Test
    void chargesSansJustificatif_exempleDeclarationNeReintegrePasLesCharges() {
        // Un minimum de perception positif peut relever l'IR du au-dessus de l'IR brut.
        Contribuable c = contribuable("GENERAL", 0L, "0.0000");

        ResultatCalculIR r = service.calculer(c, 100_000_000L, 40_000_000L,
                40_000_000L, 0L, 0L, 0L, 0L, 12);

        assertEquals(60_000_000L, r.getResultatComptable());
        assertEquals(0L, r.getTotalReintegrations());
        assertEquals(60_000_000L, r.getBaseImposable());
        assertEquals(12_000_000L, r.getIrBrut());
        // IR du 12M + 1er acompte 6M - 0 acompte verse
        assertEquals(18_000_000L, r.getSoldeAPayer());
    }

    /** Acomptes superieurs a l'IR du : le 1er acompte reste du, pas de credit. */
    @Test
    void acomptesSuperieurs_soldeResteDu() {
        Contribuable c = contribuable("PRIORITAIRE", 500_000L, "0.0100");

        ResultatCalculIR r = service.calculer(c, 300_000_000L, 200_000_000L,
                0L, 0L, 0L, 0L, 25_000_000L, 12);

        assertEquals(20_000_000L, r.getIrDu());
        // 20M + 10M (1er acompte) - 25M verses = 5M
        assertEquals(5_000_000L, r.getSoldeAPayer());
        assertEquals(0L, r.getCreditImpot());
    }

    /** Les acomptes verses depassent IR du + 1er acompte : credit d'impot. */
    @Test
    void acomptesTresSuperieurs_creditImpot() {
        Contribuable c = contribuable("PRIORITAIRE", 500_000L, "0.0100");

        ResultatCalculIR r = service.calculer(c, 300_000_000L, 200_000_000L,
                0L, 0L, 0L, 0L, 40_000_000L, 12);

        assertEquals(20_000_000L, r.getIrDu());
        assertEquals(0L, r.getSoldeAPayer());
        // 40M verses - (20M + 10M) = 10M de credit
        assertEquals(10_000_000L, r.getCreditImpot());
    }

    /**
     * FORMULE DU SOLDE (maquette "propre") :
     *   Total = IR du + penalites + 1er acompte N+1 - acomptes N verses
     * La penalite est en plus du solde (double comptage voulu : elle est
     * egalement reintriee dans la base).
     */
    @Test
    void soldeTotal_inclutPenalitesEtPremierAcompte() {
        Contribuable c = contribuable("GENERAL", 1_000_000L, "0.0000");

        ResultatCalculIR r = service.calculer(c, 100_000_000L, 40_000_000L,
                0L, 0L, 0L, 0L, 10_000_000L, 12, 1_500_000L);

        assertEquals(12_000_000L, r.getIrDu());
        assertEquals(1_500_000L, r.getPenalitesDues());
        assertEquals(6_000_000L, r.getPremierAcompte());
        // 12M + 1.5M + 6M - 10M = 9.5M
        assertEquals(9_500_000L, r.getSoldeAPayer());
        assertEquals(9_500_000L, r.getTotalAPayer());
    }

    /** Sans acompte verse, le solde = IR du + penalite + 1er acompte. */
    @Test
    void soldeTotal_sansAcompteVerse() {
        Contribuable c = contribuable("GENERAL", 1_000_000L, "0.0000");

        ResultatCalculIR r = service.calculer(c, 100_000_000L, 40_000_000L,
                0L, 0L, 0L, 0L, 0L, 12, 500_000L);

        // Sans acompte verse : 12M IR + 0.5M penalite + 6M 1er acompte = 18.5M
        assertEquals(18_500_000L, r.getSoldeAPayer());
        assertEquals(0L, r.getCreditImpot());
    }

    /** L'arrondi de la base au millier inferieur. */
    @Test
    void base_arrondieAuMillierInferieur() {
        Contribuable c = contribuable("GENERAL", 1_000_000L, "0.0100");

        ResultatCalculIR r = service.calculer(c, 1_999_999L, 0L, 0L, 0L, 0L, 0L, 0L, 12);

        assertEquals(1_999_000L, r.getBaseImposable());
        assertEquals(399_800L, r.getIrBrut());
    }

    /** Regime unique reel : le taux sectoriel 10 % n'existe plus (toujours 20 %). */
    @Test
    void tauxSecteur_10Pourcent_toujoursIgnore() {
        Contribuable c = contribuable("SANTE_EDUC", 200_000L, "0.0020");
        c.setRegime("REEL_OBLIGATOIRE");
        c.getSecteur().setTauxIr(new BigDecimal("10"));

        ResultatCalculIR r = service.calculer(c, 300_000_000L, 200_000_000L,
                0L, 0L, 0L, 0L, 0L, 12);

        assertEquals(new BigDecimal("20"), r.getTauxApplique());
        assertEquals(20_000_000L, r.getIrBrut());
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
