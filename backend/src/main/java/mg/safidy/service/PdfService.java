package mg.safidy.service;

import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.Image;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import jakarta.servlet.http.HttpServletResponse;
import mg.safidy.model.Contribuable;
import mg.safidy.model.DeclarationIR;
import mg.safidy.model.Paiement;
import mg.safidy.util.NombreEnLettres;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.geom.Arc2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
public class PdfService {

    private static final Color VERT = new Color(27, 77, 62);      // #1B4D3E
    private static final Color VERT_CLAIR = new Color(14, 122, 85); // #0E7A55
    private static final Color GRIS = new Color(100, 116, 139);
    private static final Color GRIS_CLAIR = new Color(217, 217, 217);

    private static final Font TITRE = new Font(Font.HELVETICA, 18, Font.BOLD, VERT);
    private static final Font SOUS_TITRE = new Font(Font.HELVETICA, 12, Font.BOLD, VERT_CLAIR);
    private static final Font NORMAL = new Font(Font.HELVETICA, 11);
    private static final Font NORMAL_GRAS = new Font(Font.HELVETICA, 11, Font.BOLD);
    private static final Font LABEL = new Font(Font.HELVETICA, 11, Font.BOLD);
    private static final Font PETIT = new Font(Font.HELVETICA, 9, Font.ITALIC, GRIS);
    private static final Font MONTANT_FINAL = new Font(Font.HELVETICA, 14, Font.BOLD, VERT);

    private static final String[] CHEMINS_LOGO = {
        "frontend/public/logo.png",
        "../frontend/public/logo.png",
        "public/logo.png",
        "logo.png"
    };

    private final NumberFormat fmt = NumberFormat.getInstance(Locale.FRANCE);

    private String ar(Long v) {
        return (v == null ? "0" : fmt.format(v)) + " Ar";
    }

    private Long val(Long v) {
        return v == null ? 0L : v;
    }

    private Long toLong(Object o) {
        if (o == null) return 0L;
        if (o instanceof Number n) return n.longValue();
        try { return Long.parseLong(o.toString()); } catch (Exception e) { return 0L; }
    }

    // ------------------------------------------------------------------
    // Entete commune : logo a gauche, republique au centre
    // ------------------------------------------------------------------

    private void entete(Document doc, PdfWriter writer) throws DocumentException, IOException {
        PdfPTable t = new PdfPTable(new float[]{1.2f, 5f, 1.2f});
        t.setWidthPercentage(100);
        t.setSpacingAfter(6);

        PdfPCell cellLogo = new PdfPCell();
        cellLogo.setBorder(Rectangle.NO_BORDER);
        cellLogo.setVerticalAlignment(Element.ALIGN_MIDDLE);
        Image logo = chargerLogo();
        if (logo != null) {
            logo.scaleToFit(56f, 56f);
            cellLogo.addElement(logo);
        } else {
            cellLogo.addElement(new Phrase(""));
        }
        t.addCell(cellLogo);

        PdfPCell cellCentre = new PdfPCell();
        cellCentre.setBorder(Rectangle.NO_BORDER);
        cellCentre.setHorizontalAlignment(Element.ALIGN_CENTER);
        cellCentre.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cellCentre.addElement(new Paragraph("REPUBLIQUE DE MADAGASCAR", new Font(Font.HELVETICA, 12, Font.BOLD, VERT)));
        cellCentre.addElement(new Paragraph("CENTRE FISCAL", new Font(Font.HELVETICA, 11, Font.NORMAL, GRIS)));
        t.addCell(cellCentre);

        PdfPCell vide = new PdfPCell(new Phrase(""));
        vide.setBorder(Rectangle.NO_BORDER);
        t.addCell(vide);

        doc.add(t);

        Paragraph regle = new Paragraph(" ");
        regle.setSpacingAfter(2);
        doc.add(regle);
    }

    private Image chargerLogo() {
        for (String chemin : CHEMINS_LOGO) {
            try {
                Path p = Paths.get(chemin);
                if (Files.isRegularFile(p)) {
                    return Image.getInstance(Files.readAllBytes(p));
                }
            } catch (Exception ignored) {
                // logo absent ou illisible : on continue sans image
            }
        }
        return null;
    }

    // ------------------------------------------------------------------
    // 1. Quittance de paiement
    // ------------------------------------------------------------------

