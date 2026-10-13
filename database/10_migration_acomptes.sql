-- =====================================================
-- Safidy - 10_migration_acomptes.sql
-- =====================================================
-- Migration du module ACOMPTES.
--   3 types : CREATION (debut d'activite), PROVISIONNEL (2 x 50 %),
--             DOUANE (retenue 2 % de la valeur CAF).
-- Idempotent : peut etre relance sans risque.
-- A executer APRES 05_insert_parameters.sql (et 09_add_taux_ir.sql).
-- =====================================================

-- 1. Nouvelles colonnes
ALTER TABLE ACOMPTE ADD COLUMN IF NOT EXISTS type_acompte VARCHAR(20);
UPDATE ACOMPTE SET type_acompte = 'PROVISIONNEL' WHERE type_acompte IS NULL;
ALTER TABLE ACOMPTE ALTER COLUMN type_acompte SET DEFAULT 'PROVISIONNEL';
ALTER TABLE ACOMPTE ALTER COLUMN type_acompte SET NOT NULL;

ALTER TABLE ACOMPTE ADD COLUMN IF NOT EXISTS reference_douane VARCHAR(40);

-- 2. Elargir numero : les acomptes CREATION et DOUANE ne sont pas limitees a 1/2
ALTER TABLE ACOMPTE DROP CONSTRAINT IF EXISTS chk_acompte_numero;
ALTER TABLE ACOMPTE ADD CONSTRAINT chk_acompte_numero
    CHECK (numero >= 0 AND numero <= 99);

-- 3. Unicite incluant le type (un contribuable peut avoir plusieurs DOUANE par annee)
ALTER TABLE ACOMPTE DROP CONSTRAINT IF EXISTS uq_acompte_contrib_annee_num;
CREATE UNIQUE INDEX IF NOT EXISTS uq_acompte_contrib_annee_type_num
    ON ACOMPTE(id_contribuable, annee, type_acompte, numero);

-- 4. Contrainte sur le type
ALTER TABLE ACOMPTE DROP CONSTRAINT IF EXISTS chk_acompte_type;
ALTER TABLE ACOMPTE ADD CONSTRAINT chk_acompte_type
    CHECK (type_acompte IN ('CREATION', 'PROVISIONNEL', 'DOUANE'));

CREATE INDEX IF NOT EXISTS idx_acompte_type ON ACOMPTE(type_acompte);

-- 5. Parametres fiscaux
INSERT INTO PARAMETRE_FISCAL (code, valeur, date_effet, description) VALUES
('ACOMPTE_CREATION_EXPORT',      100000, CURRENT_DATE, 'Acompte creation - exportateurs'),
('ACOMPTE_CREATION_SANTE',       200000, CURRENT_DATE, 'Acompte creation - sante/education'),
('ACOMPTE_CREATION_PRIORITAIRE', 500000, CURRENT_DATE, 'Acompte creation - secteurs prioritaires'),
('ACOMPTE_CREATION_GENERAL',    1000000, CURRENT_DATE, 'Acompte creation - autres secteurs'),
('TAUX_DOUANE_AIRS',                  2, CURRENT_DATE, 'Taux retenue douane AIRS (%)')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- Fin : module ACOMPTES migre
-- =====================================================
