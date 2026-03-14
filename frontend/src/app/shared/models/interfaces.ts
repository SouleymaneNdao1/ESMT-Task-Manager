/**
 * =============================================================
 *   ESMT Task Manager - Interfaces TypeScript (Modèles)
 * =============================================================
 * Définition de toutes les interfaces TypeScript correspondant
 * aux modèles Django de l'API backend.
 */

// =============================================================
// Interface Utilisateur
// =============================================================
export interface Utilisateur {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  nom_complet: string;
  role: 'PROFESSEUR' | 'ETUDIANT';
  departement: string;
  bio: string;
  avatar: string | null;
  avatar_url: string;
  nombre_projets?: number;
  nombre_taches?: number;
  date_creation?: string;
  last_login?: string;
}

// Données de connexion
export interface ConnexionDonnees {
  email: string;
  password: string;
}

// Réponse de connexion avec tokens JWT
export interface ConnexionReponse {
  access: string;   // Token d'accès (8h)
  refresh: string;  // Token de rafraîchissement (7j)
}

// Données d'inscription
export interface InscriptionDonnees {
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: 'PROFESSEUR' | 'ETUDIANT';
  departement: string;
  mot_de_passe: string;
  confirmation_mot_de_passe: string;
}

// =============================================================
// Interface Projet
// =============================================================
export interface Projet {
  id: number;
  titre: string;
  description: string;
  createur: Utilisateur;
  statut: 'EN_COURS' | 'TERMINE' | 'ARCHIVE' | 'SUSPENDU';
  couleur: string;
  image: string | null;
  date_debut: string;
  date_fin_prevue: string | null;
  nombre_membres: number;
  nombre_taches: number;
  nombre_taches_terminees: number;
  progression: number;
  date_creation: string;
  membres_details?: MembreProjet[];
}

// Membre d'un projet
export interface MembreProjet {
  id: number;
  utilisateur: Utilisateur;
  date_adhesion: string;
  role_dans_projet: string;
}

// Données pour créer un projet
export interface CreerProjetDonnees {
  titre: string;
  description: string;
  statut: string;
  couleur: string;
  date_debut: string;
  date_fin_prevue?: string;
  membres_ids?: number[];
}

// =============================================================
// Interface Tâche
// =============================================================
export interface Tache {
  id: number;
  titre: string;
  description: string;
  projet: number;
  assigne_a: Utilisateur | null;
  cree_par: Utilisateur;
  statut: StatutTache;
  priorite: PrioriteTache;
  date_limite: string;
  date_completion: string | null;
  termine_dans_delais: boolean | null;
  est_en_retard: boolean;
  jours_restants: number;
  etiquettes: string;
  etiquettes_liste: string[];
  ordre: number;
  date_creation: string;
}

// Enum des statuts de tâche
export type StatutTache = 'A_FAIRE' | 'EN_COURS' | 'EN_REVISION' | 'TERMINE' | 'ANNULE';

// Enum des priorités
export type PrioriteTache = 'BASSE' | 'NORMALE' | 'HAUTE' | 'URGENTE';

// Données pour créer une tâche
export interface CreerTacheDonnees {
  titre: string;
  description: string;
  projet: number;
  assigne_a?: number | null;
  statut: StatutTache;
  priorite: PrioriteTache;
  date_limite: string;
  etiquettes?: string;
}

// Commentaire sur une tâche
export interface CommentaireTache {
  id: number;
  auteur: Utilisateur;
  contenu: string;
  date_creation: string;
}

// =============================================================
// Interfaces Statistiques
// =============================================================
export interface StatistiquesTableauBord {
  role: 'PROFESSEUR' | 'ETUDIANT';
  nombre_projets: number;
  nombre_etudiants?: number;
  taches: {
    total: number;
    a_faire: number;
    en_cours: number;
    terminees: number;
    dans_delais?: number;
    en_retard: number;
  };
  performance?: {
    pourcentage_dans_delais: number;
    total_terminees: number;
  };
}

// Informations de prime
export interface InfoPrime {
  prime: number;
  eligible_30k: boolean;
  eligible_100k: boolean;
  pourcentage: number;
}

// Statistiques trimestrielles
export interface StatsTrimestrielle {
  periode: {
    annee: number;
    trimestre: number;
    date_debut: string;
    date_fin: string;
  };
  role: string;
  taches: {
    total: number;
    terminees: number;
    dans_delais: number;
    en_retard?: number;
  };
  performance: {
    pourcentage_completion: number;
    pourcentage_dans_delais: number;
  };
  prime?: InfoPrime;
}

// Statistiques annuelles
export interface StatsAnnuelles {
  annee: number;
  role: string;
  resume_annuel: {
    total_taches: number;
    terminees: number;
    dans_delais: number;
    pourcentage_global: number;
    prime_totale_annee?: number;
  };
  par_trimestre: {
    trimestre: number;
    date_debut: string;
    date_fin: string;
    total_taches: number;
    terminees: number;
    dans_delais: number;
    pourcentage_delais: number;
    prime?: InfoPrime;
  }[];
}

// Évaluation des primes des professeurs
export interface EvaluationPrime {
  professeur: {
    id: number;
    nom: string;
    email: string;
    departement: string;
    avatar: string;
  };
  taches_terminees: number;
  dans_delais: number;
  pourcentage_dans_delais: number;
  prime: InfoPrime;
}

// =============================================================
// Interfaces utilitaires
// =============================================================

// Réponse paginée de l'API
export interface ReponsePaginee<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Message de réponse générique
export interface ReponseMessage {
  message: string;
}

// Erreurs de validation
export interface ErreursValidation {
  [champ: string]: string[];
}
