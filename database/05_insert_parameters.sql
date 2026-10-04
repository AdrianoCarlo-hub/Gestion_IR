-- =====================================================
-- Safidy - 05_insert_parameters.sql
-- =====================================================
-- Insertion des donnees de reference :
--   * Centre fiscal par defaut
--   * Secteurs d'activite
--   * Parametres fiscaux
-- A executer APRES 04_create_indexes.sql.
-- =====================================================

-- ---------------------------------------------
-- Centre fiscal par defaut
-- ---------------------------------------------
INSERT INTO CENTRE_FISCAL (code, nom, region, adresse, telephone) VALUES
('CF-ANT-01', 'Centre Fiscal d''Antananarivo', 'Analamanga',
 'Antananarivo', '020 22 000 00');

-- ---------------------------------------------
-- Secteurs d'activite
-- ---------------------------------------------
INSERT INTO SECTEUR_ACTIVITE (code, libelle, categorie, min_fixe_ar, min_pct_ca) VALUES
('AGRICOLE',   'Agricole',              'PRIORITAIRE', 500000,  0.0100),
('ARTISANAL',  'Artisanal',             'PRIORITAIRE', 500000,  0.0100),
('INDUSTRIEL', 'Industriel',            'PRIORITAIRE', 500000,  0.0100),
('MINIER',     'Minier',                'PRIORITAIRE', 500000,  0.0100),
('HOTELIER',   'Hotelier',              'PRIORITAIRE', 500000,  0.0100),
('TOURISTIQUE','Touristique',           'PRIORITAIRE', 500000,  0.0100),
('COMMERCE',   'Commerce',              'GENERAL',     1000000, 0.0100),
('SERVICES',   'Services',              'GENERAL',     1000000, 0.0100),
('CARBURANT',  'Vente de carburants',   'CARBURANT',   0,       0.0020),
('SANTE',      'Sante',                 'SANTE_EDUC',  200000,  0.0020),
('EDUCATION',  'Education',             'SANTE_EDUC',  200000,  0.0020);

-- ---------------------------------------------
-- Parametres fiscaux initiaux
-- ---------------------------------------------
INSERT INTO PARAMETRE_FISCAL (code, valeur, date_effet, description) VALUES
('TAUX_IR',              20,           '2026-01-01', 'Taux de l''impot sur le revenu (%)'),
('SEUIL_REEL',           400000000,    '2026-01-01', 'Seuil du regime reel (Ar)'),
('DUREE_REPORT_DEFICIT', 5,            '2026-01-01', 'Nombre d''annees de report du deficit'),
('TAUX_ACOMPTE',         50,           '2026-01-01', 'Pourcentage de chaque acompte'),
('TAUX_INTERET_RETARD',  1,            '2026-01-01', 'Taux d''interet de retard (% par mois)'),
('AMENDE_DEPOT_TARDIF',  100000,       '2026-01-01', 'Amende forfaitaire pour depot tardif (Ar)');

-- =====================================================
-- Fin : donnees de reference inserees
-- =====================================================