    public void genererQuittance(HttpServletResponse response, Paiement p) throws IOException {
        response.setContentType("application/pdf");
        response.setHeader("Content-Disposition",
            "attachment; filename=\"quittance-" + p.getReferenceQuittance() + ".pdf\"");

        Document doc = new Document(PageSize.A4, 40, 40, 30, 30);
        try {
            PdfWriter writer = PdfWriter.getInstance(doc, response.getOutputStream());
            doc.open();
            entete(doc, writer);

            // Titre + numero a droite
            Paragraph titre = new Paragraph("QUITTANCE DE PAIEMENT", TITRE);
            titre.setAlignment(Element.ALIGN_CENTER);
            titre.setSpacingAfter(4);
            doc.add(titre);

            Paragraph numero = new Paragraph(
                "N° " + p.getReferenceQuittance(), SOUS_TITRE);
            numero.setAlignment(Element.ALIGN_RIGHT);
            numero.setSpacingAfter(14);
            doc.add(numero);

            // Corps : informations
            Contribuable c = p.getContribuable();
            PdfPTable infos = new PdfPTable(2);
            infos.setWidthPercentage(100);
            infos.setWidths(new float[]{1.3f, 2.4f});
            ligne(infos, "Contribuable", c != null ? c.getRaisonSociale() : "-");
            ligne(infos, "NIF", c != null ? c.getNif() : "-");
            ligne(infos, "Declaration concernee", concernee(p));
            ligne(infos, "Mode de paiement", p.getMode());
            ligne(infos, "Date de paiement",
                p.getDatePaiement() == null ? "-" : p.getDatePaiement()
                    .format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
            ligne(infos, "Agent", p.getAgent() != null
                ? p.getAgent().getPrenom() + " " + p.getAgent().getNom() : "-");
            doc.add(infos);

            doc.add(espace(14));

            // Detail du montant
            Paragraph sousTitre = new Paragraph("DETAIL DU MONTANT ENCAISSE", SOUS_TITRE);
            sousTitre.setSpacingAfter(6);
            doc.add(sousTitre);

            PdfPTable montants = new PdfPTable(2);
            montants.setWidthPercentage(100);
            montants.setWidths(new float[]{2.4f, 1.4f});

            DeclarationIR d = p.getDeclaration();
            boolean deuxieme = "2EME_ACOMPTE".equals(p.getTypeReglement());
            if (d != null && !deuxieme) {
                ligneMontant(montants, "IR du", val(d.getIrDu()));
                ligneMontant(montants, "Penalites dues", val(d.getPenaliteDueAr()));
                ligneMontant(montants, "1er acompte N+1", val(d.getPremierAcompteAr()));
                ligneMontant(montants, "Acomptes verses (deduit)",
                    -val(d.getAcomptesVerses()));
            } else if (d != null && deuxieme) {
                ligneMontant(montants, "2e acompte (50 % de l IR " + d.getAnnee() + ")",
                    val(p.getMontantAr()));
            } else {
                ligneMontant(montants, "Montant regle", val(p.getMontantAr()));
            }

            PdfPCell totalLibelle = new PdfPCell(
                new Phrase("TOTAL ENCAISSE", MONTANT_FINAL));
            totalLibelle.setPadding(10);
            totalLibelle.setBorder(Rectangle.TOP);
            totalLibelle.setBackgroundColor(new java.awt.Color(240, 248, 244));
            montants.addCell(totalLibelle);

            PdfPCell totalValeur = new PdfPCell(
                new Phrase(ar(p.getMontantAr()), MONTANT_FINAL));
            totalValeur.setHorizontalAlignment(Element.ALIGN_RIGHT);
            totalValeur.setPadding(10);
            totalValeur.setBorder(Rectangle.TOP);
            totalValeur.setBackgroundColor(new java.awt.Color(240, 248, 244));
            montants.addCell(totalValeur);

            doc.add(montants);

            doc.add(espace(18));

            // Montant en lettres
            long montant = val(p.getMontantAr());
            Paragraph lettres = new Paragraph(
                "Montant recu la somme de : "
                    + NombreEnLettres.consommer(montant) + " Ariary",
                new Font(Font.HELVETICA, 11, Font.ITALIC));
            lettres.setSpacingAfter(24);
            doc.add(lettres);

            // Zone de signature de l'agent
            PdfPTable signature = new PdfPTable(1);
            signature.setWidthPercentage(45);
            signature.setHorizontalAlignment(Element.ALIGN_RIGHT);
            PdfPCell zone = new PdfPCell();
            zone.setBorder(Rectangle.BOX);
            zone.setPadding(8);
            zone.addElement(new Paragraph("Signature de l agent",
                new Font(Font.HELVETICA, 10, Font.BOLD)));
            zone.addElement(new Paragraph(" ", NORMAL));
            zone.addElement(new Paragraph(" ", NORMAL));
            zone.addElement(new Paragraph(
                p.getAgent() != null
                    ? p.getAgent().getPrenom() + " " + p.getAgent().getNom() : "",
                NORMAL));
            signature.addCell(zone);
            doc.add(signature);

            doc.add(espace(12));
            Paragraph pied = new Paragraph(
                "Document genere le " + LocalDate.now()
                    .format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                    + " - Gestion IR / Centre fiscal.", PETIT);
            pied.setAlignment(Element.ALIGN_CENTER);
            doc.add(pied);

            doc.close();
        } catch (DocumentException e) {
            throw new IOException("Erreur de generation de la quittance", e);
        }
    }

    private String concernee(Paiement p) {
        if (p.getDeclaration() != null) {
            return "Declaration n° " + p.getDeclaration().getIdDeclaration()
                + " - Exercice " + p.getDeclaration().getAnnee();
        }
        if (p.getAcompte() != null) {
            return "Acompte " + p.getAcompte().getNumero()
                + " - Exercice " + p.getAcompte().getAnnee();
        }
        return "-";
    }

    // ------------------------------------------------------------------
    // 2. Bilan annuel (tableau + camembert)
    // ------------------------------------------------------------------

    public void genererBilanAnnuel(HttpServletResponse response, int annee,
                                   long caTotal, long irTotal,
                                   long encaisse, long reste, double taux)
            throws IOException {
        response.setContentType("application/pdf");
        response.setHeader("Content-Disposition",
            "attachment; filename=\"bilan-" + annee + ".pdf\"");

        Document doc = new Document(PageSize.A4, 40, 40, 30, 30);
        try {
            PdfWriter writer = PdfWriter.getInstance(doc, response.getOutputStream());
            doc.open();
            entete(doc, writer);

            Paragraph titre = new Paragraph("BILAN ANNUEL - EXERCICE " + annee, TITRE);
            titre.setAlignment(Element.ALIGN_CENTER);
            titre.setSpacingAfter(14);
            doc.add(titre);

            PdfPTable t = new PdfPTable(2);
            t.setWidthPercentage(100);
            t.setWidths(new float[]{2f, 1.4f});
            ligneStat(t, "CA total declare", ar(caTotal));
            ligneStat(t, "IR total du", ar(irTotal));
            ligneStat(t, "IR encaisse", ar(encaisse));
            ligneStat(t, "Reste a recouvrer", ar(reste));
            ligneStat(t, "Taux de recouvrement", String.format(Locale.FRANCE, "%.2f %%", taux));
            doc.add(t);

            doc.add(espace(18));

            Paragraph sousTitre = new Paragraph("REPARTITION DES ENCAISSEMENTS", SOUS_TITRE);
            sousTitre.setAlignment(Element.ALIGN_CENTER);
            sousTitre.setSpacingAfter(10);
            doc.add(sousTitre);

            Image camembert = camembert(encaisse, reste);
            if (camembert != null) {
                camembert.setAlignment(Element.ALIGN_CENTER);
                doc.add(camembert);
            }

            doc.add(espace(20));
            Paragraph pied = new Paragraph(
                "Bilan genere le " + LocalDate.now()
                    .format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                    + " - Gestion IR / Centre fiscal.", PETIT);
            pied.setAlignment(Element.ALIGN_CENTER);
            doc.add(pied);

            doc.close();
        } catch (DocumentException e) {
            throw new IOException("Erreur de generation du bilan", e);
        }
    }

    private Image camembert(long encaisse, long reste) {
        int l = 380, h = 220;
        BufferedImage img = new BufferedImage(l, h, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = img.createGraphics();
        try {
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING,
                RenderingHints.VALUE_ANTIALIAS_ON);
            g.setColor(Color.WHITE);
            g.fillRect(0, 0, l, h);

            long total = encaisse + reste;
            double cx = 110, cy = 110, r = 85;
            if (total <= 0) {
                g.setColor(GRIS_CLAIR);
                g.fill(new Arc2D.Double(cx - r, cy - r, r * 2, r * 2, 0, 360, Arc2D.PIE));
                g.setColor(GRIS);
                g.drawString("Aucune donnee", 60, 115);
            } else {
                double partEncaisse = 360.0 * encaisse / total;
                g.setColor(VERT);
                g.fill(new Arc2D.Double(cx - r, cy - r, r * 2, r * 2, 0, partEncaisse, Arc2D.PIE));
                g.setColor(GRIS_CLAIR);
                g.fill(new Arc2D.Double(cx - r, cy - r, r * 2, r * 2,
                    partEncaisse, 360 - partEncaisse, Arc2D.PIE));
                // Cerclage
                g.setColor(Color.WHITE);
                g.setStroke(new java.awt.BasicStroke(2f));
                g.draw(new Arc2D.Double(cx - r, cy - r, r * 2, r * 2, 0, partEncaisse, Arc2D.OPEN));
            }

            // Legende
            int x = 225;
            g.setColor(VERT);
            g.fillRect(x, 70, 14, 14);
            g.setColor(Color.BLACK);
            g.setFont(new java.awt.Font(java.awt.Font.SANS_SERIF, java.awt.Font.BOLD, 12));
            g.drawString("IR encaisse : " + fmt.format(encaisse) + " Ar", x + 22, 82);

            g.setColor(GRIS_CLAIR);
            g.fillRect(x, 105, 14, 14);
            g.setColor(Color.BLACK);
            g.setFont(new java.awt.Font(java.awt.Font.SANS_SERIF,
                java.awt.Font.PLAIN, 12));
            g.drawString("Reste a recouvrer : " + fmt.format(reste) + " Ar", x + 22, 117);
        } finally {
            g.dispose();
        }
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(img, "png", baos);
            return Image.getInstance(baos.toByteArray());
        } catch (Exception e) {
            return null;
        }
    }

