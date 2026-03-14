# Guide de Présentation - ESMT Task Manager
## Script de soutenance et Points clés

Ce document t'accompagne pour ta présentation orale. Il est structuré pour maximiser l'impact visuel et démontrer la solidité technique de ton travail.

---

## 🕒 Structure de la présentation (10-15 min)

### 1. Introduction & Contexte (2 min)
*   **Accroche** : "Face à la complexité des projets à l'ESMT, nous avons besoin d'un outil qui non seulement gère les tâches, mais motive aussi les intervenants."
*   **Objectif** : Présenter une solution collaborative avec un système de gratification (primes) basé sur la donnée réelle.

### 2. Démonstration du Produit (7 min) - LE CUR
*C'est ici que tu montres l'application Angular.*

#### A. Vision Professeur (Interface Premium)
1.  **Dashboard** : Montre les cartes de statistiques (0.0% glassmorphism). Explique que le dashboard donne une vue d'ensemble immédiate sur les retards.
2.  **Gestion de Projet** : Crée un projet en direct. Ajoute un membre.
3.  **Tâches** : Crée une tâche. Explique que la priorité et la date limite sont cruciales pour le calcul futur de la prime.
4.  **Vue Statistiques** : Montre l'onglet statistiques. C'est ici que le "bonus" de 100k ou 30k s'affiche. Explique que c'est calculé dynamiquement par le backend.

#### B. Vision Étudiant
1.  Connecte-toi avec `etudiant@esmt.sn`.
2.  Montre que l'étudiant a une vue restreinte : il ne voit que ses tâches assignées.
3.  **Action** : Marque une tâche comme "Terminée". Explique que cette action déclenche instantanément le calcul du respect du délai dans le backend.

#### C. Templates Django (Objectif 1) - `http://127.0.0.1:8000`
1.  Montre que l'application possède aussi un frontend SSR (Server Side Rendering) complet avec Django Templates.
2.  Explique que c'est une exigence du cahier des charges pour garantir une accessibilité maximale et un bon référencement (SEO).

### 3. Architecture Technique (3 min)
*   **Backend** : Python/Django pour la robustesse et la sécurité. API RESTful documentée.
*   **Frontend** : Angular pour une interface réactive et moderne ("Premium Feeling").
*   **Logique Métier** : Explique brièvement comment tu as codé le calcul du pourcentage de réussite dans les délais pour les primes.

### 4. Conclusion & Questions (2 min)
*   "L'application est prête, testée avec 36 tests unitaires automatisés, et répond à 100% des exigences du cahier des charges."

---

## 💡 Conseils pour impressionner le jury

1.  **Parler de "Glassmorphism"** : Quand tu montres le design, utilise ce terme. C'est le style moderne effet verre dépoli que nous avons mis en place. Cela montre que tu suis les tendances UI.
2.  **Mentionner la Validation** : Précise que tu as implémenté des validations strictes (exemple : un étudiant ne peut pas modifier la tâche d'un autre étudiant).
3.  **Tests Unitaires** : Mentionne fièrement que tu as une suite de tests automatisés. Dans le monde professionnel, c'est ce qui différencie un étudiant d'un ingénieur.
4.  **Responsive** : Redimensionne la fenêtre du navigateur pendant la démo pour montrer que l'interface s'adapte parfaitement au mobile.

---

## 🔐 Rappel des Identifiants
*   **PROFESSEUR** : `admin@esmt.sn` | `admin123`
*   **ÉTUDIANT** : `etudiant@esmt.sn` | `admin123`

---

**Bonne chance pour ta présentation !** Tu as un projet solide entre les mains.
