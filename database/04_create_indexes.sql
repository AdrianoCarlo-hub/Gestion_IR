-- =====================================================
-- Safidy - 04_create_indexes.sql
-- =====================================================
-- Index pour accelerer la recherche.
-- A executer APRES 03_create_constraints.sql.
-- =====================================================

-- ---------------------------------------------
-- Recherche de contribuables
-- ---------------------------------------------
CREATE INDEX idx_contrib_nif           ON CONTRIBUABLE(nif);
CREATE INDEX idx_contrib_stat          ON CONTRIBUABLE(stat);
CREATE INDEX idx_contrib_raison        ON CONTRIBUABLE(raison_sociale);
CREATE INDEX idx_contrib_telephone     ON CONTRIBUABLE(telephone);
CREATE INDEX idx_contrib_statut        ON CONTRIBUABLE(statut);
CREATE INDEX idx_contrib_secteur       ON CONTRIBUABLE(id_secteur);
CREATE INDEX idx_contrib_centre        ON CONTRIBUABLE(id_centre);

-- ---------------------------------------------
-- Recherche de declarations
-- ---------------------------------------------
CREATE INDEX idx_declaration_annee     ON DECLARATION_IR(annee);
CREATE INDEX idx_declaration_statut    ON DECLARATION_IR(statut);
CREATE INDEX idx_declaration_contrib   ON DECLARATION_IR(id_contribuable);
CREATE INDEX idx_declaration_agent     ON DECLARATION_IR(id_agent);

-- ---------------------------------------------
-- Charges et ajustements
-- ---------------------------------------------
CREATE INDEX idx_ligne_declaration     ON LIGNE_CHARGE(id_declaration);
CREATE INDEX idx_ajust_declaration     ON AJUSTEMENT_FISCAL(id_declaration);

-- ---------------------------------------------
-- Deficits
-- ---------------------------------------------
CREATE INDEX idx_deficit_contrib       ON DEFICIT(id_contribuable);
CREATE INDEX idx_deficit_annee_orig    ON DEFICIT(annee_origine);
CREATE INDEX idx_deficit_statut        ON DEFICIT(statut);

-- ---------------------------------------------
-- Acomptes
-- ---------------------------------------------
CREATE INDEX idx_acompte_contrib       ON ACOMPTE(id_contribuable);
CREATE INDEX idx_acompte_annee         ON ACOMPTE(annee);
CREATE INDEX idx_acompte_statut        ON ACOMPTE(statut);
CREATE INDEX idx_acompte_echeance      ON ACOMPTE(date_echeance);

-- ---------------------------------------------
-- Paiements
-- ---------------------------------------------
CREATE INDEX idx_paiement_contrib      ON PAIEMENT(id_contribuable);
CREATE INDEX idx_paiement_declaration  ON PAIEMENT(id_declaration);
CREATE INDEX idx_paiement_acompte      ON PAIEMENT(id_acompte);
CREATE INDEX idx_paiement_date         ON PAIEMENT(date_paiement);

-- ---------------------------------------------
-- Penalites
-- ---------------------------------------------
CREATE INDEX idx_penalite_declaration  ON PENALITE(id_declaration);
CREATE INDEX idx_penalite_statut       ON PENALITE(statut);

-- ---------------------------------------------
-- Suspensions
-- ---------------------------------------------
CREATE INDEX idx_susp_contrib          ON SUSPENSION_ACTIVITE(id_contribuable);
CREATE INDEX idx_susp_statut           ON SUSPENSION_ACTIVITE(statut);

-- ---------------------------------------------
-- Journal d'audit
-- ---------------------------------------------
CREATE INDEX idx_journal_agent         ON JOURNAL_AUDIT(id_agent);
CREATE INDEX idx_journal_date          ON JOURNAL_AUDIT(date_heure);
CREATE INDEX idx_journal_action        ON JOURNAL_AUDIT(action);

-- =====================================================
-- Fin : index crees
-- =====================================================
