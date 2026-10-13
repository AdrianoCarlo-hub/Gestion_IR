-- =====================================================
-- Safidy - 08_seed_complet.sql
-- =====================================================
-- Jeu de donnees COMPLET et COHERENT pour tester tous les cas.
-- Remplace TOUTES les donnees transactionnelles.
-- Les donnees de reference (secteurs, parametres, centre) sont conservees.
-- =====================================================

-- ---------------------------------------------
-- 1. NETTOYAGE
-- ---------------------------------------------
DELETE FROM JOURNAL_AUDIT;
DELETE FROM SUSPENSION_ACTIVITE;
DELETE FROM PENALITE;
DELETE FROM PAIEMENT;
DELETE FROM ACOMPTE;
DELETE FROM UTILISATION_DEFICIT;
DELETE FROM DEFICIT;
DELETE FROM AJUSTEMENT_FISCAL;
DELETE FROM LIGNE_CHARGE;
DELETE FROM DECLARATION_IR;
DELETE FROM CONTRIBUABLE;
DELETE FROM AGENT;

-- Reinitialiser les sequences
ALTER SEQUENCE IF EXISTS agent_id_agent_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS contribuable_id_contribuable_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS declaration_ir_id_declaration_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS ligne_charge_id_ligne_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS ajustement_fiscal_id_ajustement_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS deficit_id_deficit_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS utilisation_deficit_id_utilisation_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS acompte_id_acompte_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS paiement_id_paiement_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS penalite_id_penalite_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS suspension_activite_id_suspension_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS journal_audit_id_log_seq RESTART WITH 1;

-- ---------------------------------------------
-- 2. AGENTS (5)
-- Hash BCrypt de "admin1234"
-- ---------------------------------------------
INSERT INTO AGENT (matricule, nom, prenom, email, mot_de_passe_hash, role, statut, tentatives_echec, id_centre) VALUES
('ADMIN001', 'Rakoto',  'Admin',  'admin@safidy.mg',  '$2a$10$5DoUGb3AstAKVrZBuNJFLenGR2RbmOhz0uFm45RXshwKWvuPm0JkG', 'ADMIN',       'ACTIF', 0, 1),
('RESP001',  'Rabe',    'Sophie', 'resp@safidy.mg',   '$2a$10$5DoUGb3AstAKVrZBuNJFLenGR2RbmOhz0uFm45RXshwKWvuPm0JkG', 'RESPONSABLE', 'ACTIF', 0, 1),
('RESP002',  'Randria', 'Paul',   'resp2@safidy.mg',  '$2a$10$5DoUGb3AstAKVrZBuNJFLenGR2RbmOhz0uFm45RXshwKWvuPm0JkG', 'RESPONSABLE', 'ACTIF', 0, 1),
('AGT001',   'Andry',   'Rado',   'agent@safidy.mg',  '$2a$10$5DoUGb3AstAKVrZBuNJFLenGR2RbmOhz0uFm45RXshwKWvuPm0JkG', 'AGENT',       'ACTIF', 0, 1),
('AGT002',   'Rasoa',   'Marie',  'agent2@safidy.mg', '$2a$10$5DoUGb3AstAKVrZBuNJFLenGR2RbmOhz0uFm45RXshwKWvuPm0JkG', 'AGENT',       'ACTIF', 0, 1);

-- ---------------------------------------------
-- 3. CONTRIBUABLES (19) - Couvre tous les secteurs
-- CIN : 12 chiffres dont le 6e = 0 ou 1
-- Telephone : 10 chiffres, prefixe 031/032/033/034/038
-- ---------------------------------------------
INSERT INTO CONTRIBUABLE
(nif, stat, raison_sociale, forme_juridique, nom_dirigeant, cin_dirigeant,
 adresse, telephone, email, id_secteur, regime, date_immatriculation,
 mois_cloture, statut, id_centre, id_agent)
VALUES
-- 1. INDUSTRIEL - ACTIF - REEL_OBLIGATOIRE
('4001234567', '12345678901234567', 'Usine Tsara SARL', 'SARL',
 'Rakoto Jean', '101230567890', 'Lot II M 45 Antananarivo', '0341234567',
 'contact@tsara.mg',
 (SELECT id_secteur FROM SECTEUR_ACTIVITE WHERE code='INDUSTRIEL'),
 'REEL_OBLIGATOIRE', '2020-01-15', 12, 'ACTIF', 1, 4),

-- 2. SERVICES - ACTIF - REEL_OPTION
('4009876543', NULL, 'Tsara Transport', 'EI',
 'Rasoa Marie', '201231567890', 'Analakely Antananarivo', '0331234567',
 'contact@tsaratransport.mg',
 (SELECT id_secteur FROM SECTEUR_ACTIVITE WHERE code='SERVICES'),
 'REEL_OPTION', '2022-03-10', 12, 'ACTIF', 1, 4),

-- 3. HOTELIER - ACTIF - REEL_OPTION
('3005551234', NULL, 'Hotel Tsara Soa', 'SARL',
 'Randria Paul', '301230567890', 'Ivato Antananarivo', '0321234567',
 'info@tsarasoa.mg',
 (SELECT id_secteur FROM SECTEUR_ACTIVITE WHERE code='HOTELIER'),
 'REEL_OPTION', '2021-06-01', 12, 'ACTIF', 1, 4),

-- 4. COMMERCE - CESSE
('4007771111', NULL, 'Tsara Distribution', 'SARL',
 'Ravaka Hery', '401230567890', 'Ambohipo Antananarivo', '0349876543',
 'contact@tsaradist.mg',
 (SELECT id_secteur FROM SECTEUR_ACTIVITE WHERE code='COMMERCE'),
 'REEL_OBLIGATOIRE', '2019-11-20', 12, 'CESSE', 1, 4),

