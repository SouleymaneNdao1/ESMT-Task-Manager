/**
 * =============================================================
 *   ESMT Task Manager - Service des Statistiques
 * =============================================================
 * Service pour récupérer les statistiques et calculer les primes.
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  StatistiquesTableauBord,
  StatsTrimestrielle,
  StatsAnnuelles,
  EvaluationPrime
} from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class StatistiqueService {
  private readonly apiUrl = `${environment.apiUrl}/statistiques`;

  constructor(private http: HttpClient) {}

  /**
   * Récupère les statistiques du tableau de bord.
   */
  obtenirStatsTableauBord(): Observable<StatistiquesTableauBord> {
    return this.http.get<StatistiquesTableauBord>(`${this.apiUrl}/tableau-de-bord/`);
  }

  /**
   * Récupère les statistiques trimestrielles.
   * @param annee - Année (ex: 2024)
   * @param trimestre - Trimestre (1 à 4)
   */
  obtenirStatsTrimestriel(annee: number, trimestre: number): Observable<StatsTrimestrielle> {
    const params = new HttpParams()
      .set('annee', annee.toString())
      .set('trimestre', trimestre.toString());
    return this.http.get<StatsTrimestrielle>(`${this.apiUrl}/trimestriel/`, { params });
  }

  /**
   * Récupère les statistiques annuelles.
   * @param annee - Année (ex: 2024)
   */
  obtenirStatsAnnuelles(annee: number): Observable<StatsAnnuelles> {
    const params = new HttpParams().set('annee', annee.toString());
    return this.http.get<StatsAnnuelles>(`${this.apiUrl}/annuel/`, { params });
  }

  /**
   * Récupère l'évaluation des primes de tous les professeurs.
   * Accessible uniquement aux professeurs.
   */
  obtenirEvaluationPrimes(annee: number, trimestre: number): Observable<{
    periode: any;
    evaluation_professeurs: EvaluationPrime[];
    regles_primes: any;
  }> {
    const params = new HttpParams()
      .set('annee', annee.toString())
      .set('trimestre', trimestre.toString());
    return this.http.get<any>(`${this.apiUrl}/primes/`, { params });
  }

  /**
   * Utilitaire : retourne le trimestre courant (1-4).
   */
  obtenirTrimestreCourant(): number {
    return Math.floor(new Date().getMonth() / 3) + 1;
  }

  /**
   * Utilitaire : retourne l'année courante.
   */
  obtenirAnneeCourante(): number {
    return new Date().getFullYear();
  }

  /**
   * Utilitaire : formate un montant en FCFA.
   */
  formaterPrime(montant: number): string {
    return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
  }

  /**
   * Utilitaire : retourne les années disponibles (5 dernières années).
   */
  obtenirAnneesDisponibles(): number[] {
    const anneeActuelle = this.obtenirAnneeCourante();
    return Array.from({ length: 5 }, (_, i) => anneeActuelle - i);
  }
}
