# 🎙️ Discours de Soutenance : ESMT Task Manager
*Conformément au Cahier des Charges*

---

## 1. Introduction et Contexte
"Monsieur le Président, Messieurs les membres du jury.

Je vous présente mon application de **Gestion des Tâches Collaboratives**, développée spécifiquement pour l'environnement de l'**ESMT**. 

La mission était claire : concevoir une plateforme où enseignants et étudiants peuvent collaborer sur des projets, avec un système d'évaluation de la performance permettant d'attribuer des primes au mérite."

## 2. Objectif 1 : Le Socle Django (Templates)
"Conformément au premier objectif du cahier des charges, j'ai d'abord mis en place le socle de l'application en utilisant les **Templates Django**. 
Ce socle assure :
- **La Gestion des Utilisateurs** : Un système complet d'inscription et de connexion avec gestion des profils (mise à jour de l'avatar, de l'email et du mot de passe).
- **La Gestion des Projets** : La possibilité de créer, modifier ou supprimer un projet en tant que base de travail."

## 3. Objectif 2 : L'Expérience Moderne (Angular)
"Pour le second objectif, j'ai développé un frontend dynamique sous **Angular 18** connecté à une **API REST**. C'est ici que la gestion des tâches prend tout son sens :
- **Tâches et Collaboration** : Chaque tâche est liée à un projet avec un titre, une description, une date limite et un statut.
- **Règle métier stricte** : J'ai implémenté une contrainte logicielle empêchant un étudiant d'assigner une tâche à un professeur.
- **Permissions et Rôles** : Seul le créateur du projet a les privilèges d'ajout ou de suppression de membres et de tâches. Les utilisateurs assignés, eux, ne peuvent modifier que le statut des tâches qui leur sont attribuées."

## 4. Statistiques et Système de Primes
"Le point central de ma réalisation est le module de statistiques trimestrielles et annuelles. 
J'ai codé la logique métier pour l'évaluation automatique des primes :
- **Prime de 100 000 FCFA** : Pour les enseignants membres d'équipe qui terminent **100%** de leurs tâches dans les délais.
- **Prime de 30 000 FCFA** : Pour ceux qui atteignent le seuil de **90%**.
Cette fonctionnalité permet un suivi objectif et transparent de la progression des membres."

## 5. Spécifications Techniques
"Techniquement, l'application repose sur :
- **Backend** : Django avec **Django REST Framework** pour l'API. Nous utilisons **Django Allauth** pour l'authentification et **JWT** pour la sécurisation des échanges avec le frontend.
- **Base de données** : SQLite (migrable vers PostgreSQL).
- **Qualité de code** : J'ai implémenté des **tests unitaires avec Pytest-Django** pour valider les fonctionnalités de calcul et les permissions."

## 6. Démonstration (À dire pendant que tu montres l'écran)

**[Vue Profil]** : "Voici l'interface de gestion de profil où l'on peut changer son avatar et ses informations, conformément à l'objectif 1."

**[Vue Projet]** : "Je crée un projet. En tant que créateur, je suis le seul à pouvoir ajouter des membres. Si j'essaie d'assigner un prof à une tâche en tant qu'étudiant, le système bloque l'action, respectant ainsi nos règles de permissions."

**[Vue Statistiques]** : "Enfin, ce tableau de bord affiche les graphiques trimestriels et indique directement si l'utilisateur a droit à sa prime de 30K ou 100K selon son efficacité."

## 7. Conclusion
"Pour conclure, ce projet respecte l'ensemble des livrables demandés : un code source complet, une documentation structurée, et une application fonctionnelle prête pour l'ESMT.

Je vous remercie et je suis prêt pour vos questions."