-- 5. SERVICES - ACTIF
('2001112222', NULL, 'Bureau Etude Safidy', 'SARL',
 'Rakoto Hery', '501230567890', 'Ankadifotsy Antananarivo', '0341112233',
 'contact@safidy-etude.mg',
 (SELECT id_secteur FROM SECTEUR_ACTIVITE WHERE code='SERVICES'),
 'REEL_OPTION', '2023-02-10', 12, 'ACTIF', 1, 4),

-- 6. SANTE - ACTIF
('2003334444', NULL, 'Pharmacie Centrale', 'SARL',
 'Dr Rasoa Voahangy', '601231567890', 'Behoririka Antananarivo', '0344445566',
 'contact@pharmacie-centrale.mg',
 (SELECT id_secteur FROM SECTEUR_ACTIVITE WHERE code='SANTE'),
 'REEL_OPTION', '2022-08-15', 12, 'ACTIF', 1, 4),

-- 7. HOTELIER - ACTIF
('2005556666', NULL, 'Restaurant Chef Mada', 'EI',
 'Randria Solo', '701230567890', 'Analakely Antananarivo', '0347778899',
 'contact@chef-mada.mg',
 (SELECT id_secteur FROM SECTEUR_ACTIVITE WHERE code='HOTELIER'),
 'REEL_OPTION', '2023-05-20', 12, 'ACTIF', 1, 4),

-- 8. CARBURANT - ACTIF - REEL_OBLIGATOIRE
('2007778888', NULL, 'Station Total Analakely', 'SARL',
 'Ravaka Fanja', '801231567890', 'Analakely Antananarivo', '0341231234',
 'contact@station-analakely.mg',
 (SELECT id_secteur FROM SECTEUR_ACTIVITE WHERE code='CARBURANT'),
 'REEL_OBLIGATOIRE', '2021-04-05', 12, 'ACTIF', 1, 4),

-- 9. AGRICOLE - ACTIF (avec deficit)
('2009990000', NULL, 'Ferme Avicole Mahajanga', 'EI',
 'Randria Jean', '901230567890', 'Mahajanga', '0345556677',
 'contact@ferme-avicole.mg',
 (SELECT id_secteur FROM SECTEUR_ACTIVITE WHERE code='AGRICOLE'),
 'REEL_OPTION', '2022-01-10', 12, 'ACTIF', 1, 4),

-- 10. AGRICOLE - ACTIF - Cooperative vanille SAVA
('3001112222', NULL, 'Cooperative Vanille SAVA', 'COOPERATIVE',
 'Rasoa Faniry', '111230567890', 'Sambava', '0325678901',
 'contact@vanille-sava.mg',
 (SELECT id_secteur FROM SECTEUR_ACTIVITE WHERE code='AGRICOLE'),
 'REEL_OPTION', '2018-07-15', 12, 'ACTIF', 1, 4),

-- 11. ARTISANAL - ACTIF
('3002223333', NULL, 'Artisanat Malagasy', 'EI',
 'Randria Bezara', '121231567890', 'Antsirabe', '0332345678',
 'contact@artisanat-mg.mg',
 (SELECT id_secteur FROM SECTEUR_ACTIVITE WHERE code='ARTISANAL'),
 'REEL_OPTION', '2021-09-22', 12, 'ACTIF', 1, 4),

-- 12. MINIER - ACTIF - REEL_OBLIGATOIRE
('3003334444', NULL, 'Mines Zafimaniry', 'SA',
 'Rakoto Andriamana', '131230567890', 'Antsirabe', '0343456789',
 'contact@mines-zafimaniry.mg',
 (SELECT id_secteur FROM SECTEUR_ACTIVITE WHERE code='MINIER'),
 'REEL_OBLIGATOIRE', '2017-03-12', 12, 'ACTIF', 1, 4),

-- 13. EDUCATION - ACTIF
('3004445555', NULL, 'Ecole Privee Ambohijatovo', 'ASSOCIATION',
 'Rasoa Jeanne', '141231567890', 'Ambohijatovo Antananarivo', '0324567890',
 'contact@ecole-ambohijatovo.mg',
 (SELECT id_secteur FROM SECTEUR_ACTIVITE WHERE code='EDUCATION'),
 'REEL_OPTION', '2020-08-30', 12, 'ACTIF', 1, 4),

-- 14. COMMERCE - SUSPENDU
('3005556666', NULL, 'Boutique Rado', 'EI',
 'Randria Rado', '151230567890', 'Analakely Antananarivo', '0345678901',
 'contact@boutique-rado.mg',
 (SELECT id_secteur FROM SECTEUR_ACTIVITE WHERE code='COMMERCE'),
 'REEL_OPTION', '2022-06-15', 12, 'SUSPENDU', 1, 4),

-- 15. INDUSTRIEL - ACTIF - REEL_OBLIGATOIRE (grande entreprise)
('3006667777', NULL, 'Societe BTP Sud', 'SA',
 'Ravaka Naina', '161231567890', 'Toliara', '0336789012',
 'contact@btp-sud.mg',
 (SELECT id_secteur FROM SECTEUR_ACTIVITE WHERE code='INDUSTRIEL'),
 'REEL_OBLIGATOIRE', '2016-05-10', 12, 'ACTIF', 1, 4),

-- 16. TOURISTIQUE - ACTIF
('3007778888', NULL, 'Tour Operateur Nosy Be', 'SARL',
 'Rasoa Hanta', '171230567890', 'Nosy Be', '0327890123',
 'contact@tour-nosybe.mg',
 (SELECT id_secteur FROM SECTEUR_ACTIVITE WHERE code='TOURISTIQUE'),
 'REEL_OPTION', '2019-02-28', 12, 'ACTIF', 1, 4),

