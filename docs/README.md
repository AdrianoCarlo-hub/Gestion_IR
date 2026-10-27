# Documentation Safidy

## Sommaire

| Fichier | Public | Contenu |
|---------|--------|---------|
| [01 — Guide utilisateur](01_GUIDE_UTILISATEUR.md) | Agents | Utilisation des 9 pages |
| [02 — Regles de calcul](02_REGLES_CALCUL.md) | Agents + Jury | Formules + verifications |
| [03 — Workflow entre modules](03_WORKFLOW_MODULES.md) | Tous | Liaisons et cycle fiscal |
| [04 — Manuel technique](04_MANUEL_TECHNIQUE.md) | Developpeurs | Architecture et API |
| [05 — FAQ](05_FAQ.md) | Tous | 50 questions courantes |

## Vue d'ensemble

Safidy est une application web de gestion de l'impot sur le revenu pour les agents du centre fiscal. Elle centralise la gestion des contribuables, des declarations, des deficits, des acomptes, des paiements et des penalites.

L'application fonctionne avec :
- Frontend React 19 + Vite
- Backend Spring Boot 4.1.1 (Java 21)
- Base PostgreSQL 16
- Authentification JWT, autorisations par role

## Modules principaux

1. Contribuables
2. Declarations IR
3. Deficits
4. Acomptes
5. Paiements
6. Penalites
7. Arret / reprise
8. Tableau de bord
9. Journal d'audit

## Objectif fonctionnel

L'application permet de :
- enregistrer un contribuable
- creer une declaration IR
- calculer automatiquement l'IR
- report un deficit fiscal
- generer des acomptes provisionnels
- suivre les paiements et les penalites
- simuler les impacts fiscaux
- garder une traçabilité complète des actions

## Ordre de lecture recommande

1. Lire le guide utilisateur pour comprendre l'interface.
2. Consulter les regles de calcul pour valider les formules.
3. Suivre le workflow pour comprendre les liens entre modules.
4. Utiliser le manuel technique pour le maintien du code.
5. Consulter la FAQ pour les questions frequentes.

## Donnees de reference

Safidy suit la logique fiscale malgache appliquee au calcul de l'IR :
- deficit fiscal reportable pendant 5 ans
- imputation FIFO du stock de deficit
- minimum de perception selon le secteur
- acompte provisionnel = 50 % x IR N-1
- majoration de retard = 1 %/mois sur le solde net
- penalite de depot tardif selon le CA

## Acces local

- Frontend : http://localhost:5173
- Backend : http://localhost:8080
- API : http://localhost:8080/api

## Contacts et roles

- AGENT : saisie, calcul, validation, suivi
- RESPONSABLE : supervision, validite, suivi des arrets
- ADMIN : administration, parametres, securite, donnees

## A savoir

Les calculs fiscaux sont executes dans le backend. Le frontend affiche les resultats, mais ne doit pas remplacer la logique metier. Cela garantit une coherence unique entre les agents et les ecrans.
