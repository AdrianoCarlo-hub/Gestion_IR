# Guide utilisateur Safidy

## 1. Vue d'ensemble

Safidy est l'outil de gestion fiscale de l'IR. Il couvre les declarations, les deficit, les acomptes, les paiements et les penalites.

### Roles

- AGENT : saisie des declarations et validation des dossiers
- RESPONSABLE : suivi des dossiers importants et des decisions
- ADMIN : parametres, utilisateurs, security, donnees de reference

---

## 2. Page d'accueil et menu de navigation

### A) A quoi sert la page ?
La page d'accueil du tableau de bord centralise les KPIs de l'ensemble du centre fiscal.

### B) Comment y acceder ?
- Menu : Tableau de bord
- URL : http://localhost:5173/dashboard

### C) Que voit-on a l'ecran ?
```text
+---------------------------------------------------------------+
| Safidy                       Tableau de bord                    |
|-----------------------------------------------------------------|
| KPI: Contributions | Deficits | Acomptes | Penalites | Paiements |
| Diagrammes de tendances | Statut de l'annee courante | Alertes    |
+---------------------------------------------------------------+
```

### D) Comment l'utiliser ?
1. Ouvrir le menu lateral.
2. Choisir le module a consulter.
3. Verifier la synthese par contribuable ou par exercice.

### E) Quels calculs sont declenches ?
Aucun calcul fiscal n'est lance directement ici. La page consolide les donnees existantes.

### F) Quels impacts sur les autres pages ?
- Dashboard : synthese des modules
- Audit : journal de toutes les actions
- Paiements : impact sur le solde global

### G) Erreurs frequentes
| Erreur | Cause | Solution |
|---|---|---|
| Donnees incomplètes | Module non renseigne | Recharger la page |
| KPI a zero | Pas de donnees sur l'annee | Generer une declaration |

---

## 3. Contribuables

### A) A quoi sert la page ?
Gerer les entreprises et les particuliers assujettis a l'IR.

### B) Comment y acceder ?
- Menu : Contribuables
- URL : http://localhost:5173/contribuables

### C) Que voit-on a l'ecran ?
```text
+---------------------------------------------------------------+
| Contribuables            + Nouveau contribuable                 |
|-----------------------------------------------------------------|
| Rechercher | Raison sociale | NIF | Regime | Secteur | Statut   |
|-----------------------------------------------------------------|
| Nom entreprise | 123456789 | R.E. | GENERAL | ACTIF             |
+---------------------------------------------------------------+
```

### D) Comment l'utiliser ?
1. Cliquer sur "Nouveau contribuable".
2. Saisir la raison sociale, le NIF, le secteur et le regime.
3. Enregistrer.
4. Ouvrir la fiche pour consulter l'historique fiscal.

### E) Quels calculs sont declenches ?
- Aucun calcul IR direct.
- La fiche de contribuable alimente les declarations et les acomptes.

### F) Quels impacts sur les autres pages ?
- Declarations IR : le contribuable devient elegible
- Acomptes : le calcul du minimum et de la creation est base sur la fiche
- Audit : trace de creation

### G) Erreurs frequentes
| Erreur | Cause | Solution |
|---|---|---|
| NIF invalide | NIF absent ou duplicate | Verifier la base |
| Secteur manquant | Donnee obligatoire | Selectionner un secteur |

---

## 4. Declarations IR

### A) A quoi sert cette page ?
Saisir les declarations annuelles, calculer l'IR, et generer les acomptes.

### B) Comment y acceder ?
- Menu : Declarations IR
- URL : http://localhost:5173/declarations

### C) Que voit-on a l'ecran ?
```text
+-------------------------------------------------------------------+
| Declarations IR                          + Nouvelle declaration |
|-------------------------------------------------------------------|
| Contribuable | Annee | Statut | CA HT | IR du | Solde a payer     |
|-------------------------------------------------------------------|
| Entreprise X | 2026 | BROUILLON | 250M | 12M | 3M                |
+-------------------------------------------------------------------+
```

