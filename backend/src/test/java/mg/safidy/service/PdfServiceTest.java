package mg.safidy.service;

import jakarta.servlet.ServletOutputStream;
import jakarta.servlet.WriteListener;
import jakarta.servlet.http.HttpServletResponse;
import mg.safidy.model.Agent;
import mg.safidy.model.Contribuable;
import mg.safidy.model.DeclarationIR;
import mg.safidy.model.Paiement;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PdfServiceTest {

    @Mock
    private HttpServletResponse response;

    private static class CaptureStream extends ServletOutputStream {
        final ByteArrayOutputStream baos = new ByteArrayOutputStream();

        @Override
        public void write(int b) {
            baos.write(b);
        }

        @Override
        public boolean isReady() {
            return true;
        }

        @Override
        public void setWriteListener(WriteListener writeListener) {
        }
    }

    private Paiement paiement() {
        Contribuable c = new Contribuable();
        c.setNif("1000000001");
        c.setRaisonSociale("SARL EXEMPLE");
        c.setNomDirigeant("Rakoto Jean");
        c.setAdresse("Antananarivo");

        DeclarationIR d = new DeclarationIR();
        d.setIdDeclaration(52L);
        d.setAnnee(2025);
        d.setIrDu(900_000L);
        d.setPenaliteDueAr(45_000L);
        d.setPremierAcompteAr(450_000L);
        d.setAcomptesVerses(100_000L);
        d.setContribuable(c);

        Agent a = new Agent();
        a.setPrenom("Paul");
        a.setNom("Randria");

        Paiement p = new Paiement();
        p.setIdPaiement(1L);
        p.setReferenceQuittance("Q-2026-00001");
        p.setMontantAr(1_295_000L);
        p.setDatePaiement(LocalDate.now());
        p.setMode("VIREMENT");
        p.setTypePaiement("REGLEMENT");
        p.setTypeReglement("TOUS");
        p.setAnnule(false);
        p.setContribuable(c);
        p.setDeclaration(d);
        p.setAgent(a);
        return p;
    }

    @Test
    void quittanceGenereUnPdfValide() throws Exception {
        CaptureStream stream = new CaptureStream();
        when(response.getOutputStream()).thenReturn(stream);

        new PdfService().genererQuittance(response, paiement());

        byte[] pdf = stream.baos.toByteArray();
        assertTrue(pdf.length > 500, "PDF trop petit : " + pdf.length);
        assertEquals("%PDF", new String(pdf, 0, 4));
    }

    @Test
    void ficheDeclarationGenereUnPdfValide() throws Exception {
        CaptureStream stream = new CaptureStream();
        when(response.getOutputStream()).thenReturn(stream);

        new PdfService().genererFicheDeclaration(response, paiement().getDeclaration());

        byte[] pdf = stream.baos.toByteArray();
        assertTrue(pdf.length > 500, "PDF trop petit : " + pdf.length);
        assertEquals("%PDF", new String(pdf, 0, 4));
    }

    @Test
    void bilanAnnuelGenereUnPdfValide() throws Exception {
        CaptureStream stream = new CaptureStream();
        when(response.getOutputStream()).thenReturn(stream);

        new PdfService().genererBilanAnnuel(response, 2026,
            400_000_000L, 80_000_000L, 30_000_000L, 50_000_000L, 37.5);

        byte[] pdf = stream.baos.toByteArray();
        assertTrue(pdf.length > 500, "PDF trop petit : " + pdf.length);
        assertEquals("%PDF", new String(pdf, 0, 4));
    }
}
