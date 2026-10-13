-- =====================================================
-- Safidy - 09_add_taux_ir.sql
-- =====================================================
-- Migration : taux d'IR propre a certains secteurs.
--   * SECTEUR_ACTIVITE.taux_ir : NULL = droit commun (parametre TAUX_IR).
--     Un taux different (ex. Sante/Education = 10 %) est une option
--     applicable uniquement au regime REEL_OPTION.
--   * DECLARATION_IR.taux_ir : taux effectivement applique (memorise).
-- Idempotent : peut etre relance sans risque.
-- A executer APRES 05_insert_parameters.sql.
-- =====================================================

ALTER TABLE SECTEUR_ACTIVITE ADD COLUMN IF NOT EXISTS taux_ir NUMERIC(5,2);
UPDATE SECTEUR_ACTIVITE SET taux_ir = 10.00 WHERE code IN ('SANTE', 'EDUCATION');

ALTER TABLE DECLARATION_IR ADD COLUMN IF NOT EXISTS taux_ir NUMERIC(5,2) NOT NULL DEFAULT 20;
UPDATE DECLARATION_IR SET taux_ir = 20 WHERE taux_ir IS NULL;

-- =====================================================
-- Fin : taux d'IR par secteur ajoute
-- =====================================================
