# Manuel technique

## 1. Architecture (React -> Spring Boot -> PostgreSQL)

Safidy suit une architecture monolithique simple :
- Frontend React pour UI et interactions
- Backend Spring Boot pour logique metier et APIs
- PostgreSQL pour le stockage durable des donnees
- JWT pour l'authentification

```text
React (UI)
    |
    v
Spring Boot REST API
    |
    +--> Service (calculs fiscaux)
    +--> Repository (JPA)
    +--> PostgreSQL
```

---

## 2. Stack technique

### Frontend
- React 19
- Vite
- JavaScript
- React Router
- Axios
- hooks personnalisés

### Backend
- Java 21
- Spring Boot 4.1.1
- Spring Web
- Spring Security
- Spring Data JPA
- Bean Validation
- JWT

### Base de donnees
- PostgreSQL 16
- scripts SQL dans `database/`

---

## 3. Installation et lancement

### Backend
```bash
cd ~/Desktop/safidy/backend
./mvnw spring-boot:run
```

### Frontend
```bash
cd ~/Desktop/safidy/frontend
npm install
npm run dev
```

### Base
```bash
psql -U postgres -d safidy
```

---

## 4. Structure du projet

```text
safidy/
├── backend/
│   ├── src/main/java/mg/safidy/
│   │   ├── controller/
│   │   ├── service/
│   │   ├── repository/
│   │   ├── model/
│   │   ├── dto/
│   │   ├── security/
│   │   └── exception/
│   └── src/test/java/mg/safidy/
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
├── database/
│   ├── 01_create_database.sql
│   ├── 02_create_tables.sql
│   └── ...
├── docs/
├── README.md
└── .gitignore
```

---

## 5. Modele de donnees (tables principales)

Les tables majeures sont :
- contribuable
- declaration_ir
- ligne_charge
- deficit
- utilisation_deficit
- acompte
- paiement
- penalite
- secteur_activite
- parametre_fiscal
- suspension
- audit_log
- utilisateur
- role
- centre_fiscal

### Table representative : declaration_ir
```sql
CREATE TABLE declaration_ir (
    id_declaration BIGSERIAL PRIMARY KEY,
    id_contribuable BIGINT NOT NULL,
    annee INTEGER NOT NULL,
    ca_ht BIGINT,
    total_charges BIGINT,
    resultat_comptable BIGINT,
    total_reintegrations BIGINT,
    total_deductions BIGINT,
    base_imposable BIGINT,
    ir_brut BIGINT,
    minimum_perception BIGINT,
    ir_du BIGINT,
    acomptes_verses BIGINT,
    solde_a_payer BIGINT,
    statut VARCHAR(30),
    date_limite DATE,
    date_creation TIMESTAMP
);
```

### Table representative : deficit
```sql
CREATE TABLE deficit (
    id_deficit BIGSERIAL PRIMARY KEY,
    id_contribuable BIGINT NOT NULL,
    annee_origine INTEGER NOT NULL,
    montant_initial BIGINT NOT NULL,
    montant_utilise BIGINT NOT NULL,
    solde BIGINT NOT NULL,
    annee_expiration INTEGER NOT NULL,
    statut VARCHAR(20) NOT NULL,
    date_creation TIMESTAMP NOT NULL
);
```

### Table representative : acompte
```sql
CREATE TABLE acompte (
    id_acompte BIGSERIAL PRIMARY KEY,
    id_contribuable BIGINT NOT NULL,
    annee INTEGER NOT NULL,
    numero INTEGER NOT NULL,
    taux_pct INTEGER NOT NULL,
    base_ir_n1 BIGINT NOT NULL,
    montant_ar BIGINT NOT NULL,
    date_echeance DATE NOT NULL,
    statut VARCHAR(20) NOT NULL,
    type_acompte VARCHAR(20) NOT NULL,
    date_creation TIMESTAMP NOT NULL
);
```

### Table representative : penalite
```sql
CREATE TABLE penalite (
    id_penalite BIGSERIAL PRIMARY KEY,
    id_declaration BIGINT NOT NULL,
    type VARCHAR(30) NOT NULL,
    nb_mois INTEGER,
    taux_pct DECIMAL(5,2),
    montant_ar BIGINT,
    statut VARCHAR(20),
    motif VARCHAR(60),
    base_calcul_ar BIGINT,
    article_ref VARCHAR(60),
    date_limite DATE,
    date_regularisation DATE,
    date_creation TIMESTAMP
);
```

---

## 6. API REST

