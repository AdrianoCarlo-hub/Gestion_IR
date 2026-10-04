-- =====================================================
-- Safidy - 02_create_tables.sql
-- =====================================================
-- Creation des 15 tables dans la base "safidy".
-- A executer sur la base VIDE.
-- Les cles etrangeres sont ajoutees dans 03_create_constraints.sql
-- =====================================================

-- ---------------------------------------------
-- Nettoyage (ordre inverse des dependances)
-- ---------------------------------------------
DROP TABLE IF EXISTS JOURNAL_AUDIT CASCADE;
DROP TABLE IF EXISTS SUSPENSION_ACTIVITE CASCADE;
DROP TABLE IF EXISTS PENALITE CASCADE;
DROP TABLE IF EXISTS PAIEMENT CASCADE;
DROP TABLE IF EXISTS ACOMPTE CASCADE;
DROP TABLE IF EXISTS UTILISATION_DEFICIT CASCADE;
DROP TABLE IF EXISTS DEFICIT CASCADE;
DROP TABLE IF EXISTS AJUSTEMENT_FISCAL CASCADE;
DROP TABLE IF EXISTS LIGNE_CHARGE CASCADE;
DROP TABLE IF EXISTS DECLARATION_IR CASCADE;
DROP TABLE IF EXISTS CONTRIBUABLE CASCADE;
DROP TABLE IF EXISTS AGENT CASCADE;
DROP TABLE IF EXISTS PARAMETRE_FISCAL CASCADE;
DROP TABLE IF EXISTS SECTEUR_ACTIVITE CASCADE;
DROP TABLE IF EXISTS CENTRE_FISCAL CASCADE;

-- =============================================
-- Table 1 : CENTRE_FISCAL
-- =============================================
CREATE TABLE CENTRE_FISCAL (
    id_centre   BIGSERIAL     PRIMARY KEY,
    code        VARCHAR(10)   NOT NULL UNIQUE,
    nom         VARCHAR(100)  NOT NULL,
    region      VARCHAR(60),
    adresse     VARCHAR(200),
    telephone   VARCHAR(20)
);

-- =============================================
-- Table 2 : SECTEUR_ACTIVITE
-- =============================================
CREATE TABLE SECTEUR_ACTIVITE (
    id_secteur   BIGSERIAL     PRIMARY KEY,
    code         VARCHAR(30)   NOT NULL UNIQUE,
    libelle      VARCHAR(100)  NOT NULL,
    categorie    VARCHAR(20)   NOT NULL,
    min_fixe_ar  BIGINT        NOT NULL DEFAULT 0,
    min_pct_ca   NUMERIC(5,4)  NOT NULL DEFAULT 0,
    actif        BOOLEAN       NOT NULL DEFAULT TRUE,
    CONSTRAINT chk_secteur_categorie
        CHECK (categorie IN ('PRIORITAIRE','GENERAL','SANTE_EDUC','CARBURANT')),
    CONSTRAINT chk_secteur_min_fixe
        CHECK (min_fixe_ar >= 0),
    CONSTRAINT chk_secteur_min_pct
        CHECK (min_pct_ca >= 0)
);