### D) Comment l'utiliser ?
1. Cliquer "+ Nouvelle declaration".
2. Choisir le contribuable et l'annee.
3. Saisir la periode d'activite.
4. Renseigner le CA HT et les charges.
5. Cliquer sur "Calculer l'impot".
6. Verifier le resultat.
7. Cliquer sur "Valider".

### E) Quels calculs sont declenches ?
Au clic sur "Calculer" :
1. Resultat comptable = CA - charges
2. Base avant deficit = Resultat comptable + reintegrations - deductions
3. Imputation du deficit disponible (FIFO)
4. IR brut = base imposable x taux IR
5. Minimum de perception selon le secteur
6. IR du = max(IR brut ; minimum)
7. Solde = IR du - acomptes verses

Au clic sur "Valider" :
- creation automatique des 2 acomptes provisionnels de N+1
- si base < 0, creation d'un deficit
- si depot tardif, creation d'une amende de depot

### F) Quels impacts sur les autres pages ?
- Page Acomptes : +2 acomptes provisionnels
- Page Deficits : +1 deficit si base negative
- Page Penalites : +1 amende si retard
- Page Dashboard : KPIs mis a jour

### G) Erreurs frequentes
| Erreur | Cause | Solution |
|---|---|---|
| "Exercice deja declare" | Declaration existante pour l'annee | Verifier la liste |
| "CA HT invalide" | Regime REEL_OBLIGATOIRE et CA insuffisant | Valider CA minimal |
| "Annee dans le futur" | Annee > annee courante | Corriger l'annee |

---

## 5. Deficits

### A) A quoi sert cette page ?
Suivre le stock des deficits fiscaux reportables et leur imputation.

### B) Comment y acceder ?
- Menu : Deficits
- URL : http://localhost:5173/deficits

### C) Que voit-on a l'ecran ?
```text
+-------------------------------------------------------------------+
| Deficits                        + Nouveau deficit                 |
|-------------------------------------------------------------------|
| Contribuable | Annee origine | Montant init | Solde | Expiration |
|-------------------------------------------------------------------|
| Entreprise X | 2025 | 100M | 60M | 2030                         |
+-------------------------------------------------------------------+
```

### D) Comment l'utiliser ?
1. Ouvrir la liste des deficits.
2. Verifier le statut ACTIF, EPUISE ou EXPIRE.
3. Enregistrer un déficit manuel si requis.

### E) Quels calculs sont declenches ?
- Deficit genere automatiquement si base fiscale negative.
- Imputation automatique sur le benefice suivant.
- FIFO sur les deficits les plus anciens.

### F) Quels impacts sur les autres pages ?
- Declarations IR : la base imposable est reduite
- Dashboard : evolution du stock de deficit
- Audit : historique d'utilisation

### G) Erreurs frequentes
| Erreur | Cause | Solution |
|---|---|---|
| Deficit deja existant | Meme annee dans le stock | Verifier l'historique |
| Solde nul | Deficit totalement utilise | Changer le statut |

---

## 6. Acomptes

### A) A quoi sert cette page ?
Suivre les acomptes creation, provisionnels et douaniers.

### B) Comment y acceder ?
- Menu : Acomptes
- URL : http://localhost:5173/acomptes

### C) Que voit-on a l'ecran ?
```text
+-------------------------------------------------------------------+
| Acomptes IR                             | Exercice 2026      |
|-------------------------------------------------------------------|
| IR N-1 | Total exigibles | Cumul verse | Solde a payer | Echeance |
|-------------------------------------------------------------------|
| 40M    | 60M             | 15M         | 45M           | 15 mai   |
+-------------------------------------------------------------------+
```

### D) Comment l'utiliser ?
1. Choisir le contribuable.
2. Choisir l'annee.
3. Lire les echeances 15 mai et 15 novembre.
4. Valider les paiements selon le statut.

### E) Quels calculs sont declenches ?
- Acompte de creation au moment de l'immatriculation
- Acompte provisionnel = 50 % x IR N-1
- Acompte douane = 2 % x valeur CAF