### Authentification
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/me`

### Contribuables
- `GET /api/contribuables`
- `GET /api/contribuables/{id}`
- `POST /api/contribuables`
- `PUT /api/contribuables/{id}`

### Declarations IR
- `GET /api/declarations`
- `GET /api/declarations/{id}`
- `POST /api/declarations`
- `PUT /api/declarations/{id}/ca`
- `PUT /api/declarations/{id}/mois-actifs`
- `POST /api/declarations/{id}/charges`
- `POST /api/declarations/{id}/calculer`
- `POST /api/declarations/{id}/valider`

### Deficits
- `GET /api/deficits`
- `GET /api/deficits/contribuable/{id}`
- `POST /api/deficits`
- `POST /api/deficits/expirer`

### Acomptes
- `GET /api/acomptes`
- `GET /api/acomptes/contribuable/{id}`
- `GET /api/acomptes/situation/{id}`
- `GET /api/acomptes/echeances/{id}/{annee}`
- `POST /api/acomptes/douane`

### Penalites
- `GET /api/penalites/declaration/{id}`
- `GET /api/penalites/situation/{id}`
- `POST /api/penalites/amende-depot`
- `POST /api/penalites/calculer-majoration/{id}`

### Paiements
- `GET /api/paiements`
- `POST /api/paiements`
- `POST /api/paiements/{id}/annuler`

### Suspensions
- `POST /api/suspensions`
- `POST /api/suspensions/{id}/reactiver`

---

## 7. Authentification JWT

L'application s'appuie sur un JWT stocke dans le navigateur ou dans le frontend.

### Flux
1. L'utilisateur envoie email + mot de passe.
2. Backend verifie le compte.
3. JWT est genere.
4. Le token est ajoute dans l'en-tete Authorization.
5. Les routes protegees sont controlees par le filter JWT.

### Exemple
```http
Authorization: Bearer <token>
```

---

## 8. Securite

La securite est assuree par :
- Spring Security
- JWT filter
- roles AGENT / RESPONSABLE / ADMIN
- controle des autorisations sur les routes sensitives
- validation des donnees via Bean Validation

### Bonnes pratiques du projet
- Ne pas exposer les calculs dans le frontend sans backend
- Ne pas modifier directement les valeurs en base depuis le client
- Utiliser les services pour garantir la logique metier

---

## 9. ARCHITECTURE DES CALCULS

### 9.1 Principe : calculs cote backend
Tous les calculs fiscaux sont faits dans le backend. Le frontend ne fait que gerer l'interface et afficher des resultats.

### 9.2 Services de calcul

| Service | Responsabilite | Fichier |
|---------|----------------|---------|
| IRCalculationService | Calcul IR | `service/IRCalculationService.java` |
| AcompteService | 3 types d'acomptes | `service/AcompteService.java` |
| PenaliteService | 3 types de penalites | `service/PenaliteService.java` |
| DeficitService | Creation, imputation, expiration | `service/DeficitService.java` |
| SuspensionService | Arret / reprise | `service/SuspensionService.java` |
| PaiementService | Paiements et quittances | `service/PaiementService.java` |

### 9.3 Chaine d'appel
```text
Controller
    -> Service
        -> Repository
            -> PostgreSQL
```

### 9.4 Verification en cascade
1. Validation des donnees d'entree
2. Calcul metier
3. Contrat metier via BusinessException
4. Enregistrement dans la base
5. Journalisation de l'action

### 9.5 Tests
- Tests unitaires sur chaque service
- Tests de regression sur les formules de fiscalite
- Endpoints de test (ex. `/api/test-regles/*`)

---

## 10. Tests

Les tests sont principalement dans :
- `backend/src/test/java/mg/safidy/service/`

Exemples :
- `IRCalculationServiceTest.java`
- `AcompteServiceTest.java`
- `PenaliteServiceTest.java`

### Commande de test
```bash
cd ~/Desktop/safidy/backend
./mvnw test
```

---

## 11. Deploiement

### Environnement de developpement
- Spring Boot local sur port 8080
- React sur port 5173
- PostgreSQL local

### Environnement production
- Deploiement via conteneur ou VM
- Fichiers de configuration externes
- Variables d'environnement pour JWT, DB, secret key

---

## 12. Troubleshooting

### Probleme : compilation backend
```bash
cd ~/Desktop/safidy/backend
./mvnw clean install
```

### Probleme : frontend non demarre
```bash
cd ~/Desktop/safidy/frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Probleme : JWT invalide
- Verifier le secret
- Verifier la date d'expiration
- Reconnecter l'utilisateur

### Probleme : donnees incoherentes
- Verifier le stock de deficit
- Verifier l'annee de declaration
- Verifier les dates d'echeance

---

## 13. Synthese

Safidy est un monolithe fiscal Java / React. La logique de calcul est centralisee dans le backend pour garantir la coherence. Les modules se complètent : declarations, deficits, acomptes, penalties, paiements, suspensions et audit. La page Paiements est le point d'aboutissement de cette logique.