-- =============================================
-- Table 3 : PARAMETRE_FISCAL
-- =============================================
CREATE TABLE PARAMETRE_FISCAL (
    id_param       BIGSERIAL       PRIMARY KEY,
    code           VARCHAR(40)     NOT NULL UNIQUE,
    valeur         NUMERIC(18,4)   NOT NULL,
    date_effet     DATE            NOT NULL,
    description    VARCHAR(200),
    date_creation  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- Table 4 : AGENT
-- =============================================
CREATE TABLE AGENT (
    id_agent            BIGSERIAL     PRIMARY KEY,
    matricule           VARCHAR(15)   NOT NULL UNIQUE,
    nom                 VARCHAR(60)   NOT NULL,
    prenom              VARCHAR(60)   NOT NULL,
    email               VARCHAR(120)  NOT NULL UNIQUE,
    mot_de_passe_hash   VARCHAR(255)  NOT NULL,
    role                VARCHAR(20)   NOT NULL,
    statut              VARCHAR(20)   NOT NULL DEFAULT 'ACTIF',
    tentatives_echec    SMALLINT      NOT NULL DEFAULT 0,
    derniere_connexion  TIMESTAMP,
    date_creation       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_centre           BIGINT        NOT NULL,
    CONSTRAINT chk_agent_role
        CHECK (role IN ('AGENT','RESPONSABLE','ADMIN')),
    CONSTRAINT chk_agent_statut
        CHECK (statut IN ('ACTIF','BLOQUE')),
    CONSTRAINT chk_agent_tentatives
        CHECK (tentatives_echec >= 0 AND tentatives_echec <= 5)
);

-- =============================================
-- Table 5 : CONTRIBUABLE
-- =============================================
CREATE TABLE CONTRIBUABLE (
    id_contribuable        BIGSERIAL     PRIMARY KEY,
    nif                    VARCHAR(10)   NOT NULL UNIQUE,
    stat                   VARCHAR(17),
    raison_sociale         VARCHAR(150)  NOT NULL,
    forme_juridique        VARCHAR(20)   NOT NULL,
    nom_dirigeant          VARCHAR(120)  NOT NULL,
    cin_dirigeant          VARCHAR(12)   NOT NULL,
    adresse                VARCHAR(200)  NOT NULL,
    telephone              VARCHAR(20),
    email                  VARCHAR(120),
    id_secteur             BIGINT        NOT NULL,
    regime                 VARCHAR(20)   NOT NULL,
    date_immatriculation   DATE          NOT NULL,
    mois_cloture           SMALLINT      NOT NULL DEFAULT 12,
    statut                 VARCHAR(20)   NOT NULL DEFAULT 'ACTIF',
    id_centre              BIGINT        NOT NULL,
    id_agent               BIGINT        NOT NULL,
    date_creation          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_contrib_forme
        CHECK (forme_juridique IN ('EI','SARL','SA','SOCIETE_PERSONNES','ASSOCIATION','COOPERATIVE')),
    CONSTRAINT chk_contrib_regime
        CHECK (regime IN ('REEL_OBLIGATOIRE','REEL_OPTION')),
    CONSTRAINT chk_contrib_statut
        CHECK (statut IN ('ACTIF','SUSPENDU','CESSE','RADIE')),
    CONSTRAINT chk_contrib_mois_cloture
        CHECK (mois_cloture >= 1 AND mois_cloture <= 12)
);

-- =============================================
-- Table 6 : DECLARATION_IR
-- =============================================
CREATE TABLE DECLARATION_IR (
    id_declaration       BIGSERIAL     PRIMARY KEY,
    id_contribuable      BIGINT        NOT NULL,
    annee                SMALLINT      NOT NULL,
    date_debut           DATE          NOT NULL,
    date_fin             DATE          NOT NULL,
    ca_ht                BIGINT        NOT NULL DEFAULT 0,
    total_charges        BIGINT        NOT NULL DEFAULT 0,
    resultat_comptable   BIGINT        NOT NULL DEFAULT 0,
    total_reintegrations BIGINT        NOT NULL DEFAULT 0,
    total_deductions     BIGINT        NOT NULL DEFAULT 0,
    deficit_impute       BIGINT        NOT NULL DEFAULT 0,
    base_imposable       BIGINT        NOT NULL DEFAULT 0,
    ir_brut              BIGINT        NOT NULL DEFAULT 0,
    minimum_perception   BIGINT        NOT NULL DEFAULT 0,
    ir_du                BIGINT        NOT NULL DEFAULT 0,
    acomptes_verses      BIGINT        NOT NULL DEFAULT 0,
    solde_a_payer        BIGINT        NOT NULL DEFAULT 0,
    credit_impot         BIGINT        NOT NULL DEFAULT 0,
    date_limite          DATE,
    date_depot           DATE,
    mois_actifs          SMALLINT      NOT NULL DEFAULT 12,
    statut               VARCHAR(20)   NOT NULL DEFAULT 'BROUILLON',
    id_agent             BIGINT,
    date_creation        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_declaration_contrib_annee
        UNIQUE (id_contribuable, annee),
    CONSTRAINT chk_declaration_statut
        CHECK (statut IN ('BROUILLON','VALIDEE','PAYEE','EN_RETARD')),
    CONSTRAINT chk_declaration_mois_actifs
        CHECK (mois_actifs >= 0 AND mois_actifs <= 12),
    CONSTRAINT chk_declaration_ca
        CHECK (ca_ht >= 0)
);

-- =============================================
-- Table 7 : LIGNE_CHARGE
-- =============================================
CREATE TABLE LIGNE_CHARGE (
    id_ligne          BIGSERIAL     PRIMARY KEY,
    id_declaration    BIGINT        NOT NULL,
    categorie         VARCHAR(20)   NOT NULL,
    libelle           VARCHAR(120)  NOT NULL,
    montant_ar        BIGINT        NOT NULL,
    justificatif_ref  VARCHAR(40),
    CONSTRAINT chk_ligne_categorie
        CHECK (categorie IN ('SALAIRE','LOYER','ELECTRICITE','TRANSPORT','AUTRE')),
    CONSTRAINT chk_ligne_montant
        CHECK (montant_ar > 0)
);

-- =============================================
-- Table 8 : AJUSTEMENT_FISCAL
-- =============================================
CREATE TABLE AJUSTEMENT_FISCAL (
    id_ajustement    BIGSERIAL     PRIMARY KEY,
    id_declaration   BIGINT        NOT NULL,
    type             VARCHAR(20)   NOT NULL,
    motif            VARCHAR(30)   NOT NULL,
    montant_ar       BIGINT        NOT NULL,
    article_ref      VARCHAR(30),
    CONSTRAINT chk_ajust_type
        CHECK (type IN ('REINTEGRATION','DEDUCTION')),
    CONSTRAINT chk_ajust_motif
        CHECK (motif IN ('AMENDE','SANS_FACTURE','DEPENSE_PERSONNELLE','DON_NON_AGREE',
                         'AMORT_EXCES','PRODUIT_EXONERE','REPRISE_PROVISION','AUTRE')),
    CONSTRAINT chk_ajust_montant
        CHECK (montant_ar > 0)
);

-- =============================================
-- Table 9 : DEFICIT
-- =============================================
CREATE TABLE DEFICIT (
    id_deficit        BIGSERIAL     PRIMARY KEY,
    id_contribuable   BIGINT        NOT NULL,
    annee_origine     SMALLINT      NOT NULL,
    montant_initial   BIGINT        NOT NULL,
    montant_utilise   BIGINT        NOT NULL DEFAULT 0,
    solde             BIGINT        NOT NULL,
    annee_expiration  SMALLINT      NOT NULL,
    statut            VARCHAR(20)   NOT NULL DEFAULT 'ACTIF',
    date_creation     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_deficit_statut
        CHECK (statut IN ('ACTIF','EPUISE','EXPIRE')),
    CONSTRAINT chk_deficit_montant
        CHECK (montant_initial >= 0),
    CONSTRAINT chk_deficit_utilise
        CHECK (montant_utilise >= 0),
    CONSTRAINT chk_deficit_solde
        CHECK (solde >= 0)
);

-- =============================================
-- Table 10 : UTILISATION_DEFICIT
-- =============================================
CREATE TABLE UTILISATION_DEFICIT (
    id_utilisation   BIGSERIAL     PRIMARY KEY,
    id_deficit       BIGINT        NOT NULL,
    id_declaration   BIGINT        NOT NULL,
    montant_impute   BIGINT        NOT NULL,
    date_creation    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_util_def_montant
        CHECK (montant_impute > 0)
);

-- =============================================
-- Table 11 : ACOMPTE
-- =============================================
CREATE TABLE ACOMPTE (
    id_acompte        BIGSERIAL     PRIMARY KEY,
    id_contribuable   BIGINT        NOT NULL,
    annee             SMALLINT      NOT NULL,
    numero            SMALLINT      NOT NULL,
    taux_pct          SMALLINT      NOT NULL DEFAULT 50,
    base_ir_n1        BIGINT        NOT NULL DEFAULT 0,
    montant_ar        BIGINT        NOT NULL DEFAULT 0,
    date_echeance     DATE          NOT NULL,
    statut            VARCHAR(20)   NOT NULL DEFAULT 'A_PAYER',
    date_creation     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_acompte_contrib_annee_num
        UNIQUE (id_contribuable, annee, numero),
    CONSTRAINT chk_acompte_numero
        CHECK (numero IN (1, 2)),
    CONSTRAINT chk_acompte_statut
        CHECK (statut IN ('A_PAYER','PAYE','EN_RETARD','SUSPENDU'))
);

-- =============================================
-- Table 12 : PAIEMENT
-- =============================================
CREATE TABLE PAIEMENT (
    id_paiement          BIGSERIAL     PRIMARY KEY,
    id_contribuable      BIGINT        NOT NULL,
    id_declaration       BIGINT,
    id_acompte           BIGINT,
    type_paiement        VARCHAR(20)   NOT NULL,
    montant_ar           BIGINT        NOT NULL,
    date_paiement        DATE          NOT NULL,
    mode                 VARCHAR(20)   NOT NULL,
    reference_quittance  VARCHAR(25)   NOT NULL UNIQUE,
    id_agent             BIGINT        NOT NULL,
    annule               BOOLEAN       NOT NULL DEFAULT FALSE,
    motif_annulation     VARCHAR(200),
    date_creation        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_paiement_type
        CHECK (type_paiement IN ('SOLDE_IR','ACOMPTE','PENALITE')),
    CONSTRAINT chk_paiement_mode
        CHECK (mode IN ('VIREMENT','CHEQUE','ESPECES','MOBILE_MONEY')),
    CONSTRAINT chk_paiement_montant
        CHECK (montant_ar > 0)
);

-- =============================================
-- Table 13 : PENALITE
-- =============================================
CREATE TABLE PENALITE (
    id_penalite      BIGSERIAL     PRIMARY KEY,
    id_declaration   BIGINT        NOT NULL,
    type             VARCHAR(30)   NOT NULL,
    nb_mois          SMALLINT      NOT NULL DEFAULT 0,
    taux_pct         NUMERIC(5,2)  NOT NULL DEFAULT 0,
    montant_ar       BIGINT        NOT NULL DEFAULT 0,
    statut           VARCHAR(20)   NOT NULL DEFAULT 'DUE',
    date_creation    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_penalite_type
        CHECK (type IN ('AMENDE_DEPOT','INTERET_RETARD','MAJORATION')),
    CONSTRAINT chk_penalite_statut
        CHECK (statut IN ('DUE','PAYEE','ANNULEE')),
    CONSTRAINT chk_penalite_montant
        CHECK (montant_ar >= 0)
);

-- =============================================
-- Table 14 : SUSPENSION_ACTIVITE
-- =============================================
CREATE TABLE SUSPENSION_ACTIVITE (
    id_suspension     BIGSERIAL     PRIMARY KEY,
    id_contribuable   BIGINT        NOT NULL,
    date_arret        DATE          NOT NULL,
    date_reprise      DATE,
    motif             VARCHAR(30)   NOT NULL,
    ref_declaration   VARCHAR(30),
    statut            VARCHAR(20)   NOT NULL DEFAULT 'EN_COURS',
    id_agent_arret    BIGINT        NOT NULL,
    id_agent_reprise  BIGINT,
    date_creation     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_susp_motif
        CHECK (motif IN ('MANQUE_ACTIVITE','TRAVAUX','SAISON',
                         'DIFFICULTE_FINANCIERE','AUTRE')),
    CONSTRAINT chk_susp_statut
        CHECK (statut IN ('EN_COURS','TERMINEE','ANNULEE'))
);

-- =============================================
-- Table 15 : JOURNAL_AUDIT
-- =============================================
CREATE TABLE JOURNAL_AUDIT (
    id_log       BIGSERIAL     PRIMARY KEY,
    id_agent     BIGINT,
    action       VARCHAR(50)   NOT NULL,
    table_cible  VARCHAR(50),
    id_cible     BIGINT,
    date_heure   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    adresse_ip   VARCHAR(45),
    details      TEXT
);

-- =====================================================
-- Fin du script : 15 tables creees
-- =====================================================
