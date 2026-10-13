-- =====================================================
-- Safidy - 07_seed_full.sql
-- =====================================================
-- Jeu de donnees complet pour TOUTES les tables.
-- A executer APRES 06_insert_test_data.sql.
--
-- Ce script :
--   1. Nettoie les tables transactionnelles (garde les references)
--   2. Reinsere des donnees coherentes partout
--   3. Respecte les contraintes FK et les regles metier
-- =====================================================

-- ---------------------------------------------
-- 1. NETTOYAGE (ordre inverse des dependances FK)
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

-- ---------------------------------------------
-- 2. AGENTS supplementaires (les 3 existants sont gardes)
-- Hash = admin1234
-- ---------------------------------------------
INSERT INTO AGENT (matricule, nom, prenom, email, mot_de_passe_hash, role, statut, tentatives_echec, id_centre)
VALUES
('RESP002', 'Randria', 'Paul',   'resp2@safidy.mg',  '$2a$10$5DoUGb3AstAKVrZBuNJFLenGR2RbmOhz0uFm45RXshwKWvuPm0JkG', 'RESPONSABLE', 'ACTIF', 0, 1),
('AGT002',  'Rasoa',   'Marie',  'agent2@safidy.mg', '$2a$10$5DoUGb3AstAKVrZBuNJFLenGR2RbmOhz0uFm45RXshwKWvuPm0JkG', 'AGENT',       'ACTIF', 0, 1)
ON CONFLICT (matricule) DO NOTHING;

-- ---------------------------------------------
-- 3. CONTRIBUABLES (4 existants + 5 nouveaux = 9)
-- ---------------------------------------------
INSERT INTO CONTRIBUABLE
(nif, stat, raison_sociale, forme_juridique, nom_dirigeant, cin_dirigeant,
 adresse, telephone, email, id_secteur, regime, date_immatriculation,
 mois_cloture, statut, id_centre, id_agent)
VALUES
-- 1. Usine Tsara SARL (INDUSTRIEL)
('4001234567', '12345678901234567', 'Usine Tsara SARL', 'SARL',
 'Rakoto Jean', '101234567890', 'Lot II M 45 Antananarivo', '0341234567',
 'contact@tsara.mg',
 (SELECT id_secteur FROM SECTEUR_ACTIVITE WHERE code='INDUSTRIEL'),
 'REEL_OBLIGATOIRE', '2020-01-15', 12, 'ACTIF', 1, 3),

-- 2. Tsara Transport (SERVICES)
('4009876543', NULL, 'Tsara Transport', 'EI',
 'Rasoa Marie', '201234567890', 'Analakely Antananarivo', '0331234567',
 'contact@tsaratransport.mg',
 (SELECT id_secteur FROM SECTEUR_ACTIVITE WHERE code='SERVICES'),
 'REEL_OPTION', '2022-03-10', 12, 'ACTIF', 1, 3),

-- 3. Hotel Tsara Soa (HOTELIER)
('3005551234', NULL, 'Hotel Tsara Soa', 'SARL',
 'Randria Paul', '301234567890', 'Ivato Antananarivo', '0321234567',
 'info@tsarasoa.mg',
 (SELECT id_secteur FROM SECTEUR_ACTIVITE WHERE code='HOTELIER'),
 'REEL_OPTION', '2021-06-01', 12, 'ACTIF', 1, 3),

-- 4. Tsara Distribution (COMMERCE, CESSE)
('4007771111', NULL, 'Tsara Distribution', 'SARL',
 'Ravaka Hery', '401234567890', 'Ambohipo Antananarivo', '0349876543',
 NULL,
 (SELECT id_secteur FROM SECTEUR_ACTIVITE WHERE code='COMMERCE'),
 'REEL_OBLIGATOIRE', '2019-11-20', 12, 'CESSE', 1, 3),

