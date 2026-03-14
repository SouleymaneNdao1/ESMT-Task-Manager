/**
 * =============================================================
 *   ESMT Task Manager - Composant Statistiques
 * =============================================================
 * Affiche les statistiques trimestrielles, annuelles et le
 * classement des primes des professeurs.
 */

import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { AuthService } from '../shared/services/auth.service';
import { StatistiqueService } from '../shared/services/statistique.service';
import { StatsTrimestrielle, StatsAnnuelles } from '../shared/models/interfaces';

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss']
})
export class StatisticsComponent implements OnInit {

  // Données statistiques
  statsTrimestriel: StatsTrimestrielle | null = null;
  statsAnnuelles: StatsAnnuelles | null = null;
  evaluationProfs: any = null;

  // Filtres de période
  anneeSelectionnee: number;
  trimestreSelectionne: number;
  annees: number[] = [];

  // État
  chargement = true;

  constructor(
    public authService: AuthService,
    private statService: StatistiqueService
  ) {
    this.anneeSelectionnee = statService.obtenirAnneeCourante();
    this.trimestreSelectionne = statService.obtenirTrimestreCourant();
    this.annees = statService.obtenirAnneesDisponibles();
  }

  ngOnInit(): void {
    this.chargerStats();
  }

  /**
   * Charge toutes les statistiques en parallèle.
   */
  chargerStats(): void {
    this.chargement = true;

    const requetes: any = {
      trimestriel: this.statService.obtenirStatsTrimestriel(
        this.anneeSelectionnee, this.trimestreSelectionne
      ),
      annuelles: this.statService.obtenirStatsAnnuelles(this.anneeSelectionnee)
    };

    // Ajouter l'évaluation des primes si professeur
    if (this.estProfesseur) {
      requetes['primes'] = this.statService.obtenirEvaluationPrimes(
        this.anneeSelectionnee, this.trimestreSelectionne
      );
    }

    forkJoin(requetes).subscribe({
      next: (resultats: any) => {
        this.statsTrimestriel = resultats.trimestriel;
        this.statsAnnuelles = resultats.annuelles;
        if (this.estProfesseur) {
          this.evaluationProfs = resultats.primes;
        }
        this.chargement = false;
      },
      error: () => { this.chargement = false; }
    });
  }

  /**
   * Recharge uniquement les stats trimestrielles.
   */
  chargerStatsTrimestriel(): void {
    this.statService.obtenirStatsTrimestriel(
      this.anneeSelectionnee, this.trimestreSelectionne
    ).subscribe(stats => this.statsTrimestriel = stats);

    if (this.estProfesseur) {
      this.statService.obtenirEvaluationPrimes(
        this.anneeSelectionnee, this.trimestreSelectionne
      ).subscribe(eval_ => this.evaluationProfs = eval_);
    }
  }

  get estProfesseur(): boolean {
    return this.authService.estProfesseur;
  }

  /** Classe CSS selon le pourcentage de taux */
  getClassePourcentage(pct: number): string {
    if (pct >= 90) return 'success';
    if (pct >= 50) return 'warning';
    return 'danger';
  }

  /** Classe CSS pour la barre de taux dans le tableau */
  getClasseTaux(pct: number): string {
    if (pct >= 90) return 'taux-excellent';
    if (pct >= 50) return 'taux-moyen';
    return 'taux-faible';
  }

  /** Classe CSS pour l'affichage de prime */
  getClassePrime(prime: any): string {
    if (prime?.eligible_100k) return 'prime-or';
    if (prime?.eligible_30k) return 'prime-argent';
    return 'prime-vide';
  }

  /** Calcule la prime totale de l'année */
  calculerPrimeTotale(): number {
    if (!this.statsAnnuelles?.par_trimestre) return 0;
    return this.statsAnnuelles.par_trimestre.reduce((total, t) => {
      return total + (t.prime?.prime || 0);
    }, 0);
  }
}
