/**
 * =============================================================
 *   ESMT Task Manager - Garde de Route (Auth Guard)
 * =============================================================
 * Protège les routes privées de l'application.
 * Redirige vers la page de connexion si non authentifié.
 */

import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGarde implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  /**
   * Vérifie si l'utilisateur peut accéder à la route.
   * Si non connecté, redirige vers /connexion.
   */
  canActivate(route: ActivatedRouteSnapshot): boolean {
    if (this.authService.estConnecte) {
      // Vérifier les rôles requis si spécifiés dans la route
      const roleRequis = route.data?.['role'];
      if (roleRequis) {
        const aLeBonRole = roleRequis === this.authService.utilisateurCourant?.role;
        if (!aLeBonRole) {
          // Rediriger vers le tableau de bord si mauvais rôle
          this.router.navigate(['/tableau-de-bord']);
          return false;
        }
      }
      return true;
    }

    // Rediriger vers la page de connexion avec l'URL de retour
    this.router.navigate(['/connexion'], {
      queryParams: { retour: route.url.join('/') }
    });
    return false;
  }
}

/**
 * Garde pour les routes accessibles UNIQUEMENT aux professeurs.
 */
@Injectable({
  providedIn: 'root'
})
export class ProfesseurGarde implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (this.authService.estConnecte && this.authService.estProfesseur) {
      return true;
    }
    this.router.navigate(['/tableau-de-bord']);
    return false;
  }
}
