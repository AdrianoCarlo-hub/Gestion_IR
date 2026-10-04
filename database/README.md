# Base de donnees - Safidy

Ce dossier contient les scripts SQL de creation et d'initialisation
de la base PostgreSQL.

## Ordre d'execution

1. 01_create_database.sql    - Creation de la base safidy
2. 02_create_tables.sql      - Creation des 15 tables
3. 03_create_constraints.sql - Contraintes (FK, UNIQUE, CHECK)
4. 04_create_indexes.sql     - Index pour la recherche
5. 05_insert_parameters.sql  - Parametres fiscaux initiaux
6. 06_insert_test_data.sql   - Donnees de test (facultatif)

## Execution recommandee : pgAdmin

1. Ouvrir pgAdmin
2. Se connecter au serveur PostgreSQL
3. Ouvrir Query Tool
4. Ouvrir chaque fichier dans l'ordre et executer (F5)
