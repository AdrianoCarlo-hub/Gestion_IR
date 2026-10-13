-- =====================================================
-- Safidy - 06_insert_test_data.sql
-- =====================================================
-- Donnees de test pour le developpement.
-- A executer APRES 05_insert_parameters.sql.
--
-- Mot de passe de tous les agents de test : admin1234
-- (hash BCrypt pre-calcule)
-- =====================================================

-- ---------------------------------------------
-- Agents de test
-- Hash BCrypt de "admin1234"
-- ---------------------------------------------
INSERT INTO AGENT (matricule, nom, prenom, email, mot_de_passe_hash, role, statut, id_centre)
VALUES
('ADMIN001', 'Rakoto',  'Admin',   'admin@safidy.mg',   '$2a$10$5DoUGb3AstAKVrZBuNJFLenGR2RbmOhz0uFm45RXshwKWvuPm0JkG', 'ADMIN',       'ACTIF', 1),
('RESP001',  'Rabe',    'Sophie',  'resp@safidy.mg',    '$2a$10$5DoUGb3AstAKVrZBuNJFLenGR2RbmOhz0uFm45RXshwKWvuPm0JkG', 'RESPONSABLE', 'ACTIF', 1),
('AGT001',   'Andry',   'Rado',    'agent@safidy.mg',   '$2a$10$5DoUGb3AstAKVrZBuNJFLenGR2RbmOhz0uFm45RXshwKWvuPm0JkG', 'AGENT',       'ACTIF', 1);

-- ---------------------------------------------
-- Contribuables de test
-- ---------------------------------------------
INSERT INTO CONTRIBUABLE
(nif, stat, raison_sociale, forme_juridique, nom_dirigeant, cin_dirigeant,
 adresse, telephone, email, id_secteur, regime, date_immatriculation,
 mois_cloture, statut, id_centre, id_agent)
VALUES
('4001234567', '12345678901234567', 'Usine Tsara SARL',   'SARL',
 'Rakoto Jean', '101234567890', 'Lot II M 45 Antananarivo', '0341234567',
 'contact@tsara.mg', (SELECT id_secteur FROM SECTEUR_ACTIVITE WHERE code='INDUSTRIEL'),
 'REEL_OBLIGATOIRE', '2020-01-15', 12, 'ACTIF', 1, 3),

('4009876543', NULL,               'Tsara Transport',    'EI',
 'Rasoa Marie', '201234567890', 'Analakely Antananarivo', '0331234567',
 'contact@tsaratransport.mg', (SELECT id_secteur FROM SECTEUR_ACTIVITE WHERE code='SERVICES'),
 'REEL_OPTION', '2022-03-10', 12, 'ACTIF', 1, 3),

('3005551234', NULL,               'Hotel Tsara Soa',    'SARL',
 'Randria Paul', '301234567890', 'Ivato Antananarivo', '0321234567',
 'info@tsarasoa.mg', (SELECT id_secteur FROM SECTEUR_ACTIVITE WHERE code='HOTELIER'),
 'REEL_OPTION', '2021-06-01', 12, 'ACTIF', 1, 3),

('4007771111', NULL,               'Tsara Distribution', 'SARL',
 'Ravaka Hery', '401234567890', 'Ambohipo Antananarivo', '0341234567',
 NULL, (SELECT id_secteur FROM SECTEUR_ACTIVITE WHERE code='COMMERCE'),
 'REEL_OBLIGATOIRE', '2019-11-20', 12, 'CESSE', 1, 3);

-- =====================================================
-- Fin : donnees de test inserees
-- =====================================================
