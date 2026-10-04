package mg.safidy.service;

import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import jakarta.servlet.http.HttpServletResponse;
import mg.safidy.model.Paiement;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.IOException;
import java.text.NumberFormat;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class PdfService {

    private static final Font TITRE = new Font(Font.HELVETICA, 18, Font.BOLD, new Color(13, 47, 42));
    private static final Font SOUS_TITRE = new Font(Font.HELVETICA, 12, Font.BOLD, new Color(26, 92, 74));
    private static final Font NORMAL = new Font(Font.HELVETICA, 11);
    private static final Font LABEL = new Font(Font.HELVETICA, 11, Font.BOLD);

    private final NumberFormat fmt = NumberFormat.getInstance(Locale.FRANCE);

    private String ar(Long v) {
        return (v == null ? "0" : fmt.format(v)) + " Ar";
    }

    public void genererQuittance(HttpServletResponse response, Paiement p) throws IOException {
        response.setContentType("application/pdf");
        response.setHeader("Content-Disposition",
            "attachment; filename=\"quittance-" + p.getReferenceQuittance() + ".pdf\"");

        Document doc = new Document(PageSize.A5);
        PdfWriter.getInstance(doc, response.getOutputStream());
        doc.open();

        Paragraph header = new Paragraph("SAFIDY — CENTRE FISCAL", TITRE);
        header.setAlignment(Element.ALIGN_CENTER);
        doc.add(header);

        Paragraph sous = new Paragraph("QUITTANCE DE PAIEMENT", SOUS_TITRE);
        sous.setAlignment(Element.ALIGN_CENTER);
        sous.setSpacingAfter(20);
        doc.add(sous);

        PdfPTable t = new PdfPTable(2);
        t.setWidthPercentage(100);
        t.setWidths(new float[]{1.2f, 2f});

        ligne(t, "N° de quittance", p.getReferenceQuittance());
        ligne(t, "Date de paiement", String.valueOf(p.getDatePaiement()));
        ligne(t, "Contribuable", p.getContribuable() != null ? p.getContribuable().getRaisonSociale() : "-");
        ligne(t, "NIF", p.getContribuable() != null ? p.getContribuable().getNif() : "-");
        ligne(t, "Type de paiement", p.getTypePaiement());
        ligne(t, "Mode", p.getMode());
        ligne(t, "Montant", ar(p.getMontantAr()));
        ligne(t, "Agent", p.getAgent() != null
            ? p.getAgent().getPrenom() + " " + p.getAgent().getNom() : "-");

        doc.add(t);

        Paragraph footer = new Paragraph(
            "\n\nDocument genere automatiquement par l application Safidy.",
            new Font(Font.HELVETICA, 9, Font.ITALIC, new Color(100, 116, 139)));
        footer.setAlignment(Element.ALIGN_CENTER);
        doc.add(footer);

        doc.close();
    }

    public void genererStatistiques(HttpServletResponse response, Map<String, Object> stats)
            throws IOException {
        response.setContentType("application/pdf");
        response.setHeader("Content-Disposition",
            "attachment; filename=\"statistiques-safidy.pdf\"");

        Document doc = new Document(PageSize.A4);
        PdfWriter.getInstance(doc, response.getOutputStream());
        doc.open();

        Paragraph header = new Paragraph("SAFIDY — RAPPORT STATISTIQUE", TITRE);
        header.setAlignment(Element.ALIGN_CENTER);
        header.setSpacingAfter(20);
        doc.add(header);

        Paragraph sous = new Paragraph("Synthese des donnees fiscales", SOUS_TITRE);
        sous.setSpacingAfter(15);
        doc.add(sous);

        PdfPTable t = new PdfPTable(2);
        t.setWidthPercentage(100);
        t.setWidths(new float[]{2f, 1f});

        ligneStat(t, "Contribuables enregistres", stats.get("contribuables"));
        ligneStat(t, "Declarations IR", stats.get("declarations"));
        ligneStat(t, "Acomptes", stats.get("acomptes"));
        ligneStat(t, "Paiements", stats.get("paiements"));
        ligneStat(t, "Deficits actifs", stats.get("deficitsActifs"));
        ligneStat(t, "IR total du", ar(toLong(stats.get("irTotal"))));
        ligneStat(t, "Total encaisse", ar(toLong(stats.get("encaisse"))));
        ligneStat(t, "Reste a payer", ar(toLong(stats.get("soldeAPayer"))));
        ligneStat(t, "Taux de recouvrement", stats.get("tauxRecouvrement") + " %");

        doc.add(t);

        Paragraph sign = new Paragraph(
            "\n\nGenere le " + java.time.LocalDate.now() + " par l application Safidy.",
            new Font(Font.HELVETICA, 9, Font.ITALIC, new Color(100, 116, 139)));
        sign.setAlignment(Element.ALIGN_RIGHT);
        doc.add(sign);

        doc.close();
    }

    private void ligne(PdfPTable t, String label, String valeur) {
        PdfPCell c1 = new PdfPCell(new Phrase(label, LABEL));
        c1.setBorder(Rectangle.BOTTOM);
        c1.setPadding(8);

        PdfPCell c2 = new PdfPCell(new Phrase(valeur == null ? "-" : valeur, NORMAL));
        c2.setBorder(Rectangle.BOTTOM);
        c2.setPadding(8);

        t.addCell(c1);
        t.addCell(c2);
    }

    private void ligneStat(PdfPTable t, String label, Object valeur) {
        PdfPCell c1 = new PdfPCell(new Phrase(label, NORMAL));
        c1.setPadding(8);

        PdfPCell c2 = new PdfPCell(new Phrase(valeur == null ? "-" : valeur.toString(),
            new Font(Font.HELVETICA, 11, Font.BOLD)));
        c2.setPadding(8);
        c2.setHorizontalAlignment(Element.ALIGN_RIGHT);

        t.addCell(c1);
        t.addCell(c2);
    }

    private Long toLong(Object o) {
        if (o == null) return 0L;
        if (o instanceof Number) return ((Number) o).longValue();
        try { return Long.parseLong(o.toString()); } catch (Exception e) { return 0L; }
    }
}
