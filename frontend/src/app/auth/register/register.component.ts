/**
 * =============================================================
 *   ESMT Task Manager - Composant d'Inscription
 * =============================================================
 * Gère le formulaire d'inscription pour créer un nouveau compte
 * Étudiant ou Professeur à l'ESMT.
 */

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['../login/login.component.scss']
})
export class RegisterComponent implements OnInit {

  // Formulaire réactif d'inscription
  formulaire!: FormGroup;

  // État de chargement
  chargement = false;

  // Messages
  messageErreur = '';
  messageSucces = '';

  // Afficher/masquer les mots de passe
  afficherMdp = false;
  afficherConfirmMdp = false;

  // Étape courante du formulaire (wizard 2 étapes)
  etapeCourante = 1;

  // Départements disponibles à l'ESMT
  readonly departements = [
    'Informatique et Réseaux',
    'Télécommunications',
    'Électronique',
    'Management des TIC',
    'Sécurité des Systèmes',
    'Intelligence Artificielle',
    'Autre'
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Si déjà connecté, rediriger
    if (this.authService.estConnecte) {
      this.router.navigate(['/tableau-de-bord']);
    }

    // Initialiser le formulaire multi-étapes
    this.formulaire = this.fb.group({
      // Étape 1 : Informations personnelles
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      nom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      username: ['', [Validators.required, Validators.minLength(3),
        Validators.pattern('^[a-zA-Z0-9_]+$')]],

      // Étape 2 : Rôle et sécurité
      role: ['ETUDIANT', Validators.required],
      departement: [''],
      mot_de_passe: ['', [Validators.required, Validators.minLength(8)]],
      confirmation_mot_de_passe: ['', Validators.required]
    }, {
      validators: this.validerMotsDePasse
    });
  }

  /**
   * Validateur personnalisé : vérifie que les mots de passe correspondent.
   */
  validerMotsDePasse(groupe: FormGroup) {
    const mdp = groupe.get('mot_de_passe')?.value;
    const confirm = groupe.get('confirmation_mot_de_passe')?.value;
    if (mdp && confirm && mdp !== confirm) {
      return { motsDePasNonIdentiques: true };
    }
    return null;
  }

  /**
   * Vérifie si un champ est invalide et touché.
   */
  champInvalide(nomChamp: string): boolean {
    const champ = this.formulaire.get(nomChamp);
    return !!(champ?.invalid && (champ?.dirty || champ?.touched));
  }

  /**
   * Passe à l'étape suivante après validation.
   */
  etapeSuivante(): void {
    const champsEtape1 = ['prenom', 'nom', 'email', 'username'];
    let valide = true;

    // Marquer tous les champs de l'étape 1 comme touchés
    champsEtape1.forEach(champ => {
      const control = this.formulaire.get(champ);
      control?.markAsTouched();
      if (control?.invalid) valide = false;
    });

    if (valide) this.etapeCourante = 2;
  }

  /**
   * Revenir à l'étape précédente.
   */
  etapePrecedente(): void {
    this.etapeCourante = 1;
  }

  /**
   * Soumet le formulaire d'inscription.
   */
  onSoumettre(): void {
    console.log('=== Soumission formulaire ===');
    console.log('Formulaire valide:', !this.formulaire.invalid);
    console.log('Valeurs:', this.formulaire.value);
    console.log('Erreurs:', this.formulaire.errors);
    
    if (this.formulaire.invalid) {
      this.formulaire.markAllAsTouched();
      console.log('Formulaire invalide, abandon');
      return;
    }

    this.chargement = true;
    this.messageErreur = '';

    const donnees = {
      email: this.formulaire.value.email,
      username: this.formulaire.value.username,
      first_name: this.formulaire.value.prenom,
      last_name: this.formulaire.value.nom,
      role: this.formulaire.value.role,
      departement: this.formulaire.value.departement || '',
      mot_de_passe: this.formulaire.value.mot_de_passe,
      confirmation_mot_de_passe: this.formulaire.value.confirmation_mot_de_passe
    };

    console.log('Données envoyées:', donnees);

    this.authService.sInscrire(donnees).subscribe({
      next: (reponse: any) => {
        this.chargement = false;
        this.messageSucces = reponse.message || 'Compte créé avec succès !';
        // Rediriger vers la connexion après 2 secondes
        setTimeout(() => this.router.navigate(['/connexion']), 2000);
      },
      error: (erreur) => {
        this.chargement = false;
        if (erreur.error?.email) {
          this.messageErreur = 'Cet email est déjà utilisé.';
        } else if (erreur.error?.username) {
          this.messageErreur = "Ce nom d'utilisateur est déjà pris.";
        } else {
          this.messageErreur = "Erreur lors de la création du compte.";
        }
      }
    });
  }

  /** Force mots de passe non identiques */
  get motsDePasNonIdentiques(): boolean {
    return !!this.formulaire.errors?.['motsDePasNonIdentiques'] &&
      !!this.formulaire.get('confirmation_mot_de_passe')?.touched;
  }
}
