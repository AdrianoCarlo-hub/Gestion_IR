-- =====================================================
-- Safidy - 03_create_constraints.sql
-- =====================================================
-- Ajout des cles etrangeres (FK) entre les 15 tables.
-- A executer APRES 02_create_tables.sql.
-- =====================================================

-- ---------------------------------------------
-- AGENT -> CENTRE_FISCAL
-- ---------------------------------------------
ALTER TABLE AGENT
    ADD CONSTRAINT fk_agent_centre
    FOREIGN KEY (id_centre) REFERENCES CENTRE_FISCAL(id_centre);

-- ---------------------------------------------
-- CONTRIBUABLE -> SECTEUR_ACTIVITE, CENTRE_FISCAL, AGENT
-- ---------------------------------------------
ALTER TABLE CONTRIBUABLE
    ADD CONSTRAINT fk_contrib_secteur
    FOREIGN KEY (id_secteur) REFERENCES SECTEUR_ACTIVITE(id_secteur);

ALTER TABLE CONTRIBUABLE
    ADD CONSTRAINT fk_contrib_centre
    FOREIGN KEY (id_centre) REFERENCES CENTRE_FISCAL(id_centre);

ALTER TABLE CONTRIBUABLE
    ADD CONSTRAINT fk_contrib_agent
    FOREIGN KEY (id_agent) REFERENCES AGENT(id_agent);

-- ---------------------------------------------
-- DECLARATION_IR -> CONTRIBUABLE, AGENT
-- ---------------------------------------------
ALTER TABLE DECLARATION_IR
    ADD CONSTRAINT fk_declaration_contribuable
    FOREIGN KEY (id_contribuable) REFERENCES CONTRIBUABLE(id_contribuable);

ALTER TABLE DECLARATION_IR
    ADD CONSTRAINT fk_declaration_agent
    FOREIGN KEY (id_agent) REFERENCES AGENT(id_agent);

-- ---------------------------------------------
-- LIGNE_CHARGE -> DECLARATION_IR
-- ---------------------------------------------
ALTER TABLE LIGNE_CHARGE
    ADD CONSTRAINT fk_ligne_declaration
    FOREIGN KEY (id_declaration) REFERENCES DECLARATION_IR(id_declaration)
    ON DELETE CASCADE;

-- ---------------------------------------------
-- AJUSTEMENT_FISCAL -> DECLARATION_IR
-- ---------------------------------------------
ALTER TABLE AJUSTEMENT_FISCAL
    ADD CONSTRAINT fk_ajust_declaration
    FOREIGN KEY (id_declaration) REFERENCES DECLARATION_IR(id_declaration)
    ON DELETE CASCADE;

-- ---------------------------------------------
-- DEFICIT -> CONTRIBUABLE
-- ---------------------------------------------
ALTER TABLE DEFICIT
    ADD CONSTRAINT fk_deficit_contribuable
    FOREIGN KEY (id_contribuable) REFERENCES CONTRIBUABLE(id_contribuable);

-- ---------------------------------------------
-- UTILISATION_DEFICIT -> DEFICIT, DECLARATION_IR
-- ---------------------------------------------
ALTER TABLE UTILISATION_DEFICIT
    ADD CONSTRAINT fk_util_def_deficit
    FOREIGN KEY (id_deficit) REFERENCES DEFICIT(id_deficit);

ALTER TABLE UTILISATION_DEFICIT
    ADD CONSTRAINT fk_util_def_declaration
    FOREIGN KEY (id_declaration) REFERENCES DECLARATION_IR(id_declaration);

-- ---------------------------------------------
-- ACOMPTE -> CONTRIBUABLE
-- ---------------------------------------------
ALTER TABLE ACOMPTE
    ADD CONSTRAINT fk_acompte_contribuable
    FOREIGN KEY (id_contribuable) REFERENCES CONTRIBUABLE(id_contribuable);

-- ---------------------------------------------
-- PAIEMENT -> CONTRIBUABLE, DECLARATION_IR, ACOMPTE, AGENT
-- ---------------------------------------------
ALTER TABLE PAIEMENT
    ADD CONSTRAINT fk_paiement_contribuable
    FOREIGN KEY (id_contribuable) REFERENCES CONTRIBUABLE(id_contribuable);

ALTER TABLE PAIEMENT
    ADD CONSTRAINT fk_paiement_declaration
    FOREIGN KEY (id_declaration) REFERENCES DECLARATION_IR(id_declaration);

ALTER TABLE PAIEMENT
    ADD CONSTRAINT fk_paiement_acompte
    FOREIGN KEY (id_acompte) REFERENCES ACOMPTE(id_acompte);

ALTER TABLE PAIEMENT
    ADD CONSTRAINT fk_paiement_agent
    FOREIGN KEY (id_agent) REFERENCES AGENT(id_agent);

-- ---------------------------------------------
-- PENALITE -> DECLARATION_IR
-- ---------------------------------------------
ALTER TABLE PENALITE
    ADD CONSTRAINT fk_penalite_declaration
    FOREIGN KEY (id_declaration) REFERENCES DECLARATION_IR(id_declaration);

-- ---------------------------------------------
-- SUSPENSION_ACTIVITE -> CONTRIBUABLE, AGENT
-- ---------------------------------------------
ALTER TABLE SUSPENSION_ACTIVITE
    ADD CONSTRAINT fk_susp_contribuable
    FOREIGN KEY (id_contribuable) REFERENCES CONTRIBUABLE(id_contribuable);

ALTER TABLE SUSPENSION_ACTIVITE
    ADD CONSTRAINT fk_susp_agent_arret
    FOREIGN KEY (id_agent_arret) REFERENCES AGENT(id_agent);

ALTER TABLE SUSPENSION_ACTIVITE
    ADD CONSTRAINT fk_susp_agent_reprise
    FOREIGN KEY (id_agent_reprise) REFERENCES AGENT(id_agent);

-- ---------------------------------------------
-- JOURNAL_AUDIT -> AGENT (nullable : action systeme possible)
-- ---------------------------------------------
ALTER TABLE JOURNAL_AUDIT
    ADD CONSTRAINT fk_journal_agent
    FOREIGN KEY (id_agent) REFERENCES AGENT(id_agent);

-- =====================================================
-- Fin : toutes les cles etrangeres sont en place
-- =====================================================