-- 17. SANTE - ACTIF
('3008889999', NULL, 'Clinique Sainte Marie', 'SOCIETE_PERSONNES',
 'Dr Randria Solofo', '181231567890', 'Antananarivo', '0348901234',
 'contact@clinique-saintemarie.mg',
 (SELECT id_secteur FROM SECTEUR_ACTIVITE WHERE code='SANTE'),
 'REEL_OPTION', '2021-11-05', 12, 'ACTIF', 1, 4),

-- 18. SERVICES - RADIE
('3009990000', NULL, 'Taxi Brousse Express', 'EI',
 'Rakoto Naivo', '191230567890', 'Antananarivo', '0329012345',
 'contact@taxi-express.mg',
 (SELECT id_secteur FROM SECTEUR_ACTIVITE WHERE code='SERVICES'),
 'REEL_OPTION', '2018-09-20', 12, 'RADIE', 1, 4),

-- 19. AGRICOLE - ACTIF - REEL_OBLIGATOIRE (grand exportateur)
('4000001111', NULL, 'Agro Business Toamasina', 'SA',
 'Ravaka Tiana', '211231567890', 'Toamasina', '0330123456',
 'contact@agro-toamasina.mg',
 (SELECT id_secteur FROM SECTEUR_ACTIVITE WHERE code='AGRICOLE'),
 'REEL_OBLIGATOIRE', '2015-04-01', 12, 'ACTIF', 1, 4);

-- ---------------------------------------------
-- 4. DECLARATIONS IR
-- ---------------------------------------------

-- ===== Usine Tsara SARL (INDUSTRIEL) =====
-- 2023 : benefice normal (IR brut > minimum)
INSERT INTO DECLARATION_IR
(id_contribuable, annee, date_debut, date_fin, ca_ht, total_charges,
 resultat_comptable, total_reintegrations, total_deductions, deficit_impute,
 base_imposable, ir_brut, minimum_perception, ir_du, acomptes_verses,
 solde_a_payer, credit_impot, date_limite, date_depot, mois_actifs, statut, id_agent)
VALUES
((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='4001234567'),
 2023, '2023-01-01', '2023-12-31',
 450000000, 170000000, 280000000, 0, 0, 0,
 280000000, 56000000, 5000000, 56000000, 0,
 56000000, 0, '2024-05-15', '2024-04-20', 12, 'PAYEE', 4);

-- 2024 : benefice normal
INSERT INTO DECLARATION_IR
(id_contribuable, annee, date_debut, date_fin, ca_ht, total_charges,
 resultat_comptable, total_reintegrations, total_deductions, deficit_impute,
 base_imposable, ir_brut, minimum_perception, ir_du, acomptes_verses,
 solde_a_payer, credit_impot, date_limite, date_depot, mois_actifs, statut, id_agent)
VALUES
((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='4001234567'),
 2024, '2024-01-01', '2024-12-31',
 480000000, 180000000, 300000000, 0, 0, 0,
 300000000, 60000000, 5300000, 60000000, 28000000,
 32000000, 0, '2025-05-15', '2025-04-18', 12, 'PAYEE', 4);

-- 2025 : benefice normal
INSERT INTO DECLARATION_IR
(id_contribuable, annee, date_debut, date_fin, ca_ht, total_charges,
 resultat_comptable, total_reintegrations, total_deductions, deficit_impute,
 base_imposable, ir_brut, minimum_perception, ir_du, acomptes_verses,
 solde_a_payer, credit_impot, date_limite, date_depot, mois_actifs, statut, id_agent)
VALUES
((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='4001234567'),
 2025, '2025-01-01', '2025-12-31',
 500000000, 180000000, 320000000, 0, 0, 0,
 320000000, 64000000, 5500000, 64000000, 30000000,
 34000000, 0, '2026-05-15', '2026-04-25', 12, 'PAYEE', 4);

-- 2026 : BROUILLON en cours
INSERT INTO DECLARATION_IR
(id_contribuable, annee, date_debut, date_fin, ca_ht, total_charges,
 resultat_comptable, total_reintegrations, total_deductions, deficit_impute,
 base_imposable, ir_brut, minimum_perception, ir_du, acomptes_verses,
 solde_a_payer, credit_impot, date_limite, date_depot, mois_actifs, statut, id_agent)
VALUES
((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='4001234567'),
 2026, '2026-01-01', '2026-12-31',
 520000000, 190000000, 330000000, 0, 0, 0,
 330000000, 66000000, 5700000, 66000000, 32000000,
 34000000, 0, '2027-05-15', NULL, 12, 'BROUILLON', 4);

-- ===== Tsara Transport (SERVICES) =====
-- 2024 : benefice normal
INSERT INTO DECLARATION_IR
(id_contribuable, annee, date_debut, date_fin, ca_ht, total_charges,
 resultat_comptable, total_reintegrations, total_deductions, deficit_impute,
 base_imposable, ir_brut, minimum_perception, ir_du, acomptes_verses,
 solde_a_payer, credit_impot, date_limite, date_depot, mois_actifs, statut, id_agent)
VALUES
((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='4009876543'),
 2024, '2024-01-01', '2024-12-31',
 200000000, 100000000, 100000000, 0, 0, 0,
 100000000, 20000000, 3000000, 20000000, 0,
 20000000, 0, '2025-05-15', '2025-04-22', 12, 'PAYEE', 4);

-- 2025 : IR = minimum (benefice faible)
INSERT INTO DECLARATION_IR
(id_contribuable, annee, date_debut, date_fin, ca_ht, total_charges,
 resultat_comptable, total_reintegrations, total_deductions, deficit_impute,
 base_imposable, ir_brut, minimum_perception, ir_du, acomptes_verses,
 solde_a_payer, credit_impot, date_limite, date_depot, mois_actifs, statut, id_agent)
