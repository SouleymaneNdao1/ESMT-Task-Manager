/**
 * =============================================================
 *   ESMT Task Manager - Composant de Connexion
 * =============================================================
 * Gère le formulaire de connexion et la validation des données.
 */

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  // Formulaire réactif de connexion
  formulaireConnexion!: FormGroup;

  // État de chargement pour le bouton submit
  chargement = false;

  // Message d'erreur à afficher
  messageErreur = '';

  // Afficher/masquer le mot de passe
  afficherMdp = false;

  // URL de redirection après connexion
  private urlRetour = '/tableau-de-bord';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Récupérer l'URL de retour depuis les query params
    this.urlRetour = this.route.snapshot.queryParams['retour'] || '/tableau-de-bord';

    // Initialiser le formulaire avec validation
    this.formulaireConnexion = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Si déjà connecté, rediriger directement
    if (this.authService.estConnecte) {
      this.router.navigate([this.urlRetour]);
    }
  }

  /**
   * Vérifie si un champ est invalide et touché.
   */
  champInvalide(nomChamp: string): boolean {
    const champ = this.formulaireConnexion.get(nomChamp);
    return !!(champ?.invalid && (champ?.dirty || champ?.touched));
  }

  /**
   * Soumet le formulaire de connexion.
   */
  onSoumettre(): void {
    if (this.formulaireConnexion.invalid) return;

    this.chargement = true;
    this.messageErreur = '';

    const donnees = {
      email: this.formulaireConnexion.value.email,
      password: this.formulaireConnexion.value.password
    };

    this.authService.seConnecter(donnees).subscribe({
      next: () => {
        // Charger le profil puis rediriger
        this.authService.chargerProfilUtilisateur().subscribe({
          next: () => {
            this.chargement = false;
            this.router.navigate([this.urlRetour]);
          },
          error: () => {
            this.chargement = false;
            this.router.navigate([this.urlRetour]);
          }
        });
      },
      error: (erreur) => {
        this.chargement = false;
        // Afficher un message d'erreur lisible
        if (erreur.status === 401) {
          this.messageErreur = 'Email ou mot de passe incorrect.';
        } else if (erreur.status === 0) {
          this.messageErreur = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
        } else {
          this.messageErreur = 'Une erreur est survenue. Veuillez réessayer.';
        }
      }
    });
  }
}