### F) Quels impacts sur les autres pages ?
- Paiements : paiement d'un acompte
- Penalites : interets de retard si paiement tardif
- Dashboard : montant exigible

### G) Erreurs frequentes
| Erreur | Cause | Solution |
|---|---|---|
| Acompte absent | Declaration N-1 non validee | Valider la declaration precedante |
| Paiement inactif | Acompte non enregistre | Verifier le statut |

---

## 7. Paiements

### A) A quoi sert cette page ?
Enregistrer les paiements et generer les quittances des declarations, acomptes et penalites.

### B) Comment y acceder ?
- Menu : Paiements
- URL : http://localhost:5173/paiements

### C) Que voit-on a l'ecran ?
```text
+-------------------------------------------------------------------+
| Paiements                                      + Nouveau       |
|-------------------------------------------------------------------|
| Type | Reference | Montant | Date | Mode | Statut | Quittance     |
+-------------------------------------------------------------------+
```

### D) Comment l'utiliser ?
1. Choisir le contribuable.
2. Choisir le type de paiement (acompte, IR, penalite).
3. Saisir le montant, la date et le mode.
4. Enregistrer.
5. Verifier la quittance.

### E) Quels calculs sont declenches ?
- Paiement d'un acompte : statut PAYE
- Paiement du solde IR : reduction du solde a payer
- Paiement d'une penalite : statut PAYEE
- Generation d'une quittance unique

### F) Quels impacts sur les autres pages ?
- Declarations IR : solde et statut mis a jour
- Acomptes : montant verse enregistree
- Penalites : statut de reglement
- Dashboard : KPIs de recette

### G) Erreurs frequentes
| Erreur | Cause | Solution |
|---|---|---|
| Montant invalide | Valeur nulle ou negative | Corriger le montant |
| Paiement trop eleve | Depot superieur au montant du | Verifier le solde |

---

## 8. Penalites

### A) A quoi sert cette page ?
Suivre les penalites d'amende de depot et de majoration de retard.

### B) Comment y acceder ?
- Menu : Penalites
- URL : http://localhost:5173/penalites

### C) Que voit-on a l'ecran ?
```text
+-------------------------------------------------------------------+
| Penalites                      | Annee 2026 | Total du 1,5M   |
|-------------------------------------------------------------------|
| Type | Base | Taux | Mois | Montant | Statut | Action |
+-------------------------------------------------------------------+
```

### D) Comment l'utiliser ?
1. Choisir un contribuable et une annee.
2. Selectionner la declaration concernée.
3. Calculer l'amende de depot ou la majoration.
4. Regler ou annuler la penalite si besoin.

### E) Quels calculs sont declenches ?
- Amende de depot tardif : montant fixe selon le CA
- Majoration de retard : 1 %/mois sur le solde net
- Intérêts de retard sur acompte : 1 %/mois sur le montant de l'acompte

### F) Quels impacts sur les autres pages ?
- Paiements : reglement d'une penalite
- Dashboard : total du et total paye
- Audit : decisions et remarques

### G) Erreurs frequentes
| Erreur | Cause | Solution |
|---|---|---|
| Aucune penalite | Pas de retard ou pas de declaration | Verifier les echeances |
| Calcul hors regle | Date de reference incorrecte | Utiliser la bonne date |

---

## 9. Suspensions / arret et reprise

### A) A quoi sert cette page ?
Gerer les arrets d'activite et leur impact fiscal sur le minimum de perception.

### B) Comment y acceder ?
- Menu : Arret / reprise
- URL : http://localhost:5173/suspensions

### C) Que voit-on a l'ecran ?
```text
+---------------------------------------------------------------+
| Arret et reprise          + Nouvelle demande                 |
|---------------------------------------------------------------|
| Declaration | Periode | Statut | Impact fiscal | Agent         |
+---------------------------------------------------------------+
```