VALUES
((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='4009876543'),
 2025, '2025-01-01', '2025-12-31',
 400000000, 390000000, 10000000, 0, 0, 0,
 10000000, 2000000, 5000000, 5000000, 0,
 5000000, 0, '2026-05-15', '2026-05-10', 12, 'PAYEE', 4);

-- 2026 : VALIDEE
INSERT INTO DECLARATION_IR
(id_contribuable, annee, date_debut, date_fin, ca_ht, total_charges,
 resultat_comptable, total_reintegrations, total_deductions, deficit_impute,
 base_imposable, ir_brut, minimum_perception, ir_du, acomptes_verses,
 solde_a_payer, credit_impot, date_limite, date_depot, mois_actifs, statut, id_agent)
VALUES
((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='4009876543'),
 2026, '2026-01-01', '2026-12-31',
 420000000, 350000000, 70000000, 0, 0, 0,
 70000000, 14000000, 5200000, 14000000, 2500000,
 11500000, 0, '2027-05-15', '2027-04-20', 12, 'VALIDEE', 4);

-- ===== Hotel Tsara Soa (HOTELIER) =====
-- 2024 : benefice normal
INSERT INTO DECLARATION_IR
(id_contribuable, annee, date_debut, date_fin, ca_ht, total_charges,
 resultat_comptable, total_reintegrations, total_deductions, deficit_impute,
 base_imposable, ir_brut, minimum_perception, ir_du, acomptes_verses,
 solde_a_payer, credit_impot, date_limite, date_depot, mois_actifs, statut, id_agent)
VALUES
((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='3005551234'),
 2024, '2024-01-01', '2024-12-31',
 350000000, 180000000, 170000000, 0, 0, 0,
 170000000, 34000000, 4000000, 34000000, 0,
 34000000, 0, '2025-05-15', '2025-04-28', 12, 'PAYEE', 4);

-- 2025 : avec reintegrations (amendes)
INSERT INTO DECLARATION_IR
(id_contribuable, annee, date_debut, date_fin, ca_ht, total_charges,
 resultat_comptable, total_reintegrations, total_deductions, deficit_impute,
 base_imposable, ir_brut, minimum_perception, ir_du, acomptes_verses,
 solde_a_payer, credit_impot, date_limite, date_depot, mois_actifs, statut, id_agent)
VALUES
((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='3005551234'),
 2025, '2025-01-01', '2025-12-31',
 400000000, 220000000, 180000000, 3000000, 0, 0,
 183000000, 36600000, 4500000, 36600000, 0,
 36600000, 0, '2026-05-15', '2026-04-30', 12, 'PAYEE', 4);

-- 2026 : avec déductions
INSERT INTO DECLARATION_IR
(id_contribuable, annee, date_debut, date_fin, ca_ht, total_charges,
 resultat_comptable, total_reintegrations, total_deductions, deficit_impute,
 base_imposable, ir_brut, minimum_perception, ir_du, acomptes_verses,
 solde_a_payer, credit_impot, date_limite, date_depot, mois_actifs, statut, id_agent)
VALUES
((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='3005551234'),
 2026, '2026-01-01', '2026-12-31',
 500000000, 180000000, 320000000, 0, 2000000, 0,
 318000000, 63600000, 5500000, 63600000, 0,
 63600000, 0, '2027-05-15', '2027-05-10', 12, 'VALIDEE', 4);

-- ===== Tsara Distribution (COMMERCE) - EN_RETARD =====
INSERT INTO DECLARATION_IR
(id_contribuable, annee, date_debut, date_fin, ca_ht, total_charges,
 resultat_comptable, total_reintegrations, total_deductions, deficit_impute,
 base_imposable, ir_brut, minimum_perception, ir_du, acomptes_verses,
 solde_a_payer, credit_impot, date_limite, date_depot, mois_actifs, statut, id_agent)
VALUES
((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='4007771111'),
 2025, '2025-01-01', '2025-12-31',
 200000000, 240000000, -40000000, 0, 0, 0,
 0, 0, 3000000, 3000000, 0,
 3000000, 0, '2026-05-15', NULL, 12, 'EN_RETARD', 4);

-- ===== Bureau Etude Safidy (SERVICES) =====
INSERT INTO DECLARATION_IR
(id_contribuable, annee, date_debut, date_fin, ca_ht, total_charges,
 resultat_comptable, total_reintegrations, total_deductions, deficit_impute,
 base_imposable, ir_brut, minimum_perception, ir_du, acomptes_verses,
 solde_a_payer, credit_impot, date_limite, date_depot, mois_actifs, statut, id_agent)
VALUES
((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='2001112222'),
 2024, '2024-01-01', '2024-12-31',
 120000000, 60000000, 60000000, 0, 0, 0,
 60000000, 12000000, 2200000, 12000000, 0,
 12000000, 0, '2025-05-15', '2025-04-25', 12, 'PAYEE', 4);

INSERT INTO DECLARATION_IR
(id_contribuable, annee, date_debut, date_fin, ca_ht, total_charges,
 resultat_comptable, total_reintegrations, total_deductions, deficit_impute,
 base_imposable, ir_brut, minimum_perception, ir_du, acomptes_verses,
 solde_a_payer, credit_impot, date_limite, date_depot, mois_actifs, statut, id_agent)
VALUES
((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='2001112222'),
 2025, '2025-01-01', '2025-12-31',
 150000000, 80000000, 70000000, 0, 0, 0,
 70000000, 14000000, 2500000, 14000000, 0,
 14000000, 0, '2026-05-15', '2026-04-22', 12, 'PAYEE', 4);

