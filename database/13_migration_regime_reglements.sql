-- =====================================================
-- Safidy - 13_migration_regime_reglements.sql
-- =====================================================
-- Mise a jour majeure :
--   1. CONTRIBUABLE : regime unique REEL_OBLIGATOIRE
--      (REEL_OPTION supprime -> plus d'impact du taux 10 % Sante/Education)
--   2. ACOMPTE : date de paiement du 1er / 2eme acompte
--   3. PENALITE : statuts DUE / PAYEE + type INTERET_RETARD_ACOMPTE
--   4. PAIEMENT : type de reglement TOUS / 2EME_ACOMPTE
--   5. DECLARATION_IR : ajustements manuels conserves, resultats
--      du nouveau calcul (penalite reinegree + 1er acompte N+1)
--   6. Parametres : amende forfaitaire de depot 100 000 a 200 000 Ar
-- Idempotent : peut etre relance sans risque.
-- A executer APRES 12_migration_suspensions.sql.
-- =====================================================

-- =====================================================
-- 1. REGIME UNIQUE : REEL_OBLIGATOIRE
-- =====================================================
UPDATE CONTRIBUABLE
   SET regime = 'REEL_OBLIGATOIRE'
 WHERE regime IS NULL OR regime <> 'REEL_OBLIGATOIRE';

ALTER TABLE CONTRIBUABLE DROP CONSTRAINT IF EXISTS chk_contrib_regime;
ALTER TABLE CONTRIBUABLE ADD CONSTRAINT chk_contrib_regime
    CHECK (regime IN ('REEL_OBLIGATOIRE'));

-- Le taux sectoriel (ex. 10 % Sante/Education) n'est plus applique :
-- le taux d'IR est toujours le taux de droit commun (TAUX_IR = 20 %).

-- =====================================================
-- 2. ACOMPTE : date de paiement (1er et 2eme acompte)
-- =====================================================
ALTER TABLE ACOMPTE ADD COLUMN IF NOT EXISTS date_paiement DATE;

COMMENT ON COLUMN ACOMPTE.date_paiement IS
    'Date de paiement effectif (numero 1 = 1er acompte, numero 2 = 2eme acompte)';

-- =====================================================
-- 3. PENALITE : statuts et types
-- =====================================================
ALTER TABLE PENALITE DROP CONSTRAINT IF EXISTS chk_penalite_type;
ALTER TABLE PENALITE ADD CONSTRAINT chk_penalite_type
    CHECK (type IN ('AMENDE_DEPOT', 'INTERET_RETARD', 'MAJORATION',
                    'AMENDE_SPECIFIQUE', 'MAJORATION_80', 'MAJORATION_40',
                    'INTERET_RETARD_ACOMPTE'));

ALTER TABLE PENALITE DROP CONSTRAINT IF EXISTS chk_penalite_statut;
ALTER TABLE PENALITE ADD CONSTRAINT chk_penalite_statut
    CHECK (statut IN ('DUE', 'PAYEE', 'ANNULEE', 'EN_DEMANDE_REMISE'));

-- =====================================================
-- 4. PAIEMENT : type de reglement
-- =====================================================
ALTER TABLE PAIEMENT ADD COLUMN IF NOT EXISTS type_reglement VARCHAR(20);
UPDATE PAIEMENT SET type_reglement = 'TOUS' WHERE type_reglement IS NULL;
ALTER TABLE PAIEMENT ALTER COLUMN type_reglement SET DEFAULT 'TOUS';
ALTER TABLE PAIEMENT ALTER COLUMN type_reglement SET NOT NULL;

ALTER TABLE PAIEMENT DROP CONSTRAINT IF EXISTS chk_paiement_type_reglement;
ALTER TABLE PAIEMENT ADD CONSTRAINT chk_paiement_type_reglement
    CHECK (type_reglement IN ('TOUS', '2EME_ACOMPTE'));

CREATE INDEX IF NOT EXISTS idx_paiement_type_reglement ON PAIEMENT(type_reglement);

-- =====================================================
-- 5. DECLARATION_IR : nouveau calcul
-- =====================================================
-- 5.1 Anciennes saisies manuelles conservees (le formulaire d'ajustements
--     disparaissant de l'UI, elles ne sont plus modifiables).
ALTER TABLE DECLARATION_IR ADD COLUMN IF NOT EXISTS reintegrations_manuelles BIGINT NOT NULL DEFAULT 0;

UPDATE DECLARATION_IR
   SET reintegrations_manuelles = total_reintegrations
 WHERE reintegrations_manuelles = 0
   AND total_reintegrations > 0;

-- 5.2 Penalite due injectee dans les reintegrations (double comptage voulu :
--     elle augmente la base imposable ET s'ajoute au montant a payer).
ALTER TABLE DECLARATION_IR ADD COLUMN IF NOT EXISTS penalite_due_ar BIGINT NOT NULL DEFAULT 0;

-- 5.3 1er acompte de l'annee N+1 = 50 % de l'IR du de l'annee N.
ALTER TABLE DECLARATION_IR ADD COLUMN IF NOT EXISTS premier_acompte_ar BIGINT NOT NULL DEFAULT 0;

COMMENT ON COLUMN DECLARATION_IR.solde_a_payer IS
    'SOLDE TOTAL A PAYER = IR du + penalites dues + 1er acompte N+1 - acomptes verses';
COMMENT ON COLUMN DECLARATION_IR.reintegrations_manuelles IS
    'Reintegrations saisies avant la suppression du formulaire d''ajustements';
COMMENT ON COLUMN DECLARATION_IR.penalite_due_ar IS
    'Penalites dues (DUE) injectees dans les reintegrations du calcul';
COMMENT ON COLUMN DECLARATION_IR.premier_acompte_ar IS
    '1er acompte de l''annee suivante (50 % de l''IR du)';

-- =====================================================
-- 6. Parametres : amende forfaitaire de depot 100 000 a 200 000 Ar
-- =====================================================
UPDATE PARAMETRE_FISCAL SET valeur = 200000 WHERE code = 'AMENDE_DEPOT_CA_400M';
UPDATE PARAMETRE_FISCAL SET valeur = 150000 WHERE code = 'AMENDE_DEPOT_CA_200M';
UPDATE PARAMETRE_FISCAL SET valeur = 120000 WHERE code = 'AMENDE_DEPOT_CA_50M';
UPDATE PARAMETRE_FISCAL SET valeur = 100000 WHERE code = 'AMENDE_DEPOT_CA_INF';

INSERT INTO PARAMETRE_FISCAL (code, valeur, date_effet, description) VALUES
('AMENDE_DEPOT_CA_400M', 200000, CURRENT_DATE, 'Amende depot tardif - CA >= 400M'),
('AMENDE_DEPOT_CA_200M', 150000, CURRENT_DATE, 'Amende depot tardif - CA 200-400M'),
('AMENDE_DEPOT_CA_50M',  120000, CURRENT_DATE, 'Amende depot tardif - CA 50-200M'),
('AMENDE_DEPOT_CA_INF',  100000, CURRENT_DATE, 'Amende depot tardif - CA < 50M'),
('TAUX_INTERET_RETARD',        1, CURRENT_DATE, 'Interets de retard - 1 % par mois commence')
ON CONFLICT (code) DO NOTHING;

-- Duree de report des deficits (5 ans) : deja present via 05_insert_parameters.sql
INSERT INTO PARAMETRE_FISCAL (code, valeur, date_effet, description) VALUES
('DUREE_REPORT_DEFICIT', 5, CURRENT_DATE, 'Duree de report du deficit (ans)')
ON CONFLICT (code) DO NOTHING;
