/**
 * =============================================================
 *   ESMT Task Manager - Composant Profil Utilisateur
 * =============================================================
 * Permet de voir et modifier son profil : nom, avatar, bio,
 * département et mot de passe.
 */

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../shared/services/auth.service';
import { Utilisateur } from '../shared/models/interfaces';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

  utilisateur: Utilisateur | null = null;

  formulaireInfo!: FormGroup;
  formulaireMdp!: FormGroup;

  sauvegarde = false;
  sauvegardeMdp = false;

  messageSuccesInfo = '';
  messageErreurInfo = '';
  messageSuccesMdp = '';
  messageErreurMdp = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.utilisateur = this.authService.utilisateurCourant;

    // Initialiser les formulaires
    this.formulaireInfo = this.fb.group({
      first_name: [this.utilisateur?.first_name || '', Validators.required],
      last_name: [this.utilisateur?.last_name || '', Validators.required],
      departement: [this.utilisateur?.departement || ''],
      bio: [this.utilisateur?.bio || '']
    });

    this.formulaireMdp = this.fb.group({
      ancien_mot_de_passe: ['', Validators.required],
      nouveau_mot_de_passe: ['', [Validators.required, Validators.minLength(8)]],
      confirmation_nouveau_mot_de_passe: ['', Validators.required]
    });

    // Recharger le profil depuis l'API
    this.authService.chargerProfilUtilisateur().subscribe(u => {
      this.utilisateur = u;
      this.formulaireInfo.patchValue({
        first_name: u.first_name,
        last_name: u.last_name,
        departement: u.departement,
        bio: u.bio
      });
    });
  }

  /**
   * Sauvegarde les informations du profil.
   */
  sauvegarderInfo(): void {
    this.sauvegarde = true;
    this.messageSuccesInfo = '';
    this.messageErreurInfo = '';

    this.http.patch<Utilisateur>(
      `${environment.apiUrl}/utilisateurs/profil/`,
      this.formulaireInfo.value
    ).subscribe({
      next: () => {
        this.sauvegarde = false;
        this.messageSuccesInfo = 'Profil mis à jour avec succès !';
        this.authService.chargerProfilUtilisateur().subscribe(u => this.utilisateur = u);
        setTimeout(() => this.messageSuccesInfo = '', 4000);
      },
      error: () => {
        this.sauvegarde = false;
        this.messageErreurInfo = 'Erreur lors de la mise à jour.';
      }
    });
  }

  /**
   * Change le mot de passe de l'utilisateur.
   */
  changerMotDePasse(): void {
    this.sauvegardeMdp = true;
    this.messageSuccesMdp = '';
    this.messageErreurMdp = '';

    this.http.post(
      `${environment.apiUrl}/utilisateurs/changer-mot-de-passe/`,
      this.formulaireMdp.value
    ).subscribe({
      next: () => {
        this.sauvegardeMdp = false;
        this.messageSuccesMdp = 'Mot de passe modifié avec succès !';
        this.formulaireMdp.reset();
        setTimeout(() => this.messageSuccesMdp = '', 4000);
      },
      error: (err) => {
        this.sauvegardeMdp = false;
        if (err.error?.ancien_mot_de_passe) {
          this.messageErreurMdp = 'Mot de passe actuel incorrect.';
        } else {
          this.messageErreurMdp = 'Erreur lors du changement de mot de passe.';
        }
      }
    });
  }

  /**
   * Change l'avatar de l'utilisateur.
   */
  changerAvatar(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const formData = new FormData();
    formData.append('avatar', input.files[0]);

    this.http.patch<Utilisateur>(
      `${environment.apiUrl}/utilisateurs/profil/`,
      formData
    ).subscribe({
      next: () => this.authService.chargerProfilUtilisateur().subscribe(u => this.utilisateur = u)
    });
  }
}