INSERT INTO DECLARATION_IR
(id_contribuable, annee, date_debut, date_fin, ca_ht, total_charges,
 resultat_comptable, total_reintegrations, total_deductions, deficit_impute,
 base_imposable, ir_brut, minimum_perception, ir_du, acomptes_verses,
 solde_a_payer, credit_impot, date_limite, date_depot, mois_actifs, statut, id_agent)
VALUES
((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='2001112222'),
 2026, '2026-01-01', '2026-12-31',
 160000000, 85000000, 75000000, 0, 0, 0,
 75000000, 15000000, 2600000, 15000000, 0,
 15000000, 0, '2027-05-15', '2027-04-20', 12, 'VALIDEE', 4);

-- ===== Pharmacie Centrale (SANTE) =====
INSERT INTO DECLARATION_IR
(id_contribuable, annee, date_debut, date_fin, ca_ht, total_charges,
 resultat_comptable, total_reintegrations, total_deductions, deficit_impute,
 base_imposable, ir_brut, minimum_perception, ir_du, acomptes_verses,
 solde_a_payer, credit_impot, date_limite, date_depot, mois_actifs, statut, id_agent)
VALUES
((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='2003334444'),
 2024, '2024-01-01', '2024-12-31',
 150000000, 100000000, 50000000, 0, 0, 0,
 50000000, 10000000, 500000, 10000000, 0,
 10000000, 0, '2025-05-15', '2025-04-20', 12, 'PAYEE', 4);

INSERT INTO DECLARATION_IR
(id_contribuable, annee, date_debut, date_fin, ca_ht, total_charges,
 resultat_comptable, total_reintegrations, total_deductions, deficit_impute,
 base_imposable, ir_brut, minimum_perception, ir_du, acomptes_verses,
 solde_a_payer, credit_impot, date_limite, date_depot, mois_actifs, statut, id_agent)
VALUES
((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='2003334444'),
 2025, '2025-01-01', '2025-12-31',
 180000000, 130000000, 50000000, 0, 0, 0,
 50000000, 10000000, 560000, 10000000, 0,
 10000000, 0, '2026-05-15', '2026-04-15', 12, 'PAYEE', 4);

INSERT INTO DECLARATION_IR
(id_contribuable, annee, date_debut, date_fin, ca_ht, total_charges,
 resultat_comptable, total_reintegrations, total_deductions, deficit_impute,
 base_imposable, ir_brut, minimum_perception, ir_du, acomptes_verses,
 solde_a_payer, credit_impot, date_limite, date_depot, mois_actifs, statut, id_agent)
VALUES
((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='2003334444'),
 2026, '2026-01-01', '2026-12-31',
 200000000, 150000000, 50000000, 0, 0, 0,
 50000000, 10000000, 600000, 10000000, 0,
 10000000, 0, '2027-05-15', '2027-04-10', 12, 'VALIDEE', 4);

-- ===== Restaurant Chef Mada (HOTELIER) =====
INSERT INTO DECLARATION_IR
(id_contribuable, annee, date_debut, date_fin, ca_ht, total_charges,
 resultat_comptable, total_reintegrations, total_deductions, deficit_impute,
 base_imposable, ir_brut, minimum_perception, ir_du, acomptes_verses,
 solde_a_payer, credit_impot, date_limite, date_depot, mois_actifs, statut, id_agent)
VALUES
((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='2005556666'),
 2025, '2025-01-01', '2025-12-31',
 90000000, 70000000, 20000000, 0, 0, 0,
 20000000, 4000000, 1400000, 4000000, 0,
 4000000, 0, '2026-05-15', '2026-04-28', 12, 'PAYEE', 4);

INSERT INTO DECLARATION_IR
(id_contribuable, annee, date_debut, date_fin, ca_ht, total_charges,
 resultat_comptable, total_reintegrations, total_deductions, deficit_impute,
 base_imposable, ir_brut, minimum_perception, ir_du, acomptes_verses,
 solde_a_payer, credit_impot, date_limite, date_depot, mois_actifs, statut, id_agent)
VALUES
((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='2005556666'),
 2026, '2026-01-01', '2026-12-31',
 120000000, 90000000, 30000000, 0, 0, 0,
 30000000, 6000000, 1700000, 6000000, 0,
 6000000, 0, '2027-05-15', '2027-04-28', 12, 'VALIDEE', 4);

-- ===== Station Total Analakely (CARBURANT) =====
INSERT INTO DECLARATION_IR
(id_contribuable, annee, date_debut, date_fin, ca_ht, total_charges,
 resultat_comptable, total_reintegrations, total_deductions, deficit_impute,
 base_imposable, ir_brut, minimum_perception, ir_du, acomptes_verses,
 solde_a_payer, credit_impot, date_limite, date_depot, mois_actifs, statut, id_agent)
VALUES
((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='2007778888'),
 2024, '2024-01-01', '2024-12-31',
 700000000, 660000000, 40000000, 0, 0, 0,
 40000000, 8000000, 1400000, 8000000, 0,
 8000000, 0, '2025-05-15', '2025-04-20', 12, 'PAYEE', 4);

INSERT INTO DECLARATION_IR
(id_contribuable, annee, date_debut, date_fin, ca_ht, total_charges,
 resultat_comptable, total_reintegrations, total_deductions, deficit_impute,
 base_imposable, ir_brut, minimum_perception, ir_du, acomptes_verses,
 solde_a_payer, credit_impot, date_limite, date_depot, mois_actifs, statut, id_agent)
VALUES
((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='2007778888'),
 2025, '2025-01-01', '2025-12-31',
 750000000, 700000000, 50000000, 0, 0, 0,
 50000000, 10000000, 1500000, 10000000, 0,
 10000000, 0, '2026-05-15', '2026-04-18', 12, 'PAYEE', 4);

