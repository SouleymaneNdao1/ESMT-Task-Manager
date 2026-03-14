/**
 * =============================================================
 *   ESMT Task Manager - Service des Projets
 * =============================================================
 * Service Angular pour toutes les opérations CRUD sur les projets.
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Projet, CreerProjetDonnees, Utilisateur, ReponseMessage, ReponsePaginee } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class ProjetService {
  private readonly apiUrl = `${environment.apiUrl}/projets`;

  constructor(private http: HttpClient) {}

  /**
   * Récupère tous les projets de l'utilisateur connecté.
   * @param filtres - Filtres optionnels (statut, recherche)
   */
  obtenirProjets(filtres?: { statut?: string; recherche?: string }): Observable<Projet[]> {
    let params = new HttpParams();
    if (filtres?.statut) params = params.set('statut', filtres.statut);
    if (filtres?.recherche) params = params.set('recherche', filtres.recherche);
    // Le backend DRF utilise la pagination par defaut (count/next/previous/results).
    // Ici on normalise pour toujours renvoyer un tableau de projets.
    return this.http.get<any>(`${this.apiUrl}/`, { params }).pipe(
      map(reponse => {
        if (Array.isArray(reponse)) return reponse;
        if (reponse && Array.isArray(reponse.results)) return reponse.results;
        return [];
      })
    );
  }

  /**
   * Récupère les détails d'un projet par son ID.
   */
  obtenirProjet(id: number): Observable<Projet> {
    return this.http.get<Projet>(`${this.apiUrl}/${id}/`);
  }

  /**
   * Crée un nouveau projet (professeurs uniquement).
   */
  creerProjet(donnees: CreerProjetDonnees): Observable<Projet> {
    return this.http.post<Projet>(`${this.apiUrl}/`, donnees);
  }

  /**
   * Met à jour un projet existant.
   */
  mettreAJourProjet(id: number, donnees: Partial<CreerProjetDonnees>): Observable<Projet> {
    return this.http.patch<Projet>(`${this.apiUrl}/${id}/`, donnees);
  }

  /**
   * Supprime un projet (créateur uniquement).
   */
  supprimerProjet(id: number): Observable<ReponseMessage> {
    return this.http.delete<ReponseMessage>(`${this.apiUrl}/${id}/`);
  }

  /**
   * Ajoute un membre à un projet.
   */
  ajouterMembre(projetId: number, utilisateurIdOuEmail: number | string): Observable<ReponseMessage> {
    const payload = typeof utilisateurIdOuEmail === 'number'
      ? { utilisateur_id: utilisateurIdOuEmail }
      : { email: utilisateurIdOuEmail };

    return this.http.post<ReponseMessage>(
      `${this.apiUrl}/${projetId}/membres/`,
      payload
    );
  }

  /**
   * Retire un membre d'un projet.
   */
  retirerMembre(projetId: number, utilisateurId: number): Observable<ReponseMessage> {
    return this.http.delete<ReponseMessage>(
      `${this.apiUrl}/${projetId}/membres/${utilisateurId}/`
    );
  }

  /**
   * Récupère la liste des membres d'un projet.
   */
  obtenirMembres(projetId: number): Observable<Utilisateur[]> {
    return this.http.get<Utilisateur[]>(`${this.apiUrl}/${projetId}/membres/`);
  }
}