-- 5. Bureau Etude Safidy (SERVICES)
('2001112222', NULL, 'Bureau Etude Safidy', 'SARL',
 'Rakoto Hery', '501234567890', 'Ankadifotsy Antananarivo', '0341112233',
 'contact@safidy-etude.mg',
 (SELECT id_secteur FROM SECTEUR_ACTIVITE WHERE code='SERVICES'),
 'REEL_OPTION', '2023-02-10', 12, 'ACTIF', 1, 3),

-- 6. Pharmacie Centrale (SANTE)
('2003334444', NULL, 'Pharmacie Centrale', 'SARL',
 'Dr Rasoa Voahangy', '601234567890', 'Behoririka Antananarivo', '0344445566',
 'contact@pharmacie-centrale.mg',
 (SELECT id_secteur FROM SECTEUR_ACTIVITE WHERE code='SANTE'),
 'REEL_OPTION', '2022-08-15', 12, 'ACTIF', 1, 3),

-- 7. Restaurant Chef Mada (HOTELIER)
('2005556666', NULL, 'Restaurant Chef Mada', 'EI',
 'Randria Solo', '701234567890', 'Analakely Antananarivo', '0347778899',
 'contact@chef-mada.mg',
 (SELECT id_secteur FROM SECTEUR_ACTIVITE WHERE code='HOTELIER'),
 'REEL_OPTION', '2023-05-20', 12, 'ACTIF', 1, 3),

-- 8. Station Total Analakely (CARBURANT)
('2007778888', NULL, 'Station Total Analakely', 'SARL',
 'Ravaka Fanja', '801234567890', 'Analakely Antananarivo', '0341231234',
 'contact@station-analakely.mg',
 (SELECT id_secteur FROM SECTEUR_ACTIVITE WHERE code='CARBURANT'),
 'REEL_OBLIGATOIRE', '2021-04-05', 12, 'ACTIF', 1, 3),

-- 9. Ferme Avicole Mahajanga (AGRICOLE)
('2009990000', NULL, 'Ferme Avicole Mahajanga', 'EI',
 'Randria Jean', '901234567890', 'Mahajanga', '0345556677',
 'contact@ferme-avicole.mg',
 (SELECT id_secteur FROM SECTEUR_ACTIVITE WHERE code='AGRICOLE'),
 'REEL_OPTION', '2022-01-10', 12, 'ACTIF', 1, 3);

-- ---------------------------------------------
-- 4. DECLARATIONS IR (15 declarations)
-- ---------------------------------------------

-- Usine Tsara SARL (INDUSTRIEL)
INSERT INTO DECLARATION_IR
(id_contribuable, annee, date_debut, date_fin, ca_ht, total_charges,
 resultat_comptable, total_reintegrations, total_deductions, deficit_impute,
 base_imposable, ir_brut, minimum_perception, ir_du, acomptes_verses,
 solde_a_payer, credit_impot, date_limite, date_depot, mois_actifs, statut, id_agent)
VALUES
((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='4001234567'), 2024, '2024-01-01', '2024-12-31',
 450000000, 170000000, 280000000, 0, 0, 0, 280000000, 56000000, 5000000, 56000000, 0, 56000000, 0, '2025-05-15', '2025-04-20', 12, 'PAYEE', 3),

((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='4001234567'), 2025, '2025-01-01', '2025-12-31',
 480000000, 180000000, 300000000, 0, 0, 0, 300000000, 60000000, 5300000, 60000000, 0, 60000000, 0, '2026-05-15', '2026-04-18', 12, 'PAYEE', 3),

((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='4001234567'), 2026, '2026-01-01', '2026-12-31',
 500000000, 180000000, 320000000, 0, 0, 0, 320000000, 64000000, 5500000, 64000000, 0, 64000000, 0, '2027-05-15', '2027-04-20', 12, 'VALIDEE', 3);

-- Tsara Transport (SERVICES)
INSERT INTO DECLARATION_IR
(id_contribuable, annee, date_debut, date_fin, ca_ht, total_charges,
 resultat_comptable, total_reintegrations, total_deductions, deficit_impute,
 base_imposable, ir_brut, minimum_perception, ir_du, acomptes_verses,
 solde_a_payer, credit_impot, date_limite, date_depot, mois_actifs, statut, id_agent)