INSERT INTO DECLARATION_IR
(id_contribuable, annee, date_debut, date_fin, ca_ht, total_charges,
 resultat_comptable, total_reintegrations, total_deductions, deficit_impute,
 base_imposable, ir_brut, minimum_perception, ir_du, acomptes_verses,
 solde_a_payer, credit_impot, date_limite, date_depot, mois_actifs, statut, id_agent)
VALUES
((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='2007778888'),
 2026, '2026-01-01', '2026-12-31',
 800000000, 750000000, 50000000, 0, 0, 0,
 50000000, 10000000, 1600000, 10000000, 0,
 10000000, 0, '2027-05-15', '2027-04-30', 12, 'VALIDEE', 4);

-- ===== Ferme Avicole Mahajanga (AGRICOLE) - avec deficit =====
INSERT INTO DECLARATION_IR
(id_contribuable, annee, date_debut, date_fin, ca_ht, total_charges,
 resultat_comptable, total_reintegrations, total_deductions, deficit_impute,
 base_imposable, ir_brut, minimum_perception, ir_du, acomptes_verses,
 solde_a_payer, credit_impot, date_limite, date_depot, mois_actifs, statut, id_agent)
VALUES
-- 2024 : DEFICIT de 20 M
((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='2009990000'),
 2024, '2024-01-01', '2024-12-31',
 50000000, 70000000, -20000000, 0, 0, 0,
 0, 0, 1000000, 1000000, 0,
 1000000, 0, '2025-05-15', '2025-04-25', 12, 'PAYEE', 4);

-- 2025 : avec imputation du deficit 2024 (20 M)
INSERT INTO DECLARATION_IR
(id_contribuable, annee, date_debut, date_fin, ca_ht, total_charges,
 resultat_comptable, total_reintegrations, total_deductions, deficit_impute,
 base_imposable, ir_brut, minimum_perception, ir_du, acomptes_verses,
 solde_a_payer, credit_impot, date_limite, date_depot, mois_actifs, statut, id_agent)
VALUES
((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='2009990000'),
 2025, '2025-01-01', '2025-12-31',
 80000000, 50000000, 30000000, 0, 0, 20000000,
 10000000, 2000000, 1300000, 2000000, 0,
 2000000, 0, '2026-05-15', '2026-04-20', 12, 'PAYEE', 4);

-- 2026 : VALIDEE normale
INSERT INTO DECLARATION_IR
(id_contribuable, annee, date_debut, date_fin, ca_ht, total_charges,
 resultat_comptable, total_reintegrations, total_deductions, deficit_impute,
 base_imposable, ir_brut, minimum_perception, ir_du, acomptes_verses,
 solde_a_payer, credit_impot, date_limite, date_depot, mois_actifs, statut, id_agent)
VALUES
((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='2009990000'),
 2026, '2026-01-01', '2026-12-31',
 100000000, 60000000, 40000000, 0, 0, 0,
 40000000, 8000000, 1500000, 8000000, 0,
 8000000, 0, '2027-05-15', '2027-04-20', 12, 'VALIDEE', 4);

-- ===== Cooperative Vanille SAVA (AGRICOLE) =====
INSERT INTO DECLARATION_IR
(id_contribuable, annee, date_debut, date_fin, ca_ht, total_charges,
 resultat_comptable, total_reintegrations, total_deductions, deficit_impute,
 base_imposable, ir_brut, minimum_perception, ir_du, acomptes_verses,
 solde_a_payer, credit_impot, date_limite, date_depot, mois_actifs, statut, id_agent)
VALUES
((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='3001112222'),
 2024, '2024-01-01', '2024-12-31',
 250000000, 150000000, 100000000, 0, 0, 0,
 100000000, 20000000, 3000000, 20000000, 0,
 20000000, 0, '2025-05-15', '2025-04-15', 12, 'PAYEE', 4);

INSERT INTO DECLARATION_IR
(id_contribuable, annee, date_debut, date_fin, ca_ht, total_charges,
 resultat_comptable, total_reintegrations, total_deductions, deficit_impute,
 base_imposable, ir_brut, minimum_perception, ir_du, acomptes_verses,
 solde_a_payer, credit_impot, date_limite, date_depot, mois_actifs, statut, id_agent)
VALUES
((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='3001112222'),
 2025, '2025-01-01', '2025-12-31',
 300000000, 180000000, 120000000, 0, 0, 0,
 120000000, 24000000, 3500000, 24000000, 0,
 24000000, 0, '2026-05-15', '2026-04-18', 12, 'PAYEE', 4);

INSERT INTO DECLARATION_IR
(id_contribuable, annee, date_debut, date_fin, ca_ht, total_charges,
 resultat_comptable, total_reintegrations, total_deductions, deficit_impute,
 base_imposable, ir_brut, minimum_perception, ir_du, acomptes_verses,
 solde_a_payer, credit_impot, date_limite, date_depot, mois_actifs, statut, id_agent)
VALUES
((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='3001112222'),
 2026, '2026-01-01', '2026-12-31',
 350000000, 200000000, 150000000, 0, 0, 0,
 150000000, 30000000, 4000000, 30000000, 0,
 30000000, 0, '2027-05-15', '2027-04-22', 12, 'VALIDEE', 4);

-- ===== Artisanat Malagasy (ARTISANAL) =====
INSERT INTO DECLARATION_IR
(id_contribuable, annee, date_debut, date_fin, ca_ht, total_charges,
 resultat_comptable, total_reintegrations, total_deductions, deficit_impute,
 base_imposable, ir_brut, minimum_perception, ir_du, acomptes_verses,
 solde_a_payer, credit_impot, date_limite, date_depot, mois_actifs, statut, id_agent)
