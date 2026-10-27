package mg.safidy.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class NombreEnLettresTest {

    @Test
    void conversionsDeBase() {
        assertEquals("zero", NombreEnLettres.consommer(0));
        assertEquals("un", NombreEnLettres.consommer(1));
        assertEquals("seize", NombreEnLettres.consommer(16));
        assertEquals("vingt", NombreEnLettres.consommer(20));
        assertEquals("vingt et un", NombreEnLettres.consommer(21));
        assertEquals("quatre-vingt-un", NombreEnLettres.consommer(81));
        assertEquals("soixante et onze", NombreEnLettres.consommer(71));
        assertEquals("quatre-vingt-dix-neuf", NombreEnLettres.consommer(99));
    }

    @Test
    void centainesEtMilliers() {
        assertEquals("deux cents", NombreEnLettres.consommer(200));
        assertEquals("deux cent cinquante", NombreEnLettres.consommer(250));
        assertEquals("mille", NombreEnLettres.consommer(1000));
        assertEquals("mille deux cent trente-quatre", NombreEnLettres.consommer(1234));
        assertEquals("deux mille cinq", NombreEnLettres.consommer(2005));
    }

    @Test
    void millions() {
        assertEquals("un million", NombreEnLettres.consommer(1_000_000));
        assertEquals("deux millions trois cent mille",
            NombreEnLettres.consommer(2_300_000));
        assertEquals("deux millions dix mille cinq cents",
            NombreEnLettres.consommer(2_010_500));
    }
}