VALUES
((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='4009876543'), 2025, '2025-01-01', '2025-12-31',
 250000000, 120000000, 130000000, 0, 0, 0, 130000000, 26000000, 3500000, 26000000, 0, 26000000, 0, '2026-05-15', '2026-04-25', 12, 'PAYEE', 3),

((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='4009876543'), 2026, '2026-01-01', '2026-12-31',
 280000000, 150000000, 130000000, 0, 0, 0, 130000000, 26000000, 3800000, 26000000, 0, 26000000, 0, '2027-05-15', '2027-04-15', 12, 'VALIDEE', 3);

-- Hotel Tsara Soa (HOTELIER)
INSERT INTO DECLARATION_IR
(id_contribuable, annee, date_debut, date_fin, ca_ht, total_charges,
 resultat_comptable, total_reintegrations, total_deductions, deficit_impute,
 base_imposable, ir_brut, minimum_perception, ir_du, acomptes_verses,
 solde_a_payer, credit_impot, date_limite, date_depot, mois_actifs, statut, id_agent)
VALUES
((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='3005551234'), 2025, '2025-01-01', '2025-12-31',
 400000000, 200000000, 200000000, 0, 0, 0, 200000000, 40000000, 4500000, 40000000, 0, 40000000, 0, '2026-05-15', '2026-04-30', 12, 'PAYEE', 3),

((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='3005551234'), 2026, '2026-01-01', '2026-12-31',
 500000000, 180000000, 320000000, 0, 0, 0, 320000000, 64000000, 5500000, 64000000, 0, 64000000, 0, '2027-05-15', '2027-05-10', 12, 'VALIDEE', 3);

-- Tsara Distribution (COMMERCE - CESSE)
INSERT INTO DECLARATION_IR
(id_contribuable, annee, date_debut, date_fin, ca_ht, total_charges,
 resultat_comptable, total_reintegrations, total_deductions, deficit_impute,
 base_imposable, ir_brut, minimum_perception, ir_du, acomptes_verses,
 solde_a_payer, credit_impot, date_limite, date_depot, mois_actifs, statut, id_agent)
VALUES
((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='4007771111'), 2024, '2024-01-01', '2024-12-31',
 300000000, 250000000, 50000000, 0, 0, 0, 50000000, 10000000, 4000000, 10000000, 0, 10000000, 0, '2025-05-15', '2025-05-20', 12, 'PAYEE', 3),

((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='4007771111'), 2025, '2025-01-01', '2025-12-31',
 200000000, 240000000, -40000000, 0, 0, 0, 0, 0, 3000000, 3000000, 0, 3000000, 0, '2026-05-15', NULL, 12, 'EN_RETARD', 3);

-- Bureau Etude Safidy (SERVICES)
INSERT INTO DECLARATION_IR
(id_contribuable, annee, date_debut, date_fin, ca_ht, total_charges,
 resultat_comptable, total_reintegrations, total_deductions, deficit_impute,
 base_imposable, ir_brut, minimum_perception, ir_du, acomptes_verses,
 solde_a_payer, credit_impot, date_limite, date_depot, mois_actifs, statut, id_agent)
VALUES
((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='2001112222'), 2026, '2026-01-01', '2026-12-31',
 150000000, 80000000, 70000000, 0, 0, 0, 70000000, 14000000, 2500000, 14000000, 0, 14000000, 0, '2027-05-15', '2027-04-22', 12, 'VALIDEE', 3);

-- Pharmacie Centrale (SANTE)
INSERT INTO DECLARATION_IR
(id_contribuable, annee, date_debut, date_fin, ca_ht, total_charges,
 resultat_comptable, total_reintegrations, total_deductions, deficit_impute,
 base_imposable, ir_brut, minimum_perception, ir_du, acomptes_verses,
 solde_a_payer, credit_impot, date_limite, date_depot, mois_actifs, statut, id_agent)
