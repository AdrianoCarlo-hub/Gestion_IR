-- =====================================================
-- Safidy - 11_migration_penalites.sql
-- =====================================================
-- Migration du module PENALITES.
--   * AMENDE_DEPOT   : amende fixe selon le CA (depot tardif)
--   * MAJORATION     : majoration de retard de paiement (selon taille + mois)
--   * AMENDE_SPECIFIQUE : infractions specifiques (80 %, 40 %, 0,5 % CA)
-- Idempotent : peut etre relance sans risque.
-- A executer APRES 05_insert_parameters.sql.
-- =====================================================

-- 1. Nouvelles colonnes
ALTER TABLE PENALITE ADD COLUMN IF NOT EXISTS motif VARCHAR(60);
ALTER TABLE PENALITE ADD COLUMN IF NOT EXISTS base_calcul_ar BIGINT;
ALTER TABLE PENALITE ADD COLUMN IF NOT EXISTS article_ref VARCHAR(60);
ALTER TABLE PENALITE ADD COLUMN IF NOT EXISTS date_limite DATE;
ALTER TABLE PENALITE ADD COLUMN IF NOT EXISTS date_regularisation DATE;
ALTER TABLE PENALITE ADD COLUMN IF NOT EXISTS motif_annulation VARCHAR(200);

-- 2. Types
ALTER TABLE PENALITE DROP CONSTRAINT IF EXISTS chk_penalite_type;
ALTER TABLE PENALITE ADD CONSTRAINT chk_penalite_type
    CHECK (type IN ('AMENDE_DEPOT', 'MAJORATION', 'INTERET_RETARD',
                    'AMENDE_SPECIFIQUE', 'MAJORATION_80', 'MAJORATION_40'));

-- 3. Statuts
ALTER TABLE PENALITE DROP CONSTRAINT IF EXISTS chk_penalite_statut;
ALTER TABLE PENALITE ADD CONSTRAINT chk_penalite_statut
    CHECK (statut IN ('DUE', 'PAYEE', 'ANNULEE', 'EN_DEMANDE_REMISE'));

CREATE INDEX IF NOT EXISTS idx_penalite_motif ON PENALITE(motif);
CREATE INDEX IF NOT EXISTS idx_penalite_statut ON PENALITE(statut);

-- 4. Parametres fiscaux
INSERT INTO PARAMETRE_FISCAL (code, valeur, date_effet, description) VALUES
('AMENDE_DEPOT_CA_400M',       200000, CURRENT_DATE, 'Amende depot tardif - CA >= 400M'),
('AMENDE_DEPOT_CA_200M',       100000, CURRENT_DATE, 'Amende depot tardif - CA 200-400M'),
('AMENDE_DEPOT_CA_50M',         50000, CURRENT_DATE, 'Amende depot tardif - CA 50-200M'),
('AMENDE_DEPOT_CA_INF',         20000, CURRENT_DATE, 'Amende depot tardif - CA < 50M'),
('MAJORATION_GRANDE_1ER',           3, CURRENT_DATE, 'Majoration 1er mois - grande entreprise'),
('MAJORATION_MOYENNE_1ER',          2, CURRENT_DATE, 'Majoration 1er mois - moyenne entreprise'),
('MAJORATION_PETITE_1ER',           1, CURRENT_DATE, 'Majoration 1er mois - petite entreprise'),
('MAJORATION_MOIS_SUIV',            1, CURRENT_DATE, 'Majoration mois suivants'),
('MAJORATION_PLANCHER',         10000, CURRENT_DATE, 'Plancher legal majoration'),
('MAJORATION_ABUS_ACOMPTE',        80, CURRENT_DATE, 'Amende suspension abusive acompte (%)'),
('MAJORATION_INSUFFISANCE',        40, CURRENT_DATE, 'Majoration insuffisance declarative (%)')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- Fin : module PENALITES migre
-- =====================================================
