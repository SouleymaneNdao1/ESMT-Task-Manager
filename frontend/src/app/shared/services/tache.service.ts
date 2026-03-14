/**
 * =============================================================
 *   ESMT Task Manager - Service des Tâches
 * =============================================================
 * Service Angular pour toutes les opérations CRUD sur les tâches.
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Tache, CreerTacheDonnees, StatutTache, CommentaireTache, ReponseMessage, ReponsePaginee } from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class TacheService {
  private readonly apiUrl = `${environment.apiUrl}/taches`;

  constructor(private http: HttpClient) {}

  /**
   * Récupère toutes les tâches avec filtres optionnels.
   * @param filtres - Filtres disponibles : projet, statut, assigne_a, priorite, en_retard, q
   */
  obtenirTaches(filtres?: {
    projet?: number;
    statut?: string;
    assigne_a?: number;
    priorite?: string;
    en_retard?: boolean;
    q?: string;
  }): Observable<Tache[]> {
    let params = new HttpParams();
    if (filtres?.projet) params = params.set('projet', filtres.projet.toString());
    if (filtres?.statut) params = params.set('statut', filtres.statut);
    if (filtres?.assigne_a) params = params.set('assigne_a', filtres.assigne_a.toString());
    if (filtres?.priorite) params = params.set('priorite', filtres.priorite);
    if (filtres?.en_retard) params = params.set('en_retard', 'true');
    if (filtres?.q) params = params.set('q', filtres.q);
    // Le backend DRF utilise la pagination par defaut (count/next/previous/results).
    // Normalisation: on retourne toujours un tableau.
    return this.http.get<Tache[] | ReponsePaginee<Tache>>(`${this.apiUrl}/`, { params }).pipe(
      map((reponse: any) => reponse?.results ?? reponse)
    );
  }

  /**
   * Récupère les détails d'une tâche.
   */
  obtenirTache(id: number): Observable<Tache> {
    return this.http.get<Tache>(`${this.apiUrl}/${id}/`);
  }

  /**
   * Crée une nouvelle tâche (professeurs uniquement).
   */
  creerTache(donnees: CreerTacheDonnees): Observable<Tache> {
    return this.http.post<Tache>(`${this.apiUrl}/`, donnees);
  }

  /**
   * Met à jour une tâche existante.
   */
  mettreAJourTache(id: number, donnees: Partial<CreerTacheDonnees>): Observable<Tache> {
    return this.http.patch<Tache>(`${this.apiUrl}/${id}/`, donnees);
  }

  /**
   * Met à jour uniquement le statut d'une tâche.
   * Accessible aux étudiants pour leurs propres tâches.
   */
  mettreAJourStatut(id: number, statut: StatutTache): Observable<{ message: string; tache: Tache }> {
    return this.http.patch<{ message: string; tache: Tache }>(
      `${this.apiUrl}/${id}/statut/`,
      { statut }
    );
  }

  /**
   * Supprime une tâche (professeurs uniquement).
   */
  supprimerTache(id: number): Observable<ReponseMessage> {
    return this.http.delete<ReponseMessage>(`${this.apiUrl}/${id}/`);
  }

  /**
   * Récupère les commentaires d'une tâche.
   */
  obtenirCommentaires(tacheId: number): Observable<CommentaireTache[]> {
    return this.http.get<CommentaireTache[]>(`${this.apiUrl}/${tacheId}/commentaires/`);
  }

  /**
   * Ajoute un commentaire sur une tâche.
   */
  ajouterCommentaire(tacheId: number, contenu: string): Observable<CommentaireTache> {
    return this.http.post<CommentaireTache>(
      `${this.apiUrl}/${tacheId}/commentaires/`,
      { contenu }
    );
  }
}
