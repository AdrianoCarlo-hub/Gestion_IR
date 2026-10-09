-- =====================================================
-- Safidy - 08_migration_libelle.sql
-- =====================================================
-- Retire le champ "libelle" de la table ligne_charge
-- et ajoute "categorie_libre" (si categorie = AUTRE)
-- =====================================================

-- Retirer libelle si present
ALTER TABLE ligne_charge DROP COLUMN IF EXISTS libelle;

-- Ajouter categorie_libre si absent
ALTER TABLE ligne_charge ADD COLUMN IF NOT EXISTS categorie_libre VARCHAR(50);

-- Verification
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'ligne_charge'
ORDER BY ordinal_position;
