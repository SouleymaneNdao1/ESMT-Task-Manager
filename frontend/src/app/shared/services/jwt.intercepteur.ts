/**
 * =============================================================
 *   ESMT Task Manager - Intercepteur HTTP JWT
 * =============================================================
 * Intercepte automatiquement toutes les requêtes HTTP pour
 * ajouter le token JWT dans les en-têtes Authorization.
 * Gère aussi le rafraîchissement automatique du token expiré.
 */

import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import {
  Observable,
  throwError,
  BehaviorSubject,
  switchMap,
  filter,
  take,
  catchError
} from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class JwtIntercepteur implements HttpInterceptor {

  // Indique si un rafraîchissement de token est en cours
  private estEnRafraichissement = false;

  // File d'attente pour les requêtes pendant le rafraîchissement
  private tokenRafraichi$ = new BehaviorSubject<string | null>(null);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  /**
   * Intercepte chaque requête HTTP et ajoute le token JWT.
   */
  intercept(requête: HttpRequest<any>, suivant: HttpHandler): Observable<HttpEvent<any>> {
    // Récupérer le token d'accès courant
    const token = this.authService.getTokenAcces();

    // Ajouter le token si disponible
    if (token) {
      requête = this.ajouterToken(requête, token);
    }

    return suivant.handle(requête).pipe(
      catchError(erreur => {
        // Si erreur 401 (non autorisé), tenter de rafraîchir le token
        if (erreur instanceof HttpErrorResponse && erreur.status === 401) {
          return this.gererErreur401(requête, suivant);
        }
        return throwError(() => erreur);
      })
    );
  }

  /**
   * Ajoute le token Bearer dans les en-têtes de la requête.
   */
  private ajouterToken(requête: HttpRequest<any>, token: string): HttpRequest<any> {
    return requête.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  /**
   * Gère les erreurs 401 en tentant de rafraîchir le token.
   * Utilise un BehaviorSubject pour éviter les rafraîchissements multiples.
   */
  private gererErreur401(requête: HttpRequest<any>, suivant: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.estEnRafraichissement) {
      this.estEnRafraichissement = true;
      this.tokenRafraichi$.next(null);

      return this.authService.rafraichirToken().pipe(
        switchMap(reponse => {
          this.estEnRafraichissement = false;
          this.tokenRafraichi$.next(reponse.access);
          // Réessayer la requête originale avec le nouveau token
          return suivant.handle(this.ajouterToken(requête, reponse.access));
        }),
        catchError(erreur => {
          this.estEnRafraichissement = false;
          // Si le rafraîchissement échoue, déconnecter l'utilisateur
          this.authService.seDeconnecter();
          return throwError(() => erreur);
        })
      );
    } else {
      // Attendre que le token soit rafraîchi
      return this.tokenRafraichi$.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(token => suivant.handle(this.ajouterToken(requête, token!)))
      );
    }
  }
}