VALUES
((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='2003334444'), 2026, '2026-01-01', '2026-12-31',
 200000000, 150000000, 50000000, 0, 0, 0, 50000000, 10000000, 600000, 10000000, 0, 10000000, 0, '2027-05-15', '2027-04-10', 12, 'VALIDEE', 3);

-- Restaurant Chef Mada (HOTELIER)
INSERT INTO DECLARATION_IR
(id_contribuable, annee, date_debut, date_fin, ca_ht, total_charges,
 resultat_comptable, total_reintegrations, total_deductions, deficit_impute,
 base_imposable, ir_brut, minimum_perception, ir_du, acomptes_verses,
 solde_a_payer, credit_impot, date_limite, date_depot, mois_actifs, statut, id_agent)
VALUES
((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='2005556666'), 2026, '2026-01-01', '2026-12-31',
 120000000, 90000000, 30000000, 0, 0, 0, 30000000, 6000000, 1700000, 6000000, 0, 6000000, 0, '2027-05-15', '2027-04-28', 12, 'VALIDEE', 3);

-- Station Total Analakely (CARBURANT)
INSERT INTO DECLARATION_IR
(id_contribuable, annee, date_debut, date_fin, ca_ht, total_charges,
 resultat_comptable, total_reintegrations, total_deductions, deficit_impute,
 base_imposable, ir_brut, minimum_perception, ir_du, acomptes_verses,
 solde_a_payer, credit_impot, date_limite, date_depot, mois_actifs, statut, id_agent)
VALUES
((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='2007778888'), 2026, '2026-01-01', '2026-12-31',
 800000000, 750000000, 50000000, 0, 0, 0, 50000000, 10000000, 1600000, 10000000, 0, 10000000, 0, '2027-05-15', '2027-04-30', 12, 'VALIDEE', 3);

-- Ferme Avicole Mahajanga (AGRICOLE) - avec deficit
INSERT INTO DECLARATION_IR
(id_contribuable, annee, date_debut, date_fin, ca_ht, total_charges,
 resultat_comptable, total_reintegrations, total_deductions, deficit_impute,
 base_imposable, ir_brut, minimum_perception, ir_du, acomptes_verses,
 solde_a_payer, credit_impot, date_limite, date_depot, mois_actifs, statut, id_agent)
VALUES
-- 2025 : deficit
((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='2009990000'), 2025, '2025-01-01', '2025-12-31',
 50000000, 70000000, -20000000, 0, 0, 0, 0, 0, 1000000, 1000000, 0, 1000000, 0, '2026-05-15', '2026-04-25', 12, 'PAYEE', 3),

-- 2026 : avec imputation du deficit 2025
((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='2009990000'), 2026, '2026-01-01', '2026-12-31',
 80000000, 50000000, 30000000, 0, 0, 20000000, 10000000, 2000000, 1300000, 2000000, 0, 2000000, 0, '2027-05-15', '2027-04-20', 12, 'VALIDEE', 3);

-- ---------------------------------------------
-- 5. LIGNE_CHARGE (detail des charges)
-- ---------------------------------------------
INSERT INTO LIGNE_CHARGE (id_declaration, categorie, libelle, montant_ar, justificatif_ref)
SELECT d.id_declaration, 'SALAIRE', 'Salaires du personnel', 100000000, 'FACT-2026-001'
FROM DECLARATION_IR d WHERE d.annee=2026
  AND d.id_contribuable=(SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='4001234567')
UNION ALL
SELECT d.id_declaration, 'LOYER', 'Loyer usine', 30000000, 'FACT-2026-002'
FROM DECLARATION_IR d WHERE d.annee=2026
  AND d.id_contribuable=(SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='4001234567')
UNION ALL
SELECT d.id_declaration, 'ELECTRICITE', 'Facture JIRAMA', 10000000, 'FACT-2026-003'
FROM DECLARATION_IR d WHERE d.annee=2026
  AND d.id_contribuable=(SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='4001234567')
UNION ALL
SELECT d.id_declaration, 'TRANSPORT', 'Transport marchandises', 20000000, 'FACT-2026-004'
FROM DECLARATION_IR d WHERE d.annee=2026
  AND d.id_contribuable=(SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='4001234567')
