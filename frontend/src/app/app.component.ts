/**
 * =============================================================
 *   ESMT Task Manager - Composant Racine
 * =============================================================
 * Composant principal qui affiche le layout global :
 * - Sidebar (desktop)
 * - Navbar mobile en bas (style Project Manager)
 * - Zone de contenu principal
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subject, takeUntil, filter } from 'rxjs';
import { AuthService } from './shared/services/auth.service';
import { Utilisateur } from './shared/models/interfaces';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {

  // Titre de l'application
  titre = 'ESMT Task Manager';

  // Utilisateur connecté
  utilisateur: Utilisateur | null = null;

  // État de la sidebar mobile (ouverte/fermée)
  sidebarOuverte = false;

  // Route courante pour surligner le menu actif
  routeCourante = '';

  // Observable pour nettoyer les subscriptions
  private détruire$ = new Subject<void>();

  // Éléments du menu de navigation
  readonly menuItems = [
    { chemin: '/tableau-de-bord', label: 'Accueil', mobile: true },
    { chemin: '/projets', label: 'Projets', mobile: true },
    { chemin: '/taches', label: 'Tâches', mobile: true },
    { chemin: '/statistiques', label: 'Statistiques', mobile: false },
    { chemin: '/profil', label: 'Mon profil', mobile: false },
  ];

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // S'abonner aux changements d'utilisateur
    this.authService.utilisateurCourant$
      .pipe(takeUntil(this.détruire$))
      .subscribe(utilisateur => {
        this.utilisateur = utilisateur;
      });

    // Suivre les changements de route
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.détruire$)
    ).subscribe((event: any) => {
      this.routeCourante = event.urlAfterRedirects;
      // Fermer la sidebar sur mobile après navigation
      this.sidebarOuverte = false;
    });
  }

  ngOnDestroy(): void {
    // Nettoyer toutes les subscriptions
    this.détruire$.next();
    this.détruire$.complete();
  }

  /**
   * Vérifie si une route est active pour surligner le menu.
   */
  estActif(chemin: string): boolean {
    return this.routeCourante.startsWith(chemin);
  }

  /**
   * Vérifie si on est sur une page d'authentification.
   * Sur ces pages, le layout avec sidebar ne s'affiche pas.
   */
  get estPageAuth(): boolean {
    return this.routeCourante.includes('/connexion') ||
           this.routeCourante.includes('/inscription');
  }

  /**
   * Retourne les items de menu mobile (limité à 4 + bouton central).
   */
  get itemsMobile() {
    return this.menuItems.filter(item => item.mobile);
  }

  /**
   * Déconnecte l'utilisateur.
   */
  seDeconnecter(): void {
    this.authService.seDeconnecter();
  }

  /**
   * Navigue vers la création d'un nouveau projet.
   * Bouton central de la navbar mobile.
   */
  actionCentrale(): void {
    if (this.authService.estProfesseur) {
      this.router.navigate(['/projets/nouveau']);
    } else {
      this.router.navigate(['/taches']);
    }
  }
}