VALUES
((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='3002223333'),
 2025, '2025-01-01', '2025-12-31',
 80000000, 50000000, 30000000, 0, 0, 0,
 30000000, 6000000, 1300000, 6000000, 0,
 6000000, 0, '2026-05-15', '2026-04-25', 12, 'PAYEE', 4);

INSERT INTO DECLARATION_IR
(id_contribuable, annee, date_debut, date_fin, ca_ht, total_charges,
 resultat_comptable, total_reintegrations, total_deductions, deficit_impute,
 base_imposable, ir_brut, minimum_perception, ir_du, acomptes_verses,
 solde_a_payer, credit_impot, date_limite, date_depot, mois_actifs, statut, id_agent)
VALUES
((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='3002223333'),
 2026, '2026-01-01', '2026-12-31',
 100000000, 60000000, 40000000, 0, 0, 0,
 40000000, 8000000, 1500000, 8000000, 0,
 8000000, 0, '2027-05-15', '2027-04-20', 12, 'VALIDEE', 4);

-- ===== Mines Zafimaniry (MINIER) - REEL_OBLIGATOIRE =====
INSERT INTO DECLARATION_IR
(id_contribuable, annee, date_debut, date_fin, ca_ht, total_charges,
 resultat_comptable, total_reintegrations, total_deductions, deficit_impute,
 base_imposable, ir_brut, minimum_perception, ir_du, acomptes_verses,
 solde_a_payer, credit_impot, date_limite, date_depot, mois_actifs, statut, id_agent)
VALUES
((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='3003334444'),
 2024, '2024-01-01', '2024-12-31',
 550000000, 350000000, 200000000, 0, 0, 0,
 200000000, 40000000, 6000000, 40000000, 0,
 40000000, 0, '2025-05-15', '2025-04-20', 12, 'PAYEE', 4);

INSERT INTO DECLARATION_IR
(id_contribuable, annee, date_debut, date_fin, ca_ht, total_charges,
 resultat_comptable, total_reintegrations, total_deductions, deficit_impute,
 base_imposable, ir_brut, minimum_perception, ir_du, acomptes_verses,
 solde_a_payer, credit_impot, date_limite, date_depot, mois_actifs, statut, id_agent)
VALUES
((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='3003334444'),
 2025, '2025-01-01', '2025-12-31',
 600000000, 400000000, 200000000, 0, 0, 0,
 200000000, 40000000, 6500000, 40000000, 0,
 40000000, 0, '2026-05-15', '2026-04-22', 12, 'PAYEE', 4);

INSERT INTO DECLARATION_IR
(id_contribuable, annee, date_debut, date_fin, ca_ht, total_charges,
 resultat_comptable, total_reintegrations, total_deductions, deficit_impute,
 base_imposable, ir_brut, minimum_perception, ir_du, acomptes_verses,
 solde_a_payer, credit_impot, date_limite, date_depot, mois_actifs, statut, id_agent)
VALUES
((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='3003334444'),
 2026, '2026-01-01', '2026-12-31',
 650000000, 420000000, 230000000, 0, 0, 0,
 230000000, 46000000, 7000000, 46000000, 0,
 46000000, 0, '2027-05-15', '2027-04-25', 12, 'VALIDEE', 4);

-- ===== Ecole Privee Ambohijatovo (EDUCATION) =====
INSERT INTO DECLARATION_IR
(id_contribuable, annee, date_debut, date_fin, ca_ht, total_charges,
 resultat_comptable, total_reintegrations, total_deductions, deficit_impute,
 base_imposable, ir_brut, minimum_perception, ir_du, acomptes_verses,
 solde_a_payer, credit_impot, date_limite, date_depot, mois_actifs, statut, id_agent)
VALUES
((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='3004445555'),
 2025, '2025-01-01', '2025-12-31',
 70000000, 40000000, 30000000, 0, 0, 0,
 30000000, 6000000, 340000, 6000000, 0,
 6000000, 0, '2026-05-15', '2026-04-28', 12, 'PAYEE', 4);

INSERT INTO DECLARATION_IR
(id_contribuable, annee, date_debut, date_fin, ca_ht, total_charges,
 resultat_comptable, total_reintegrations, total_deductions, deficit_impute,
 base_imposable, ir_brut, minimum_perception, ir_du, acomptes_verses,
 solde_a_payer, credit_impot, date_limite, date_depot, mois_actifs, statut, id_agent)
VALUES
((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='3004445555'),
 2026, '2026-01-01', '2026-12-31',
 85000000, 50000000, 35000000, 0, 0, 0,
 35000000, 7000000, 370000, 7000000, 0,
 7000000, 0, '2027-05-15', '2027-04-20', 12, 'VALIDEE', 4);

-- ===== Societe BTP Sud (INDUSTRIEL) - REEL_OBLIGATOIRE =====
INSERT INTO DECLARATION_IR
(id_contribuable, annee, date_debut, date_fin, ca_ht, total_charges,
 resultat_comptable, total_reintegrations, total_deductions, deficit_impute,
 base_imposable, ir_brut, minimum_perception, ir_du, acomptes_verses,
 solde_a_payer, credit_impot, date_limite, date_depot, mois_actifs, statut, id_agent)
VALUES
((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='3006667777'),
 2024, '2024-01-01', '2024-12-31',
 750000000, 500000000, 250000000, 0, 0, 0,
 250000000, 50000000, 8000000, 50000000, 0,
 50000000, 0, '2025-05-15', '2025-04-25', 12, 'PAYEE', 4);

INSERT INTO DECLARATION_IR
(id_contribuable, annee, date_debut, date_fin, ca_ht, total_charges,
 resultat_comptable, total_reintegrations, total_deductions, deficit_impute,
 base_imposable, ir_brut, minimum_perception, ir_du, acomptes_verses,
 solde_a_payer, credit_impot, date_limite, date_depot, mois_actifs, statut, id_agent)