UNION ALL
SELECT d.id_declaration, 'AUTRE', 'Frais divers', 20000000, NULL
FROM DECLARATION_IR d WHERE d.annee=2026
  AND d.id_contribuable=(SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='4001234567');

-- Charges pour les autres declarations (donnees simplifiees)
INSERT INTO LIGNE_CHARGE (id_declaration, categorie, libelle, montant_ar, justificatif_ref)
SELECT d.id_declaration, 'SALAIRE', 'Salaires', (d.total_charges * 50 / 100), 'FACT-S-001'
FROM DECLARATION_IR d WHERE d.total_charges > 0
  AND d.id_declaration NOT IN (SELECT id_declaration FROM LIGNE_CHARGE);

INSERT INTO LIGNE_CHARGE (id_declaration, categorie, libelle, montant_ar, justificatif_ref)
SELECT d.id_declaration, 'LOYER', 'Loyer', (d.total_charges * 30 / 100), 'FACT-L-001'
FROM DECLARATION_IR d WHERE d.total_charges > 0
  AND NOT EXISTS (SELECT 1 FROM LIGNE_CHARGE lc WHERE lc.id_declaration = d.id_declaration AND lc.categorie='LOYER');

INSERT INTO LIGNE_CHARGE (id_declaration, categorie, libelle, montant_ar, justificatif_ref)
SELECT d.id_declaration, 'AUTRE', 'Autres frais', (d.total_charges * 20 / 100), NULL
FROM DECLARATION_IR d WHERE d.total_charges > 0
  AND NOT EXISTS (SELECT 1 FROM LIGNE_CHARGE lc WHERE lc.id_declaration = d.id_declaration AND lc.categorie='AUTRE');

-- ---------------------------------------------
-- 6. AJUSTEMENT_FISCAL (reintegrations et deductions)
-- ---------------------------------------------
INSERT INTO AJUSTEMENT_FISCAL (id_declaration, type, motif, montant_ar, article_ref)
SELECT d.id_declaration, 'REINTEGRATION', 'AMENDE', 500000, '01.01.10'
FROM DECLARATION_IR d WHERE d.annee=2026
  AND d.id_contribuable=(SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='4001234567')
UNION ALL
SELECT d.id_declaration, 'DEDUCTION', 'PRODUIT_EXONERE', 2000000, '01.01.14'
FROM DECLARATION_IR d WHERE d.annee=2026
  AND d.id_contribuable=(SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='4001234567');

-- ---------------------------------------------
-- 7. DEFICIT (Ferme Avicole 2025)
-- ---------------------------------------------
INSERT INTO DEFICIT (id_contribuable, annee_origine, montant_initial, montant_utilise, solde, annee_expiration, statut)
VALUES
((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='2009990000'),
 2025, 20000000, 20000000, 0, 2030, 'EPUISE');

-- ---------------------------------------------
-- 8. UTILISATION_DEFICIT (imputation 2026)
-- ---------------------------------------------
INSERT INTO UTILISATION_DEFICIT (id_deficit, id_declaration, montant_impute)
SELECT d.id_deficit, decl.id_declaration, 20000000
FROM DEFICIT d, DECLARATION_IR decl
WHERE d.annee_origine = 2025
  AND d.id_contribuable = (SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='2009990000')
  AND decl.annee = 2026
  AND decl.id_contribuable = d.id_contribuable;

-- ---------------------------------------------
-- 9. ACOMPTE (2 x 50% pour chaque declaration VALIDEE ou PAYEE)
-- ---------------------------------------------
INSERT INTO ACOMPTE (id_contribuable, annee, numero, taux_pct, base_ir_n1, montant_ar, date_echeance, statut)
SELECT d.id_contribuable, (d.annee + 1), 1, 50, d.ir_du, (d.ir_du * 50 / 100),
       make_date(d.annee + 1, 5, 15),
       CASE WHEN d.annee + 1 < EXTRACT(YEAR FROM CURRENT_DATE) THEN 'PAYE' ELSE 'A_PAYER' END