    // ------------------------------------------------------------------
    // 3. Fiche de declaration
    // ------------------------------------------------------------------

    public void genererFicheDeclaration(HttpServletResponse response, DeclarationIR d)
            throws IOException {
        response.setContentType("application/pdf");
        response.setHeader("Content-Disposition",
            "attachment; filename=\"fiche-declaration-" + d.getIdDeclaration() + ".pdf\"");

        Document doc = new Document(PageSize.A4, 40, 40, 30, 30);
        try {
            PdfWriter writer = PdfWriter.getInstance(doc, response.getOutputStream());
            doc.open();
            entete(doc, writer);

            Paragraph titre = new Paragraph(
                "FICHE DE DECLARATION - EXERCICE " + d.getAnnee(), TITRE);
            titre.setAlignment(Element.ALIGN_CENTER);
            titre.setSpacingAfter(14);
            doc.add(titre);

            // Identite du contribuable
            Contribuable c = d.getContribuable();
            Paragraph sousTitre = new Paragraph("CONTRIBUABLE", SOUS_TITRE);
            sousTitre.setSpacingAfter(6);
            doc.add(sousTitre);

            PdfPTable identite = new PdfPTable(2);
            identite.setWidthPercentage(100);
            identite.setWidths(new float[]{1.3f, 2.4f});
            ligne(identite, "NIF", c != null ? c.getNif() : "-");
            ligne(identite, "Raison sociale", c != null ? c.getRaisonSociale() : "-");
            ligne(identite, "Dirigeant", c != null ? c.getNomDirigeant() : "-");
            ligne(identite, "Adresse", c != null ? c.getAdresse() : "-");
            ligne(identite, "Statut de la declaration", d.getStatut());
            doc.add(identite);

            doc.add(espace(14));

            // Calculs
            Paragraph sousTitre2 = new Paragraph("CALCUL DE L IMPOT", SOUS_TITRE);
            sousTitre2.setSpacingAfter(6);
            doc.add(sousTitre2);

            PdfPTable cal = new PdfPTable(2);
            cal.setWidthPercentage(100);
            cal.setWidths(new float[]{2.4f, 1.4f});
            ligneMontant(cal, "CA HT", val(d.getCaHt()));
            ligneMontant(cal, "Total charges deductibles", val(d.getTotalCharges()));
            ligneMontant(cal, "Resultat comptable", val(d.getResultatComptable()));
            ligneMontant(cal, "Total reintegrations", val(d.getTotalReintegrations()));
            ligneMontant(cal, "Total deductions", val(d.getTotalDeductions()));
            ligneMontant(cal, "Deficit impute", val(d.getDeficitImpute()));
            ligneMontant(cal, "Base imposable", val(d.getBaseImposable()));
            ligneMontant(cal, "IR brut ("
                + (d.getTauxIr() == null ? "20" : d.getTauxIr().stripTrailingZeros().toPlainString())
                + " %)", val(d.getIrBrut()));
            ligneMontant(cal, "Minimum de perception", val(d.getMinimumPerception()));
            ligneMontant(cal, "IR du", val(d.getIrDu()));
            ligneMontant(cal, "Penalites dues", val(d.getPenaliteDueAr()));
            ligneMontant(cal, "1er acompte N+1", val(d.getPremierAcompteAr()));
            ligneMontant(cal, "Acomptes verses", val(d.getAcomptesVerses()));
            ligneMontant(cal, "Solde a payer", val(d.getSoldeAPayer()));
            if (d.getCreditImpot() != null && d.getCreditImpot() > 0) {
                ligneMontant(cal, "Credit d impot", val(d.getCreditImpot()));
            }
            doc.add(cal);

            doc.add(espace(20));

            Paragraph pied = new Paragraph(
                "Fiche generee le " + LocalDate.now()
                    .format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                    + " - Gestion IR / Centre fiscal.", PETIT);
            pied.setAlignment(Element.ALIGN_CENTER);
            doc.add(pied);

            doc.close();
        } catch (DocumentException e) {
            throw new IOException("Erreur de generation de la fiche", e);
        }
    }

