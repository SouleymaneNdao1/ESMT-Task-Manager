/**
 * =============================================================
 *   ESMT Task Manager - Composant Tableau de Bord
 * =============================================================
 * Affiche un résumé des activités : projets, tâches, statistiques.
 * S'adapte selon le rôle (Professeur ou Étudiant).
 */

import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../shared/services/auth.service';
import { ProjetService } from '../shared/services/projet.service';
import { TacheService } from '../shared/services/tache.service';
import { environment } from '../../environments/environment';
import { Projet, Tache, StatistiquesTableauBord, Utilisateur } from '../shared/models/interfaces';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  // Données de l'utilisateur connecté
  utilisateur: Utilisateur | null = null;

  // Statistiques du tableau de bord
  statistiques: StatistiquesTableauBord | null = null;

  // Projets récents
  projetsRecents: Projet[] = [];

  // Tâches récentes / urgentes
  tachesUrgentes: Tache[] = [];

  // État de chargement
  chargement = true;
  erreur = '';

  constructor(
    private authService: AuthService,
    private projetService: ProjetService,
    private tacheService: TacheService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // Récupérer l'utilisateur connecté
    this.utilisateur = this.authService.utilisateurCourant;

    // Charger toutes les données en parallèle
    this.chargerDonnees();
  }

  /**
   * Charge toutes les données du tableau de bord en parallèle.
   */
  chargerDonnees(): void {
    this.chargement = true;
    this.erreur = '';

    forkJoin({
      // Statistiques générales
      stats: this.http.get<StatistiquesTableauBord>(
        `${environment.apiUrl}/statistiques/tableau-de-bord/`
      ),
      // Projets récents (limité à 4)
      projets: this.projetService.obtenirProjets(),
      // Tâches urgentes ou en retard
      taches: this.tacheService.obtenirTaches({ en_retard: true })
    }).subscribe({
      next: ({ stats, projets, taches }) => {
        this.statistiques = stats;
        this.projetsRecents = projets.slice(0, 4);  // 4 projets récents
        this.tachesUrgentes = taches.slice(0, 5);   // 5 tâches urgentes
        this.chargement = false;
      },
      error: (err) => {
        this.erreur = 'Impossible de charger les données. Veuillez réessayer.';
        this.chargement = false;
        console.error('Erreur chargement tableau de bord:', err);
      }
    });
  }

  /**
   * Vérifie si l'utilisateur est professeur.
   */
  get estProfesseur(): boolean {
    return this.authService.estProfesseur;
  }

  /**
   * Retourne la salutation selon l'heure.
   */
  get salutation(): string {
    const heure = new Date().getHours();
    if (heure < 12) return 'Bonjour';
    if (heure < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }

  /**
   * Formate le montant de prime en FCFA.
   */
  formaterPrime(montant: number): string {
    return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
  }
}
