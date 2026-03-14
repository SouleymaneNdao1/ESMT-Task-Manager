/**
 * =============================================================
 *   ESMT Task Manager - Service d'Authentification
 * =============================================================
 * Ce service gère toute la logique d'authentification :
 * - Connexion/déconnexion
 * - Stockage des tokens JWT
 * - Vérification de l'état de connexion
 * - Rafraîchissement automatique du token
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import {
  ConnexionDonnees,
  ConnexionReponse,
  InscriptionDonnees,
  Utilisateur,
  ReponseMessage
} from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // URL de base de l'API
  private readonly apiUrl = environment.apiUrl;

  // Clés de stockage local pour les tokens JWT
  private readonly CLE_TOKEN_ACCES = 'esmt_access_token';
  private readonly CLE_TOKEN_REFRESH = 'esmt_refresh_token';
  private readonly CLE_UTILISATEUR = 'esmt_utilisateur';

  // BehaviorSubject pour l'état de connexion réactif
  // Permet aux composants de s'abonner aux changements d'état
  private utilisateurCourantSubject = new BehaviorSubject<Utilisateur | null>(
    this.chargerUtilisateurDepuisStorage()
  );

  // Observable public pour les composants
  public utilisateurCourant$ = this.utilisateurCourantSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  // =============================================================
  // Getters - Accès à l'état courant
  // =============================================================

  /**
   * Retourne l'utilisateur actuellement connecté.
   */
  get utilisateurCourant(): Utilisateur | null {
    return this.utilisateurCourantSubject.value;
  }

  /**
   * Vérifie si un utilisateur est connecté.
   */
  get estConnecte(): boolean {
    return !!this.getTokenAcces() && !!this.utilisateurCourant;
  }

  /**
   * Vérifie si l'utilisateur connecté est un professeur.
   */
  get estProfesseur(): boolean {
    return this.utilisateurCourant?.role === 'PROFESSEUR';
  }

  /**
   * Vérifie si l'utilisateur connecté est un étudiant.
   */
  get estEtudiant(): boolean {
    return this.utilisateurCourant?.role === 'ETUDIANT';
  }

  // =============================================================
  // Méthodes d'authentification
  // =============================================================

  /**
   * Connecte un utilisateur avec son email et mot de passe.
   * Stocke les tokens JWT et redirige vers le tableau de bord.
   */
  seConnecter(donnees: ConnexionDonnees): Observable<ConnexionReponse> {
    return this.http.post<ConnexionReponse>(
      `${this.apiUrl}/auth/token/`,
      donnees
    ).pipe(
      tap(reponse => {
        // Stocker les tokens JWT en localStorage
        this.sauvegarderTokens(reponse.access, reponse.refresh);
        // Charger le profil de l'utilisateur
        this.chargerProfilUtilisateur().subscribe();
      }),
      catchError(erreur => {
        console.error('Erreur de connexion:', erreur);
        return throwError(() => erreur);
      })
    );
  }

  /**
   * Inscrit un nouvel utilisateur.
   */
  sInscrire(donnees: InscriptionDonnees): Observable<ReponseMessage> {
    return this.http.post<ReponseMessage>(
      `${this.apiUrl}/utilisateurs/inscription/`,
      donnees
    );
  }

  /**
   * Déconnecte l'utilisateur et nettoie le stockage local.
   */
  seDeconnecter(): void {
    // Supprimer les tokens du stockage local
    localStorage.removeItem(this.CLE_TOKEN_ACCES);
    localStorage.removeItem(this.CLE_TOKEN_REFRESH);
    localStorage.removeItem(this.CLE_UTILISATEUR);

    // Réinitialiser l'état de l'utilisateur
    this.utilisateurCourantSubject.next(null);

    // Rediriger vers la page de connexion
    this.router.navigate(['/connexion']);
  }

  /**
   * Rafraîchit le token d'accès avec le token de rafraîchissement.
   */
  rafraichirToken(): Observable<{ access: string }> {
    const tokenRefresh = this.getTokenRefresh();
    return this.http.post<{ access: string }>(
      `${this.apiUrl}/auth/token/rafraichir/`,
      { refresh: tokenRefresh }
    ).pipe(
      tap(reponse => {
        localStorage.setItem(this.CLE_TOKEN_ACCES, reponse.access);
      })
    );
  }

  /**
   * Charge le profil de l'utilisateur connecté depuis l'API.
   */
  chargerProfilUtilisateur(): Observable<Utilisateur> {
    return this.http.get<Utilisateur>(`${this.apiUrl}/utilisateurs/profil/`).pipe(
      tap(utilisateur => {
        // Mettre à jour le profil dans le subject et localStorage
        this.utilisateurCourantSubject.next(utilisateur);
        localStorage.setItem(this.CLE_UTILISATEUR, JSON.stringify(utilisateur));
      })
    );
  }

  // =============================================================
  // Gestion des tokens
  // =============================================================

  /**
   * Retourne le token d'accès JWT.
   */
  getTokenAcces(): string | null {
    return localStorage.getItem(this.CLE_TOKEN_ACCES);
  }

  /**
   * Retourne le token de rafraîchissement JWT.
   */
  private getTokenRefresh(): string | null {
    return localStorage.getItem(this.CLE_TOKEN_REFRESH);
  }

  /**
   * Sauvegarde les deux tokens dans le localStorage.
   */
  private sauvegarderTokens(tokenAcces: string, tokenRefresh: string): void {
    localStorage.setItem(this.CLE_TOKEN_ACCES, tokenAcces);
    localStorage.setItem(this.CLE_TOKEN_REFRESH, tokenRefresh);
  }

  /**
   * Charge l'utilisateur depuis le localStorage au démarrage.
   */
  private chargerUtilisateurDepuisStorage(): Utilisateur | null {
    const donnees = localStorage.getItem(this.CLE_UTILISATEUR);
    if (donnees) {
      try {
        return JSON.parse(donnees) as Utilisateur;
      } catch {
        return null;
      }
    }
    return null;
  }
}