    // ------------------------------------------------------------------
    // 4. Statistiques (rapport existant)
    // ------------------------------------------------------------------

    public void genererStatistiques(HttpServletResponse response, java.util.Map<String, Object> stats)
            throws IOException {
        response.setContentType("application/pdf");
        response.setHeader("Content-Disposition",
            "attachment; filename=\"statistiques.pdf\"");

        Document doc = new Document(PageSize.A4);
        try {
            PdfWriter writer = PdfWriter.getInstance(doc, response.getOutputStream());
            doc.open();
            entete(doc, writer);

            Paragraph header = new Paragraph("RAPPORT STATISTIQUE", TITRE);
            header.setAlignment(Element.ALIGN_CENTER);
            header.setSpacingAfter(6);
            doc.add(header);

            Paragraph sous = new Paragraph("Synthese des donnees fiscales", SOUS_TITRE);
            sous.setAlignment(Element.ALIGN_CENTER);
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

            doc.add(espace(14));
            Paragraph sign = new Paragraph(
                "Genere le " + LocalDate.now() + " - Gestion IR / Centre fiscal.", PETIT);
            sign.setAlignment(Element.ALIGN_RIGHT);
            doc.add(sign);

            doc.close();
        } catch (DocumentException e) {
            throw new IOException("Erreur de generation des statistiques", e);
        }
    }

