package mg.safidy.service;

import jakarta.servlet.http.HttpServletResponse;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;

@Service
public class ExcelExportService {

    public void ecrire(HttpServletResponse response,
                        String nomFichier,
                        List<String> entetes,
                        List<List<Object>> lignes) throws IOException {

        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Donnees");

            // Style entete
            CellStyle headerStyle = wb.createCellStyle();
            Font headerFont = wb.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.GREEN.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerFont.setColor(IndexedColors.WHITE.getIndex());

            Row headRow = sheet.createRow(0);
            for (int i = 0; i < entetes.size(); i++) {
                Cell c = headRow.createCell(i);
                c.setCellValue(entetes.get(i));
                c.setCellStyle(headerStyle);
            }

            int r = 1;
            for (List<Object> ligne : lignes) {
                Row row = sheet.createRow(r++);
                for (int i = 0; i < ligne.size(); i++) {
                    Object v = ligne.get(i);
                    Cell cell = row.createCell(i);
                    if (v == null) {
                        cell.setCellValue("");
                    } else if (v instanceof Number) {
                        cell.setCellValue(((Number) v).doubleValue());
                    } else {
                        cell.setCellValue(v.toString());
                    }
                }
            }

            for (int i = 0; i < entetes.size(); i++) {
                sheet.autoSizeColumn(i);
            }

            response.setContentType(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            response.setHeader("Content-Disposition",
                "attachment; filename=\"" + nomFichier + "\"");
            wb.write(response.getOutputStream());
        }
    }
}
