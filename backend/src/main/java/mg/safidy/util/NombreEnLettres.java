package mg.safidy.util;

/**
 * Conversion des nombres en toutes lettres (francais).
 * Utilise pour les montants en Ariary sur les quittances et documents PDF.
 */
public final class NombreEnLettres {

    private static final String[] UNITES = {
        "zero", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf",
        "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize",
        "dix-sept", "dix-huit", "dix-neuf"
    };

    private static final String[] DIZAINES = {
        "", "", "vingt", "trente", "quarante", "cinquante", "soixante",
        "soixante-dix", "quatre-vingt", "quatre-vingt-dix"
    };

    private NombreEnLettres() {
    }

    public static String consommer(long nombre) {
        if (nombre == 0) {
            return "zero";
        }
        if (nombre < 0) {
            return "moins " + consommer(-nombre);
        }

        StringBuilder sb = new StringBuilder();
        long milliards = nombre / 1_000_000_000L;
        long millions = (nombre / 1_000_000L) % 1_000_000L;
        long milliers = (nombre / 1000L) % 1000L;
        long reste = nombre % 1000L;

        if (milliards > 0) {
            sb.append(consommer(milliards)).append(" milliard");
            if (milliards > 1) {
                sb.append('s');
            }
        }
        if (millions > 0) {
            if (sb.length() > 0) {
                sb.append(' ');
            }
            sb.append(consommer(millions)).append(" million");
            if (millions > 1) {
                sb.append('s');
            }
        }
        if (milliers > 0) {
            if (sb.length() > 0) {
                sb.append(' ');
            }
            if (milliers > 1) {
                // "cent" reste invariable devant "mille"
                String mots = sousCentaines((int) milliers);
                if (mots.endsWith("cents")) {
                    mots = mots.substring(0, mots.length() - 1);
                }
                sb.append(mots).append(' ');
            }
            sb.append("mille");
        }
        if (reste > 0) {
            if (sb.length() > 0) {
                sb.append(' ');
            }
            sb.append(sousCentaines((int) reste));
        }
        return sb.toString();
    }

    /** 0 a 999 (0 renvoie la chaine vide). */
    static String sousCentaines(int n) {
        if (n <= 0) {
            return "";
        }
        int centaines = n / 100;
        int reste = n % 100;
        StringBuilder sb = new StringBuilder();
        if (centaines > 0) {
            sb.append(UNITES[centaines]).append(" cent");
            if (centaines > 1 && reste == 0) {
                sb.append('s');
            }
        }
        if (reste > 0) {
            if (centaines > 0) {
                sb.append(' ');
            }
            sb.append(sousDix(reste));
        }
        return sb.toString();
    }

    /** 1 a 99. */
    static String sousDix(int n) {
        if (n < 20) {
            return UNITES[n];
        }
        int dizaine = n / 10;
        int unite = n % 10;

        if (dizaine == 7 || dizaine == 9) {
            String base = dizaine == 7 ? "soixante" : "quatre-vingt";
            int uniteComplete = 10 + unite;
            if (uniteComplete == 11) {
                return base + " et onze";
            }
            return base + "-" + UNITES[uniteComplete];
        }
        if (unite == 0) {
            return dizaine == 8 ? "quatre-vingts" : DIZAINES[dizaine];
        }
        if (unite == 1 && dizaine != 8) {
            return DIZAINES[dizaine] + " et un";
        }
        return DIZAINES[dizaine] + "-" + UNITES[unite];
    }
}