FROM DECLARATION_IR d
WHERE d.statut IN ('VALIDEE', 'PAYEE')
  AND d.ir_du > 0;

INSERT INTO ACOMPTE (id_contribuable, annee, numero, taux_pct, base_ir_n1, montant_ar, date_echeance, statut)
SELECT d.id_contribuable, (d.annee + 1), 2, 50, d.ir_du, (d.ir_du * 50 / 100),
       make_date(d.annee + 1, 11, 15),
       CASE WHEN d.annee + 1 < EXTRACT(YEAR FROM CURRENT_DATE) THEN 'PAYE' ELSE 'A_PAYER' END
FROM DECLARATION_IR d
WHERE d.statut IN ('VALIDEE', 'PAYEE')
  AND d.ir_du > 0;

-- ---------------------------------------------
-- 10. PAIEMENT (quelques paiements de test)
-- ---------------------------------------------
INSERT INTO PAIEMENT (id_contribuable, id_declaration, type_paiement, montant_ar, date_paiement, mode,
                      reference_quittance, id_agent, annule)
SELECT d.id_contribuable, d.id_declaration, 'SOLDE_IR', d.ir_du,
       COALESCE(d.date_depot, d.date_limite), 'VIREMENT',
       'Q-' || EXTRACT(YEAR FROM COALESCE(d.date_depot, d.date_limite)) || '-' ||
       LPAD((d.id_declaration * 7)::text, 5, '0'),
       3, FALSE
FROM DECLARATION_IR d
WHERE d.statut = 'PAYEE'
LIMIT 3;

-- Un paiement ACOMPTE
INSERT INTO PAIEMENT (id_contribuable, id_acompte, type_paiement, montant_ar, date_paiement, mode,
                      reference_quittance, id_agent, annule)
SELECT a.id_contribuable, a.id_acompte, 'ACOMPTE', a.montant_ar,
       a.date_echeance, 'MOBILE_MONEY',
       'Q-' || EXTRACT(YEAR FROM a.date_echeance) || '-AC' || a.id_acompte,
       3, FALSE
FROM ACOMPTE a
WHERE a.numero = 1 AND a.statut = 'PAYE'
LIMIT 2;

-- ---------------------------------------------
-- 11. PENALITE (retard sur Tsara Distribution 2025)
-- ---------------------------------------------
INSERT INTO PENALITE (id_declaration, type, nb_mois, taux_pct, montant_ar, statut)
SELECT d.id_declaration, 'AMENDE_DEPOT', 0, 0, 100000, 'DUE'
FROM DECLARATION_IR d
WHERE d.statut = 'EN_RETARD' AND d.id_contribuable=(SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='4007771111');

INSERT INTO PENALITE (id_declaration, type, nb_mois, taux_pct, montant_ar, statut)
SELECT d.id_declaration, 'INTERET_RETARD', 3, 1.00, (d.ir_du * 3 / 100), 'DUE'
FROM DECLARATION_IR d
WHERE d.statut = 'EN_RETARD' AND d.id_contribuable=(SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='4007771111');

-- ---------------------------------------------
-- 12. SUSPENSION_ACTIVITE (Hotel Tsara Soa 2025)
-- ---------------------------------------------
INSERT INTO SUSPENSION_ACTIVITE (id_contribuable, date_arret, date_reprise, motif, ref_declaration, statut, id_agent_arret, id_agent_reprise)
VALUES
((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='3005551234'),
 '2025-03-01', '2025-09-01', 'SAISON', 'DEC-2025-0089', 'TERMINEE', 3, 3),

((SELECT id_contribuable FROM CONTRIBUABLE WHERE nif='2001112222'),
 '2024-07-01', '2024-10-01', 'TRAVAUX', 'DEC-2024-0456', 'TERMINEE', 3, 3);

