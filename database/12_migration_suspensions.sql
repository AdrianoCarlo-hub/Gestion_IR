-- =====================================================
-- Safidy - 12_migration_suspensions.sql
-- =====================================================
-- Migration du module ARRET / REPRISE d'activite.
--   * VEILLEUSE : arret temporaire (mise en veilleuse)
--   * CESSATION : cessation definitive -> RADIE
--   * REPRISE   : reprise d'activite
-- Idempotent : peut etre relance sans risque.
-- A executer APRES 05_insert_parameters.sql.
-- =====================================================

-- 1. Nouvelles colonnes
ALTER TABLE SUSPENSION_ACTIVITE ADD COLUMN IF NOT EXISTS type_evenement VARCHAR(20);
ALTER TABLE SUSPENSION_ACTIVITE ADD COLUMN IF NOT EXISTS date_limite_declaration DATE;
ALTER TABLE SUSPENSION_ACTIVITE ADD COLUMN IF NOT EXISTS justificatif_ref VARCHAR(60);
ALTER TABLE SUSPENSION_ACTIVITE ADD COLUMN IF NOT EXISTS carte_fiscale_restituee BOOLEAN DEFAULT FALSE;
ALTER TABLE SUSPENSION_ACTIVITE ADD COLUMN IF NOT EXISTS impact_minimum_prorata BIGINT;
ALTER TABLE SUSPENSION_ACTIVITE ADD COLUMN IF NOT EXISTS impact_acompte_suspendu BIGINT;
ALTER TABLE SUSPENSION_ACTIVITE ADD COLUMN IF NOT EXISTS impact_credit_impot BIGINT;
ALTER TABLE SUSPENSION_ACTIVITE ADD COLUMN IF NOT EXISTS attestation_radiation_numero VARCHAR(40);

-- 2. Motifs (ajout REORGANISATION)
ALTER TABLE SUSPENSION_ACTIVITE DROP CONSTRAINT IF EXISTS chk_susp_motif;
ALTER TABLE SUSPENSION_ACTIVITE ADD CONSTRAINT chk_susp_motif
    CHECK (motif IN ('MANQUE_ACTIVITE', 'TRAVAUX', 'SAISON',
                     'DIFFICULTE_FINANCIERE', 'REORGANISATION', 'AUTRE'));

-- 3. Type d'evenement
ALTER TABLE SUSPENSION_ACTIVITE DROP CONSTRAINT IF EXISTS chk_susp_type;
ALTER TABLE SUSPENSION_ACTIVITE ADD CONSTRAINT chk_susp_type
    CHECK (type_evenement IS NULL OR type_evenement IN ('VEILLEUSE', 'CESSATION', 'REPRISE'));

CREATE INDEX IF NOT EXISTS idx_susp_type ON SUSPENSION_ACTIVITE(type_evenement);

-- 4. Parametres fiscaux
INSERT INTO PARAMETRE_FISCAL (code, valeur, date_effet, description) VALUES
('DELAI_DECLARATION_ARRET',       20, CURRENT_DATE, 'Delai declaration arret temporaire (jours)'),
('DELAI_DECLARATION_REPRISE',     20, CURRENT_DATE, 'Delai declaration reprise (jours)'),
('DELAI_DECLARATION_CESSATION',   10, CURRENT_DATE, 'Delai declaration cessation definitive (jours)'),
('AMENDE_VEILLEUSE_FICTIVE',      40, CURRENT_DATE, 'Amende veilleuse fictive (%)')
ON CONFLICT (code) DO NOTHING;

-- 5. Nouveau statut contribuable : VEILLEUSE
ALTER TABLE CONTRIBUABLE DROP CONSTRAINT IF EXISTS chk_contrib_statut;
ALTER TABLE CONTRIBUABLE ADD CONSTRAINT chk_contrib_statut
    CHECK (statut IN ('ACTIF', 'VEILLEUSE', 'SUSPENDU', 'CESSE', 'RADIE'));

-- =====================================================
-- Fin : module ARRET/REPRISE migre
-- =====================================================
