package mg.safidy.service;

import jakarta.servlet.http.HttpServletResponse;
import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.DataFormat;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.VerticalAlignment;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFCellStyle;
import org.apache.poi.xssf.usermodel.XSSFColor;
import org.apache.poi.xssf.usermodel.XSSFFont;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

@Service
public class ExcelExportService {

    public enum TypeColonne {
        TEXTE, MONTANT, DATE, ENTIER, BOOLEEN
    }

    public static class ColonneDef {
        public final String libelle;
        public final TypeColonne type;
        public final int largeurMin;

        public ColonneDef(String libelle, TypeColonne type, int largeurMin) {
            this.libelle = libelle;
            this.type = type;
            this.largeurMin = largeurMin;
        }

        public ColonneDef(String libelle, TypeColonne type) {
            this(libelle, type, 15);
        }
    }

    public void ecrire(HttpServletResponse response,
                        String nomFichier,
                        List<ColonneDef> colonnes,
                        List<List<Object>> lignes) throws IOException {

        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Donnees");

            XSSFCellStyle headerStyle = creerStyleEntete(wb);
            XSSFCellStyle lignePaire = creerStyleLigne(wb, IndexedColors.WHITE);
            XSSFCellStyle ligneImpaire = creerStyleLigne(wb, IndexedColors.GREY_25_PERCENT);
            XSSFCellStyle montantPaire = creerStyleMontant(wb, lignePaire);
            XSSFCellStyle montantImpaire = creerStyleMontant(wb, ligneImpaire);
            XSSFCellStyle datePaire = creerStyleCentre(wb, lignePaire);
            XSSFCellStyle dateImpaire = creerStyleCentre(wb, ligneImpaire);

            // Ligne d'entete
            Row head = sheet.createRow(0);
            head.setHeightInPoints(28);
            for (int i = 0; i < colonnes.size(); i++) {
                Cell c = head.createCell(i);
                c.setCellValue(colonnes.get(i).libelle);
                c.setCellStyle(headerStyle);
            }

            // Lignes de donnees
            int r = 1;
            for (List<Object> ligne : lignes) {
                boolean paire = (r % 2 == 1);
                Row row = sheet.createRow(r);
                row.setHeightInPoints(20);

                for (int i = 0; i < colonnes.size(); i++) {
                    Object v = i < ligne.size() ? ligne.get(i) : null;
                    ColonneDef col = colonnes.get(i);
                    Cell cell = row.createCell(i);

                    switch (col.type) {
                        case MONTANT:
                            if (v instanceof Number) {
                                cell.setCellValue(((Number) v).doubleValue());
                            } else if (v != null) {
                                try { cell.setCellValue(Double.parseDouble(v.toString())); }
                                catch (Exception e) { cell.setCellValue(v.toString()); }
                            } else {
                                cell.setCellValue(0);
                            }
                            cell.setCellStyle(paire ? montantPaire : montantImpaire);
                            break;

                        case DATE:
                            cell.setCellValue(formaterDate(v));
                            cell.setCellStyle(paire ? datePaire : dateImpaire);
                            break;

                        case ENTIER:
                            if (v instanceof Number) {
                                cell.setCellValue(((Number) v).longValue());
                            } else if (v != null) {
                                try { cell.setCellValue(Long.parseLong(v.toString())); }
                                catch (Exception e) { cell.setCellValue(v.toString()); }
                            } else {
                                cell.setCellValue(0);
                            }
                            cell.setCellStyle(paire ? lignePaire : ligneImpaire);
                            break;

                        case BOOLEEN:
                            boolean b = v != null && (
                                v instanceof Boolean ? (Boolean) v
                                : Boolean.parseBoolean(v.toString()));
                            cell.setCellValue(b ? "OUI" : "NON");
                            cell.setCellStyle(paire ? lignePaire : ligneImpaire);
                            break;

                        default:
                            cell.setCellValue(v == null ? "" : v.toString());
                            cell.setCellStyle(paire ? lignePaire : ligneImpaire);
                            break;
                    }
                }
                r++;
            }

            // Auto-size
            for (int i = 0; i < colonnes.size(); i++) {
                sheet.autoSizeColumn(i);
                int largeurMin = colonnes.get(i).largeurMin * 256;
                if (sheet.getColumnWidth(i) < largeurMin) {
                    sheet.setColumnWidth(i, largeurMin);
                }
                int largeurMax = 60 * 256;
                if (sheet.getColumnWidth(i) > largeurMax) {
                    sheet.setColumnWidth(i, largeurMax);
                }
            }

            // Freeze + filtre
            sheet.createFreezePane(0, 1);
            if (!colonnes.isEmpty()) {
                sheet.setAutoFilter(new CellRangeAddress(0, 0, 0, colonnes.size() - 1));
            }

            response.setContentType(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            response.setHeader("Content-Disposition",
                "attachment; filename=\"" + nomFichier + "\"");
            wb.write(response.getOutputStream());
        }
    }

    private XSSFCellStyle creerStyleEntete(XSSFWorkbook wb) {
        XSSFCellStyle style = wb.createCellStyle();
        byte[] rgbVert = new byte[]{(byte) 0x0d, (byte) 0x2f, (byte) 0x2a};
        style.setFillForegroundColor(new XSSFColor(rgbVert, null));
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        appliquerBordures(style, IndexedColors.GREY_50_PERCENT);

        XSSFFont font = wb.createFont();
        font.setBold(true);
        font.setColor(new XSSFColor(new byte[]{(byte) 0xff, (byte) 0xff, (byte) 0xff}, null));
        font.setFontHeightInPoints((short) 11);
        style.setFont(font);
        return style;
    }

    private XSSFCellStyle creerStyleLigne(XSSFWorkbook wb, IndexedColors fond) {
        XSSFCellStyle style = wb.createCellStyle();
        style.setFillForegroundColor(fond.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        appliquerBordures(style, IndexedColors.GREY_25_PERCENT);
        return style;
    }

    private XSSFCellStyle creerStyleMontant(XSSFWorkbook wb, XSSFCellStyle base) {
        XSSFCellStyle style = wb.createCellStyle();
        style.cloneStyleFrom(base);
        style.setAlignment(HorizontalAlignment.RIGHT);
        DataFormat fmt = wb.createDataFormat();
        style.setDataFormat(fmt.getFormat("#,##0 \"Ar\""));
        return style;
    }

    private XSSFCellStyle creerStyleCentre(XSSFWorkbook wb, XSSFCellStyle base) {
        XSSFCellStyle style = wb.createCellStyle();
        style.cloneStyleFrom(base);
        style.setAlignment(HorizontalAlignment.CENTER);
        return style;
    }

    private void appliquerBordures(CellStyle style, IndexedColors couleur) {
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setBottomBorderColor(couleur.getIndex());
        style.setTopBorderColor(couleur.getIndex());
        style.setLeftBorderColor(couleur.getIndex());
        style.setRightBorderColor(couleur.getIndex());
    }

    private String formaterDate(Object v) {
        if (v == null) return "";
        String s = v.toString();
        if (s.matches("\\d{4}-\\d{2}-\\d{2}.*")) {
            try {
                LocalDate d = LocalDate.parse(s.substring(0, 10));
                return String.format("%02d/%02d/%d",
                    d.getDayOfMonth(), d.getMonthValue(), d.getYear());
            } catch (Exception e) {
                return s;
            }
        }
        return s;
    }
}
