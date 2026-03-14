# ESMT Task Manager — Documentation Complète

> **École Supérieure Multinationale des Télécommunications**  
> Application de gestion collaborative des tâches pour les enseignants et étudiants.

---

## Table des matières

1. [Présentation du projet](#présentation-du-projet)
2. [Architecture technique](#architecture-technique)
3. [Modèles de données](#modèles-de-données)
4. [Routes API complètes](#routes-api-complètes)
5. [Règles métier](#règles-métier)
6. [Installation et configuration](#-installation-et-configuration)
7. [Lancement du projet](#-lancement-du-projet)
8. [Tests](#-tests)
9. [Structure des fichiers](#-structure-des-fichiers)
10. [Interface utilisateur](#-interface-utilisateur)

---

## Présentation du projet

**ESMT Task Manager** est une application web de gestion collaborative des tâches, conçue spécifiquement pour l'ESMT (École Supérieure Multinationale des Télécommunications). Elle fonctionne comme un **Google Classroom** orienté gestion de tâches.

### Deux profils utilisateurs

| Rôle | Permissions |
|------|-------------|
| **Professeur** | Crée des projets, ajoute des étudiants, crée et assigne des tâches, consulte les statistiques et primes |
| **Étudiant** | Voit ses projets et ses tâches, met à jour le statut de ses tâches |

### Système de primes

| Performance | Prime |
|-------------|-------|
| **100%** des tâches dans les délais | **100 000 FCFA** |
| **≥ 90%** des tâches dans les délais | **30 000 FCFA** |
| **< 90%** des tâches dans les délais | **Pas de prime** |

---

## Architecture technique

```
┌─────────────────────────────────────────────────┐
│                  FRONTEND Angular                │
│  (Port 4200 - http://localhost:4200)            │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │  Auth    │  │ Projets  │  │   Tâches     │  │
│  │ Login    │  │  Liste   │  │   Kanban     │  │
│  │ Register │  │  Détail  │  │   Détail     │  │
│  └──────────┘  └──────────┘  └──────────────┘  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │Dashboard │  │  Stats   │  │   Profil     │  │
│  │          │  │  Primes  │  │              │  │
│  └──────────┘  └──────────┘  └──────────────┘  │
└──────────────────┬──────────────────────────────┘
                   │ HTTP (JWT Bearer Token)
                   │ CORS autorisé
┌──────────────────▼──────────────────────────────┐
│                BACKEND Django                    │
│  (Port 8000 - http://localhost:8000)            │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │  users   │  │ projects │  │    tasks     │  │
│  │ app      │  │ app      │  │    app       │  │
│  └──────────┘  └──────────┘  └──────────────┘  │
│  ┌──────────────────────────┐                   │
│  │     statistics app       │                   │
│  └──────────────────────────┘                   │
└──────────────────┬──────────────────────────────┘
                   │ Django ORM
┌──────────────────▼──────────────────────────────┐
│         Base de données SQLite / PostgreSQL      │
└─────────────────────────────────────────────────┘
```

### Stack technique

| Composant | Technologie | Version |
|-----------|-------------|---------|
| **Backend** | Django | 4.2 |
| **API REST** | Django REST Framework | 3.14 |
| **Authentification** | JWT (simplejwt) + Allauth | - |
| **CORS** | django-cors-headers | 4.3 |
| **Frontend** | Angular | 17 |
| **Styles** | SCSS personnalisé (couleurs ESMT) | - |
| **Base de données** | SQLite (dev) / PostgreSQL (prod) | - |
| **Tests** | pytest-django | 4.7 |

---

## Modèles de données

### 1. `UtilisateurESMT` (étend `AbstractUser`)

```python
class UtilisateurESMT(AbstractUser):
    role          = CharField(choices=['PROFESSEUR', 'ETUDIANT'])
    avatar        = ImageField(upload_to='avatars/')
    departement   = CharField(max_length=100)
    bio           = TextField()
    date_creation = DateTimeField(auto_now_add=True)
    # USERNAME_FIELD = 'email' (connexion par email)
```

**Relations :**
- `projets_crees` → Projet (via ForeignKey, si Professeur)
- `projets_membres` → Projet (via ManyToMany)
- `taches_creees` → Tache (si Professeur)
- `taches_assignees` → Tache (si Étudiant)

---

### 2. `Projet`

```python
class Projet(models.Model):
    titre          = CharField(max_length=200)
    description    = TextField()
    createur       = ForeignKey(UtilisateurESMT, limit_choices_to={'role': 'PROFESSEUR'})
    membres        = ManyToManyField(UtilisateurESMT, through='MembreProjet')
    statut         = CharField(choices=['EN_COURS', 'TERMINE', 'ARCHIVE', 'SUSPENDU'])
    couleur        = CharField(max_length=7)  # Code hex couleur
    date_debut     = DateField()
    date_fin_prevue = DateField(null=True)
    date_creation  = DateTimeField(auto_now_add=True)
```

**Propriétés calculées :**
- `nombre_taches` → int
- `nombre_taches_terminees` → int
- `progression` → float (%)

---

### 3. `MembreProjet` (table intermédiaire)

```python
class MembreProjet(models.Model):
    projet          = ForeignKey(Projet)
    utilisateur     = ForeignKey(UtilisateurESMT)
    date_adhesion   = DateTimeField(auto_now_add=True)
    role_dans_projet = CharField(max_length=50)
    # unique_together: ['projet', 'utilisateur']
```

---

### 4. `Tache`

```python
class Tache(models.Model):
    titre               = CharField(max_length=200)
    description         = TextField()
    projet              = ForeignKey(Projet)
    assigne_a           = ForeignKey(UtilisateurESMT, limit_choices_to={'role': 'ETUDIANT'})
    cree_par            = ForeignKey(UtilisateurESMT, limit_choices_to={'role': 'PROFESSEUR'})
    statut              = CharField(choices=['A_FAIRE', 'EN_COURS', 'EN_REVISION', 'TERMINE', 'ANNULE'])
    priorite            = CharField(choices=['BASSE', 'NORMALE', 'HAUTE', 'URGENTE'])
    date_limite         = DateTimeField()
    date_completion     = DateTimeField(null=True)
    termine_dans_delais = BooleanField(null=True)  # Calculé automatiquement
    ordre               = PositiveIntegerField()
    etiquettes          = CharField(max_length=200)  # "frontend,urgent"
```

**Propriétés calculées :**
- `est_en_retard` → bool
- `jours_restants` → int

---

### 5. `CommentaireTache`

```python
class CommentaireTache(models.Model):
    tache       = ForeignKey(Tache)
    auteur      = ForeignKey(UtilisateurESMT)
    contenu     = TextField()
    date_creation = DateTimeField(auto_now_add=True)
```

---

## Routes API complètes

**URL de base :** `http://localhost:8000/api/v1/`

### Authentification

| Méthode | URL | Description | Auth requise |
|---------|-----|-------------|:---:|
| `POST` | `/auth/token/` | Connexion → retourne `access` + `refresh` | ❌ |
| `POST` | `/auth/token/rafraichir/` | Rafraîchir le token d'accès | ❌ |
| `POST` | `/auth/token/verifier/` | Vérifier la validité d'un token | ❌ |

**Exemple connexion :**
```json
// POST /api/v1/auth/token/
{
  "email": "prof.diallo@esmt.sn",
  "password": "MonMotDePasse123"
}

// Réponse 200 OK
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGci...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGci..."
}
```

---

### Utilisateurs

| Méthode | URL | Description | Rôle requis |
|---------|-----|-------------|-------------|
| `POST` | `/utilisateurs/inscription/` | Créer un compte | Public |
| `GET` | `/utilisateurs/profil/` | Voir son profil | Tous |
| `PUT/PATCH` | `/utilisateurs/profil/` | Modifier son profil | Tous |
| `POST` | `/utilisateurs/changer-mot-de-passe/` | Changer son mot de passe | Tous |
| `GET` | `/utilisateurs/` | Lister tous les utilisateurs | Tous |
| `GET` | `/utilisateurs/etudiants/` | Lister les étudiants | Tous |
| `GET` | `/utilisateurs/professeurs/` | Lister les professeurs | Tous |

**Exemple inscription :**
```json
// POST /api/v1/utilisateurs/inscription/
{
  "email": "fatou.sow@esmt.sn",
  "username": "fatou_sow",
  "first_name": "Fatou",
  "last_name": "Sow",
  "role": "ETUDIANT",
  "departement": "Informatique et Réseaux",
  "mot_de_passe": "MonMotDePasse123!",
  "confirmation_mot_de_passe": "MonMotDePasse123!"
}
```

---

### Projets

| Méthode | URL | Description | Rôle requis |
|---------|-----|-------------|-------------|
| `GET` | `/projets/` | Lister ses projets | Tous |
| `POST` | `/projets/` | Créer un projet | Professeur |
| `GET` | `/projets/<id>/` | Détails d'un projet | Tous (membres) |
| `PUT/PATCH` | `/projets/<id>/` | Modifier un projet | Professeur (créateur) |
| `DELETE` | `/projets/<id>/` | Supprimer un projet | Professeur (créateur) |
| `GET` | `/projets/<id>/membres/` | Lister les membres | Tous |
| `POST` | `/projets/<id>/membres/` | Ajouter un étudiant | Professeur (créateur) |
| `DELETE` | `/projets/<id>/membres/<uid>/` | Retirer un membre | Professeur (créateur) |

**Filtres disponibles :**
- `?statut=EN_COURS` → Filtrer par statut
- `?recherche=mobile` → Recherche par titre

**Exemple créer un projet :**
```json
// POST /api/v1/projets/
{
  "titre": "Développement Application Mobile",
  "description": "Projet de développement d'une app mobile avec Flutter",
  "statut": "EN_COURS",
  "couleur": "#1a3a6b",
  "date_debut": "2024-01-15",
  "date_fin_prevue": "2024-03-30",
  "membres_ids": [3, 5, 7]
}
```

---

### Tâches

| Méthode | URL | Description | Rôle requis |
|---------|-----|-------------|-------------|
| `GET` | `/taches/` | Lister ses tâches | Tous |
| `POST` | `/taches/` | Créer une tâche | Professeur |
| `GET` | `/taches/<id>/` | Détails d'une tâche | Tous (concernés) |
| `PATCH` | `/taches/<id>/` | Modifier une tâche | Prof (tout) / Étudiant (statut) |
| `DELETE` | `/taches/<id>/` | Supprimer une tâche | Professeur (créateur) |
| `PATCH` | `/taches/<id>/statut/` | Mettre à jour le statut | Étudiant (ses tâches) |
| `GET` | `/taches/<id>/commentaires/` | Voir les commentaires | Tous |
| `POST` | `/taches/<id>/commentaires/` | Ajouter un commentaire | Tous |

**Filtres disponibles :**
- `?projet=<id>` → Tâches d'un projet
- `?statut=EN_COURS` → Filtrer par statut
- `?assigne_a=<id>` → Tâches d'un étudiant
- `?priorite=HAUTE` → Filtrer par priorité
- `?q=maquette` → Recherche (titre, description, tags, projet, assigné)
- `?en_retard=true` → Uniquement les tâches en retard

**Exemple créer une tâche :**
```json
// POST /api/v1/taches/
{
  "titre": "Concevoir les maquettes UI",
  "description": "Créer les wireframes et maquettes haute fidélité sur Figma",
  "projet": 1,
  "assigne_a_id": 5,
  "statut": "A_FAIRE",
  "priorite": "HAUTE",
  "date_limite": "2024-02-15T23:59:00Z",
  "etiquettes": "design,urgent,figma"
}
```

---

### Statistiques

| Méthode | URL | Description | Rôle requis |
|---------|-----|-------------|-------------|
| `GET` | `/statistiques/tableau-de-bord/` | Stats résumées | Tous |
| `GET` | `/statistiques/trimestriel/` | Stats du trimestre | Tous |
| `GET` | `/statistiques/annuel/` | Stats de l'année | Tous |
| `GET` | `/statistiques/primes/` | Évaluation primes profs | Professeur |

**Paramètres :**
- `?annee=2024` → Année
- `?trimestre=1` → Trimestre (1-4)

---

## Règles métier

### Règles de permissions

```
1. CRÉATION DE PROJETS
   OUI Professeur → peut créer des projets
   NON Étudiant → INTERDIT

2. GESTION DES MEMBRES
   OUI Professeur (créateur) → peut ajouter/retirer des étudiants
   NON Étudiant → INTERDIT
   NON Ajouter un autre professeur comme membre → INTERDIT

3. CRÉATION DE TÂCHES
   OUI Professeur (créateur du projet) → peut créer des tâches
   NON Étudiant → INTERDIT
   NON Assigner une tâche à un professeur → INTERDIT

4. MODIFICATION DES TÂCHES
   OUI Professeur → peut tout modifier
   OUI Étudiant → peut UNIQUEMENT modifier le statut de ses propres tâches
   NON Étudiant modifiant une tâche d'un autre → INTERDIT

5. SUPPRESSION
   OUI Seulement le créateur peut supprimer ses projets/tâches
```

### Calcul des primes

```python
def calculer_prime(pourcentage_dans_delais):
    if pourcentage_dans_delais == 100:
        return 100_000  # FCFA
    elif pourcentage_dans_delais >= 90:
        return 30_000   # FCFA
    else:
        return 0        # Pas de prime
```

---

## Installation et configuration

### Prérequis

- Python 3.10+
- Node.js 18+
- npm 9+
- Git

---

### Backend Django

#### 1. Cloner et créer l'environnement virtuel

```bash
# Cloner le dépôt
git clone https://github.com/votre-repo/esmt-taskmanager.git
cd esmt-taskmanager/backend

# Créer et activer l'environnement virtuel
python -m venv venv

# Linux/Mac
source venv/bin/activate

# Windows
venv\Scripts\activate
```

#### 2. Installer les dépendances

```bash
pip install -r requirements.txt
```

#### 3. Configurer les variables d'environnement

```bash
# Créer le fichier .env
cp .env.example .env
```

Contenu du `.env` :
```env
# Clé secrète Django (générer avec: python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())")
SECRET_KEY=votre-cle-secrete-tres-longue-ici

# Mode debug
DEBUG=True

# Hôtes autorisés (séparés par virgule)
ALLOWED_HOSTS=localhost,127.0.0.1

# Base de données (optionnel - SQLite par défaut)
# DB_NAME=esmt_taskmanager
# DB_USER=postgres
# DB_PASSWORD=motdepasse
# DB_HOST=localhost
# DB_PORT=5432
```

#### 4. Appliquer les migrations

```bash
# Créer les tables en base de données
python manage.py makemigrations users
python manage.py makemigrations projects
python manage.py makemigrations tasks
python manage.py makemigrations statistics
python manage.py migrate

# Créer les données initiales du site (pour allauth)
python manage.py shell -c "from django.contrib.sites.models import Site; Site.objects.get_or_create(id=1, defaults={'domain': 'localhost:8000', 'name': 'ESMT Task Manager'})"
```

#### 5. Créer un compte administrateur

```bash
python manage.py createsuperuser
# Email: admin@esmt.sn
# Mot de passe: (choisir un mot de passe fort)
```

#### 6. (Optionnel) Charger des données de démo

```bash
python manage.py loaddata fixtures/demo_data.json
```

---

### Frontend Angular

```bash
# Aller dans le dossier frontend
cd ../frontend

# Installer les dépendances Angular
npm install
```

---

## Lancement du projet

### Démarrer le backend Django

```bash
cd backend
source venv/bin/activate  # (ou venv\Scripts\activate sur Windows)
python manage.py runserver
# Serveur disponible sur http://localhost:8000
```

### Démarrer le frontend Angular

```bash
cd frontend
npm run start
# Application disponible sur http://localhost:4200
```

> **Note Windows (PowerShell)** : si `npm` affiche une erreur de signature (`npm.ps1`), utilisez `npm.cmd` :
> `npm.cmd install` puis `npm.cmd run start`.

### Interface d'administration Django

```
http://localhost:8000/admin/
```

### Documentation API interactive

```
http://localhost:8000/api/v1/
```

---

## Tests

### Lancer tous les tests

```bash
cd backend
pytest
```

### Lancer avec rapport de couverture

```bash
pytest --cov=. --cov-report=html
# Rapport disponible dans htmlcov/index.html
```

### Lancer une catégorie de tests spécifique

```bash
# Tests des utilisateurs uniquement
pytest tests/test_api.py::TestAuthentification -v

# Tests des projets
pytest tests/test_api.py::TestProjet -v

# Tests des statistiques et primes
pytest tests/test_api.py::TestStatistiquesEtPrimes -v

# Tests des permissions
pytest tests/test_api.py::TestPermissions -v
```

### Résultats attendus

```
============================= test session starts ==============================
tests/test_api.py::TestModeleUtilisateur::test_creation_professeur PASSED
tests/test_api.py::TestModeleUtilisateur::test_creation_etudiant PASSED
tests/test_api.py::TestAuthentification::test_inscription_professeur_reussie PASSED
tests/test_api.py::TestAuthentification::test_connexion_reussie PASSED
tests/test_api.py::TestProjet::test_professeur_peut_creer_projet PASSED
tests/test_api.py::TestProjet::test_etudiant_ne_peut_pas_creer_projet PASSED
tests/test_api.py::TestTache::test_ne_peut_pas_assigner_prof_a_tache PASSED
tests/test_api.py::TestStatistiquesEtPrimes::test_calcul_prime_100_pourcent PASSED
tests/test_api.py::TestStatistiquesEtPrimes::test_calcul_prime_90_pourcent PASSED
tests/test_api.py::TestPermissions::test_acces_sans_authentification_refuse PASSED
============================== 20+ passed in 3.45s =============================
```

---

## Structure des fichiers

```
esmt-taskmanager/
│
├── backend/                         # Application Django
│   ├── config/                      # Configuration Django
│   │   ├── settings.py                 # Paramètres (DB, JWT, CORS, primes)
│   │   ├── urls.py                     # Routes URL principales
│   │   └── wsgi.py                     # Déploiement WSGI
│   │
│   ├── users/                       # App gestion utilisateurs
│   │   ├── models.py                   # UtilisateurESMT (Professeur/Étudiant)
│   │   ├── serializers.py              # Sérialiseurs (inscription, profil)
│   │   ├── views.py                    # Vues API (inscription, profil, liste)
│   │   ├── urls.py                     # Routes /api/v1/utilisateurs/
│   │   └── admin.py                    # Interface admin
│   │
│   ├── projects/                    # App gestion projets
│   │   ├── models.py                   # Projet, MembreProjet
│   │   ├── serializers.py              # Sérialiseurs projets
│   │   ├── views.py                    # CRUD projets + membres
│   │   └── urls.py                     # Routes /api/v1/projets/
│   │
│   ├── tasks/                       # App gestion tâches
│   │   ├── models.py                   # Tache, CommentaireTache
│   │   ├── serializers.py              # Sérialiseurs tâches
│   │   ├── views.py                    # CRUD tâches + commentaires
│   │   └── urls.py                     # Routes /api/v1/taches/
│   │
│   ├── statistics/                  # App statistiques et primes
│   │   ├── views.py                    # Stats tableau bord, trimestriel, annuel, primes
│   │   └── urls.py                     # Routes /api/v1/statistiques/
│   │
│   ├── tests/
│   │   └── test_api.py                 # 20+ tests unitaires (pytest-django)
│   │
│   ├── pytest.ini                      # Configuration pytest
│   ├── requirements.txt                # Dépendances Python
│   └── manage.py                       # Utilitaire Django
│
└── frontend/                        # Application Angular
    └── src/
        ├── app/
        │   ├── auth/                # Pages connexion/inscription
        │   │   ├── login/              # Composant connexion
        │   │   └── register/           # Composant inscription (wizard 2 étapes)
        │   │
        │   ├── dashboard/           # Tableau de bord
        │   │
        │   ├── projects/            # Gestion des projets
        │   │   ├── list/               # Liste des projets (style Google Classroom)
        │   │   ├── detail/             # Détail avec membres et tâches
        │   │   └── form/               # Formulaire création/édition
        │   │
        │   ├── tasks/               # Gestion des tâches
        │   │   ├── kanban/             # Vue Kanban par statut
        │   │   ├── detail/             # Détail tâche + commentaires
        │   │   └── form/               # Formulaire (prof seulement)
        │   │
        │   ├── statistics/          # Statistiques et primes
        │   │
        │   ├── profile/             # Profil utilisateur
        │   │
        │   ├── shared/              # Partagé entre composants
        │   │   ├── models/
        │   │   │   └── interfaces.ts   # Interfaces TypeScript
        │   │   ├── services/
        │   │   │   ├── auth.service.ts       # JWT, connexion/déco
        │   │   │   ├── projet.service.ts     # CRUD projets
        │   │   │   ├── tache.service.ts      # CRUD tâches
        │   │   │   ├── statistique.service.ts # Stats et primes
        │   │   │   └── jwt.intercepteur.ts   # Ajout automatique Bearer token
        │   │   └── guards/
        │   │       └── auth.garde.ts         # Protection des routes
        │   │
        │   ├── app.component.*         # Layout principal + navbar mobile
        │   ├── app.module.ts           # Module racine Angular
        │   └── app-routing.module.ts   # Routing avec gardes
        │
        ├── assets/images/
        │   └── esmt-logo.png           # Logo ESMT (copier ici)
        │
        ├── styles.scss                 # Styles globaux + variables ESMT
        └── environments/
            └── environment.ts          # URL API Django
```

---

## Interface utilisateur

### Design inspiré du "Project Manager"

L'interface reprend le design de l'image téléchargée :

- **Sidebar gauche** : Navigation avec logo ESMT, menu coloré en bleu foncé ESMT
- **Barre mobile en bas** : Identique au Project Manager avec le bouton `+` central noir
- **Cartes projets** : Style Google Classroom avec couleur personnalisable
- **Kanban** : Vue par statut (À faire / En cours / Terminé)
- **Filtres avancés** : recherche + filtres synchronisés dans l'URL sur la page des tâches
- **Pages détail** : `/projets/:id` et `/taches/:id` (édition + commentaires)

### Palette de couleurs ESMT

```scss
--esmt-bleu-fonce : #1a3a6b  /* Couleur principale ESMT */
--esmt-bleu       : #1e4d8c  /* Bleu intermédiaire */
--esmt-bleu-clair : #2d6bc4  /* Bleu clair (boutons) */
--esmt-vert       : #3cb878  /* Vert ESMT (progression) */
--esmt-cyan       : #00a8cc  /* Cyan (accent) */
```

### Vues principales

| Vue | Professeur | Étudiant |
|-----|-----------|---------|
| **Tableau de bord** | Stats projets, tâches, primes | Stats perso, tâches urgentes |
| **Projets** | Créer, gérer membres, voir progression | Voir ses cours |
| **Tâches** | Créer, assigner, vue Kanban | Voir ses tâches, changer statut |
| **Statistiques** | Classement primes, bilan trimestriel | Son bilan personnel |
| **Profil** | Modifier nom, avatar, mdp | Modifier nom, avatar, mdp |

---

## Déploiement en production

### Backend (ex: Ubuntu + Gunicorn + Nginx)

```bash
# Installer Gunicorn
pip install gunicorn

# Configurer les variables d'environnement
export DEBUG=False
export SECRET_KEY="cle-tres-secrete-production"
export ALLOWED_HOSTS="votredomaine.com"

# Collecter les fichiers statiques
python manage.py collectstatic

# Lancer Gunicorn
gunicorn config.wsgi:application --bind 0.0.0.0:8000
```

### Frontend (build de production)

```bash
cd frontend
npm run build
# Les fichiers sont dans dist/esmt-taskmanager-frontend/
# Servir avec Nginx
```

> **Windows (si erreur `spawn EPERM` sur esbuild)** : essayez de débloquer le binaire :
> `Unblock-File frontend\\node_modules\\@esbuild\\win32-x64\\esbuild.exe`

---

## Contributeurs

Projet développé dans le cadre du cours de développement web avancé avec DJANGO à l'**ESMT** (École Supérieure Multinationale des Télécommunications, Dakar, Sénégal).

---

*© 2026 — École Supérieure Multinationale des Télécommunications (ESMT)*