    // ------------------------------------------------------------------
    // Utilitaires de mise en page
    // ------------------------------------------------------------------

    private Paragraph espace(float points) {
        Paragraph p = new Paragraph(" ");
        p.setSpacingAfter(points);
        return p;
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

    private void ligneMontant(PdfPTable t, String label, long montant) {
        PdfPCell c1 = new PdfPCell(new Phrase(label, NORMAL));
        c1.setBorder(Rectangle.BOTTOM);
        c1.setPadding(8);

        PdfPCell c2 = new PdfPCell(new Phrase(
            (montant < 0 ? "-" : "") + fmt.format(Math.abs(montant)) + " Ar", NORMAL_GRAS));
        c2.setBorder(Rectangle.BOTTOM);
        c2.setPadding(8);
        c2.setHorizontalAlignment(Element.ALIGN_RIGHT);

        t.addCell(c1);
        t.addCell(c2);
    }

    private void ligneStat(PdfPTable t, String label, Object valeur) {
        PdfPCell c1 = new PdfPCell(new Phrase(label, NORMAL));
        c1.setPadding(8);
        c1.setBorder(Rectangle.BOTTOM);

        PdfPCell c2 = new PdfPCell(new Phrase(valeur == null ? "-" : valeur.toString(),
            new Font(Font.HELVETICA, 11, Font.BOLD)));
        c2.setPadding(8);
        c2.setHorizontalAlignment(Element.ALIGN_RIGHT);
        c2.setBorder(Rectangle.BOTTOM);

        t.addCell(c1);
        t.addCell(c2);
    }
}