### D) Comment l'utiliser ?
1. Choisir un contribuable.
2. Saisir la periode d'arret.
3. Valider la demande.
4. Suivre le statut ACTIF / SUSPENDU / REACTIVE.

### E) Quels calculs sont declenches ?
- Prorata de mois actifs
- Minimum de perception reduit selon les mois d'activite

### F) Quels impacts sur les autres pages ?
- Declarations IR : base comparee aux mois actifs
- Acomptes : impact sur les echeances
- Dashboard : indicateurs de continuit e9 d'activite

### G) Erreurs frequentes
| Erreur | Cause | Solution |
|---|---|---|
| Periode incoherente | Date fin avant date debut | Corriger la periode |
| Minimum non calcul e9 | Absence de date de reprise | Verifier la declaration |

---

## 10. Dashboard

### A) A quoi sert cette page ?
Mise en perspective des performances fiscales globales du centre.

### B) Comment y acceder ?
- Menu : Tableau de bord
- URL : http://localhost:5173/dashboard

### C) Que voit-on a l'ecran ?
```text
+---------------------------------------------------------------+
| KPIs fiscaux | Total IR | Deficits | Acomptes | Penalites |
|-----------------------------------------------------------------|
| Graphiques | Tendance | Statuts | Alertes | Evolution annuelle |
+---------------------------------------------------------------+
```

### D) Comment l'utiliser ?
1. Choisir l'annee.
2. Analyser les indicateurs.
3. Cliquer sur une carte pour aller vers le module associe.

### E) Quels calculs sont declenches ?
Aucun calcul principal. Le dashboard consolide les resultats des autres modules.

### F) Quels impacts sur les autres pages ?
- Pas de mise a jour directe, mais il refl e8te tout l'ecosysteme fiscale.

### G) Erreurs frequentes
| Erreur | Cause | Solution |
|---|---|---|
| KPI vide | Donnees non initialisees | Charger un dossier |
| Donnees obsoletes | Donnees non rafraichies | Recharger la page |

---

## 11. Journal d'audit

### A) A quoi sert cette page ?
Tracer les actions critiques de l'application : creation, validation, paiement, annulation, remise.

### B) Comment y acceder ?
- Menu : Audit
- URL : http://localhost:5173/audit

### C) Que voit-on a l'ecran ?
```text
+---------------------------------------------------------------+
| Journal d'audit                                          |
|-----------------------------------------------------------------|
| Date | Utilisateur | Action | Module | Details | Resultat |
+---------------------------------------------------------------+
```

### D) Comment l'utiliser ?
1. Filtrer par date ou par utilisateur.
2. Identifier l'origine de l'action.
3. Verifier la traçabilité des calculs et paiements.

### E) Quels calculs sont declenches ?
Aucun calcul de fiscalite, mais logique de trace pour chacune des actions.

### F) Quels impacts sur les autres pages ?
- Confiance dans les decisions
- Analyse de cause de correction

### G) Erreurs frequentes
| Erreur | Cause | Solution |
|---|---|---|
| Journal vide | Aucune action effectuee | Realiser une action |
| Trace incomplete | Permissions insuffisantes | Verifier les roles |

---

## 12. Workflow clef en main

### Exemple complet
1. Un contribuable est cree.
2. Une declaration IR est ouverte.
3. Le calcul fiscal est lance.
4. Le deficit est impute ou cree.
5. Les acomptes sont generes a la validation.
6. Les paiements sont enregistres.
7. Les penalites sont calculees si necessaire.
8. Le dashboard et le journal d'audit se mettent a jour.

### Impact global
La page Paiements est la convergence finale de toutes les obligations fiscales. Elle centralise les flux de :
- declarations
- acomptes
- penalites
- deficits
- suspensions

---

## 13. Recommandations

- Toujours valider la declaration avant de l'associer a un paiement.
- Verifier le stock de deficit avant chaque calcul.
- Faire attention aux dates d'echeance et de depot.
- Verifier le regime et le secteur au moment de la creation du contribuable.
- Ne jamais enregistrer un paiement sans controle de la quittance.