VALUES
((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='3006667777'),
 2025, '2025-01-01', '2025-12-31',
 850000000, 550000000, 300000000, 0, 0, 0,
 300000000, 60000000, 9000000, 60000000, 0,
 60000000, 0, '2026-05-15', '2026-04-28', 12, 'PAYEE', 4);

INSERT INTO DECLARATION_IR
(id_contribuable, annee, date_debut, date_fin, ca_ht, total_charges,
 resultat_comptable, total_reintegrations, total_deductions, deficit_impute,
 base_imposable, ir_brut, minimum_perception, ir_du, acomptes_verses,
 solde_a_payer, credit_impot, date_limite, date_depot, mois_actifs, statut, id_agent)
VALUES
((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='3006667777'),
 2026, '2026-01-01', '2026-12-31',
 900000000, 600000000, 300000000, 0, 0, 0,
 300000000, 60000000, 9500000, 60000000, 0,
 60000000, 0, '2027-05-15', '2027-04-22', 12, 'VALIDEE', 4);

-- ===== Tour Operateur Nosy Be (TOURISTIQUE) =====
INSERT INTO DECLARATION_IR
(id_contribuable, annee, date_debut, date_fin, ca_ht, total_charges,
 resultat_comptable, total_reintegrations, total_deductions, deficit_impute,
 base_imposable, ir_brut, minimum_perception, ir_du, acomptes_verses,
 solde_a_payer, credit_impot, date_limite, date_depot, mois_actifs, statut, id_agent)
VALUES
((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='3007778888'),
 2025, '2025-01-01', '2025-12-31',
 200000000, 120000000, 80000000, 0, 0, 0,
 80000000, 16000000, 2500000, 16000000, 0,
 16000000, 0, '2026-05-15', '2026-04-18', 12, 'PAYEE', 4);

INSERT INTO DECLARATION_IR
(id_contribuable, annee, date_debut, date_fin, ca_ht, total_charges,
 resultat_comptable, total_reintegrations, total_deductions, deficit_impute,
 base_imposable, ir_brut, minimum_perception, ir_du, acomptes_verses,
 solde_a_payer, credit_impot, date_limite, date_depot, mois_actifs, statut, id_agent)
VALUES
((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='3007778888'),
 2026, '2026-01-01', '2026-12-31',
 250000000, 140000000, 110000000, 0, 0, 0,
 110000000, 22000000, 3000000, 22000000, 0,
 22000000, 0, '2027-05-15', '2027-04-20', 12, 'VALIDEE', 4);

-- ===== Clinique Sainte Marie (SANTE) =====
INSERT INTO DECLARATION_IR
(id_contribuable, annee, date_debut, date_fin, ca_ht, total_charges,
 resultat_comptable, total_reintegrations, total_deductions, deficit_impute,
 base_imposable, ir_brut, minimum_perception, ir_du, acomptes_verses,
 solde_a_payer, credit_impot, date_limite, date_depot, mois_actifs, statut, id_agent)
VALUES
((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='3008889999'),
 2026, '2026-01-01', '2026-12-31',
 300000000, 180000000, 120000000, 0, 0, 0,
 120000000, 24000000, 800000, 24000000, 0,
 24000000, 0, '2027-05-15', '2027-04-25', 12, 'VALIDEE', 4);

-- ===== Agro Business Toamasina (AGRICOLE) - REEL_OBLIGATOIRE =====
INSERT INTO DECLARATION_IR
(id_contribuable, annee, date_debut, date_fin, ca_ht, total_charges,
 resultat_comptable, total_reintegrations, total_deductions, deficit_impute,
 base_imposable, ir_brut, minimum_perception, ir_du, acomptes_verses,
 solde_a_payer, credit_impot, date_limite, date_depot, mois_actifs, statut, id_agent)
VALUES
((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='4000001111'),
 2024, '2024-01-01', '2024-12-31',
 450000000, 300000000, 150000000, 0, 0, 0,
 150000000, 30000000, 5000000, 30000000, 0,
 30000000, 0, '2025-05-15', '2025-04-28', 12, 'PAYEE', 4);

INSERT INTO DECLARATION_IR
(id_contribuable, annee, date_debut, date_fin, ca_ht, total_charges,
 resultat_comptable, total_reintegrations, total_deductions, deficit_impute,
 base_imposable, ir_brut, minimum_perception, ir_du, acomptes_verses,
 solde_a_payer, credit_impot, date_limite, date_depot, mois_actifs, statut, id_agent)
VALUES
((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='4000001111'),
 2025, '2025-01-01', '2025-12-31',
 500000000, 320000000, 180000000, 0, 0, 0,
 180000000, 36000000, 5500000, 36000000, 0,
 36000000, 0, '2026-05-15', '2026-04-22', 12, 'PAYEE', 4);

INSERT INTO DECLARATION_IR
(id_contribuable, annee, date_debut, date_fin, ca_ht, total_charges,
 resultat_comptable, total_reintegrations, total_deductions, deficit_impute,
 base_imposable, ir_brut, minimum_perception, ir_du, acomptes_verses,
 solde_a_payer, credit_impot, date_limite, date_depot, mois_actifs, statut, id_agent)
VALUES
((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='4000001111'),
 2026, '2026-01-01', '2026-12-31',
 550000000, 350000000, 200000000, 0, 0, 0,
 200000000, 40000000, 6000000, 40000000, 0,
 40000000, 0, '2027-05-15', '2027-04-25', 12, 'VALIDEE', 4);

-- =====================================================
-- Fin du jeu de donnees
-- =====================================================