-- ---------------------------------------------
-- 13. JOURNAL_AUDIT (historique des actions)
-- ---------------------------------------------
INSERT INTO JOURNAL_AUDIT (id_agent, action, table_cible, id_cible, adresse_ip, details)
VALUES
(1, 'CREATION_CONTRIBUABLE', 'contribuable', 1, '127.0.0.1', 'NIF=4001234567'),
(3, 'VALIDATION_DECLARATION', 'declaration_ir', 1, '127.0.0.1', 'IR du = 56000000 Ar'),
(3, 'VALIDATION_DECLARATION', 'declaration_ir', 2, '127.0.0.1', 'IR du = 60000000 Ar'),
(3, 'ENREGISTREMENT_PAIEMENT', 'paiement', 1, '127.0.0.1', 'Montant = 56000000 Ar'),
(3, 'CREATION_CONTRIBUABLE', 'contribuable', 5, '127.0.0.1', 'NIF=2001112222'),
(3, 'CREATION_CONTRIBUABLE', 'contribuable', 6, '127.0.0.1', 'NIF=2003334444'),
(3, 'CALCUL_IR', 'declaration_ir', 14, '127.0.0.1', 'IR du = 2000000 Ar'),
(3, 'VALIDATION_DECLARATION', 'declaration_ir', 14, '127.0.0.1', 'IR du = 2000000 Ar'),
(2, 'ANNULATION_PAIEMENT', 'paiement', 2, '127.0.0.1', 'Motif = Erreur de saisie'),
(1, 'MODIFICATION_CONTRIBUABLE', 'contribuable', 3, '127.0.0.1', 'NIF=3005551234'),
(3, 'ENREGISTREMENT_PAIEMENT', 'paiement', 3, '127.0.0.1', 'Montant = 40000000 Ar'),
(1, 'VALIDATION_DECLARATION', 'declaration_ir', 4, '127.0.0.1', 'IR du = 10000000 Ar'),
(2, 'ANNULATION_PENALITE', 'penalite', 1, '127.0.0.1', 'Motif = Erreur'),
(3, 'CREATION_DEFICIT', 'deficit', 1, '127.0.0.1', 'Montant = 20000000 Ar'),
(3, 'IMPUTATION_DEFICIT', 'utilisation_deficit', 1, '127.0.0.1', 'Impute = 20000000 Ar');

-- =====================================================
-- Fin du script : donnees completes inserees
-- =====================================================

-- Verification rapide
SELECT 'AGENT' AS table_name, COUNT(*) AS nb FROM AGENT
UNION ALL SELECT 'CENTRE_FISCAL', COUNT(*) FROM CENTRE_FISCAL
UNION ALL SELECT 'SECTEUR_ACTIVITE', COUNT(*) FROM SECTEUR_ACTIVITE
UNION ALL SELECT 'PARAMETRE_FISCAL', COUNT(*) FROM PARAMETRE_FISCAL
UNION ALL SELECT 'CONTRIBUABLE', COUNT(*) FROM CONTRIBUABLE
UNION ALL SELECT 'DECLARATION_IR', COUNT(*) FROM DECLARATION_IR
UNION ALL SELECT 'LIGNE_CHARGE', COUNT(*) FROM LIGNE_CHARGE
UNION ALL SELECT 'AJUSTEMENT_FISCAL', COUNT(*) FROM AJUSTEMENT_FISCAL
UNION ALL SELECT 'DEFICIT', COUNT(*) FROM DEFICIT
UNION ALL SELECT 'UTILISATION_DEFICIT', COUNT(*) FROM UTILISATION_DEFICIT
UNION ALL SELECT 'ACOMPTE', COUNT(*) FROM ACOMPTE
UNION ALL SELECT 'PAIEMENT', COUNT(*) FROM PAIEMENT
UNION ALL SELECT 'PENALITE', COUNT(*) FROM PENALITE
UNION ALL SELECT 'SUSPENSION_ACTIVITE', COUNT(*) FROM SUSPENSION_ACTIVITE
UNION ALL SELECT 'JOURNAL_AUDIT', COUNT(*) FROM JOURNAL_AUDIT
ORDER BY table_name;
