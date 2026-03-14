/**
 * =============================================================
 *   ESMT Task Manager - Composant Liste des Projets
 * =============================================================
 * Affiche la liste des projets de l'utilisateur.
 * Les professeurs peuvent créer, modifier et supprimer des projets.
 * Les étudiants voient uniquement leurs projets assignés.
 */

import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { ProjetService } from '../../shared/services/projet.service';
import { Projet } from '../../shared/models/interfaces';

@Component({
  selector: 'app-projects-list',
  templateUrl: './projects-list.component.html',
  styleUrls: ['./projects-list.component.scss']
})
export class ProjectsListComponent implements OnInit {

  // Liste des projets
  projets: Projet[] = [];
  projetsFiltres: Projet[] = [];

  // Filtres
  recherche = '';
  filtreStatut = '';

  // États
  chargement = true;
  modalOuverte = false;
  sauvegarde = false;

  modalMembreOuverte = false;
  ajoutMembre = false;
  emailMembre = '';
  projetPourMembre: Projet | null = null;
  messageSuccesMembre = '';
  messageErreurMembre = '';

  // Projet en cours d'édition
  projetEdition: Projet | null = null;

  // Formulaire de création/édition
  formulaire!: FormGroup;

  // Palette de couleurs disponibles
  readonly couleursDisponibles = [
    '#1a3a6b', '#2d6bc4', '#3cb878', '#e74c3c',
    '#9b59b6', '#f39c12', '#1abc9c', '#e67e22',
    '#34495e', '#16a085'
  ];

  constructor(
    private fb: FormBuilder,
    private projetService: ProjetService,
    public authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initFormulaire();
    this.chargerProjets();

    // Route dédiée /projets/nouveau : ouvrir automatiquement le modal
    if (this.route.snapshot.routeConfig?.path === 'nouveau') {
      this.ouvrirModal();
    }
  }

  /**
   * Initialise le formulaire réactif.
   */
  initFormulaire(): void {
    const aujourd_hui = new Date().toISOString().split('T')[0];
    this.formulaire = this.fb.group(
      {
        titre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(80)]],
        description: ['', [Validators.maxLength(500)]],
        statut: ['EN_COURS', Validators.required],
        couleur: ['#1a3a6b'],
        date_debut: [aujourd_hui, Validators.required],
        date_fin_prevue: ['']
      },
      { validators: [this.validerDates] }
    );
  }

  validerDates = (control: AbstractControl): ValidationErrors | null => {
    const debut = control.get('date_debut')?.value;
    const fin = control.get('date_fin_prevue')?.value;
    if (!debut || !fin) return null;
    return fin >= debut ? null : { dates_invalides: true };
  };

  /**
   * Charge la liste des projets depuis l'API.
   */
  chargerProjets(): void {
    this.chargement = true;
    this.projetService.obtenirProjets().subscribe({
      next: (projets) => {
        const aujourd_hui = new Date();
        const sept_jours = 7 * 24 * 60 * 60 * 1000;
        
        this.projets = projets.map(p => ({
          ...p,
          est_urgent: p.date_fin_prevue ? 
            (new Date(p.date_fin_prevue).getTime() - aujourd_hui.getTime() < sept_jours) && p.statut !== 'TERMINE' : false
        }));
        
        this.projetsFiltres = [...this.projets];
        this.chargement = false;
      },
      error: () => { this.chargement = false; }
    });
  }

  /**
   * Filtre les projets selon la recherche et le statut.
   */
  filtrerProjets(): void {
    this.projetsFiltres = this.projets.filter(p => {
      const matchRecherche = !this.recherche ||
        p.titre.toLowerCase().includes(this.recherche.toLowerCase());
      const matchStatut = !this.filtreStatut || p.statut === this.filtreStatut;
      return matchRecherche && matchStatut;
    });
  }

  /**
   * Ouvre le modal de création.
   */
  ouvrirModal(): void {
    this.projetEdition = null;
    this.initFormulaire();
    this.modalOuverte = true;
  }

  /**
   * Ouvre le modal d'édition avec les données existantes.
   */
  editerProjet(projet: Projet): void {
    this.projetEdition = projet;
    this.formulaire.patchValue({
      titre: projet.titre,
      description: projet.description,
      statut: projet.statut,
      couleur: projet.couleur,
      date_debut: projet.date_debut,
      date_fin_prevue: projet.date_fin_prevue || ''
    });
    this.modalOuverte = true;
  }

  /**
   * Ferme le modal.
   */
  fermerModal(): void {
    this.modalOuverte = false;
    this.projetEdition = null;

    // Si on est sur /projets/nouveau, revenir sur /projets une fois le modal fermé
    if (this.route.snapshot.routeConfig?.path === 'nouveau') {
      this.router.navigate(['/projets'], { replaceUrl: true });
    }
  }

  /**
   * Sauvegarde le projet (création ou modification).
   */
  sauvegarderProjet(): void {
    this.formulaire.markAllAsTouched();
    if (this.formulaire.invalid) return;

    this.sauvegarde = true;
    const données = this.formulaire.value;

    if (this.projetEdition) {
      // Modification
      this.projetService.mettreAJourProjet(this.projetEdition.id, données).subscribe({
        next: () => { this.sauvegarde = false; this.fermerModal(); this.chargerProjets(); },
        error: () => { this.sauvegarde = false; }
      });
    } else {
      // Création
      this.projetService.creerProjet(données).subscribe({
        next: (projet) => {
          this.sauvegarde = false;
          this.fermerModal();
          this.router.navigate(['/projets', projet.id]);
        },
        error: () => { this.sauvegarde = false; }
      });
    }
  }

  /**
   * Supprime un projet après confirmation.
   */
  supprimerProjet(projet: Projet): void {
    if (!confirm(`Supprimer le projet "${projet.titre}" ? Cette action est irréversible.`)) return;

    this.projetService.supprimerProjet(projet.id).subscribe({
      next: () => this.chargerProjets()
    });
  }

  /**
   * Navigue vers la page de détail d'un projet.
   */
  voirProjet(id: number): void {
    this.router.navigate(['/projets', id]);
  }

  ouvrirModalMembre(projet: Projet): void {
    this.projetPourMembre = projet;
    this.emailMembre = '';
    this.messageSuccesMembre = '';
    this.messageErreurMembre = '';
    this.modalMembreOuverte = true;
  }

  fermerModalMembre(): void {
    this.modalMembreOuverte = false;
    this.ajoutMembre = false;
    this.projetPourMembre = null;
    this.emailMembre = '';
    this.messageSuccesMembre = '';
    this.messageErreurMembre = '';
  }

  ajouterMembreParEmail(): void {
    this.messageSuccesMembre = '';
    this.messageErreurMembre = '';

    if (!this.projetPourMembre) return;
    const email = (this.emailMembre || '').trim().toLowerCase();
    if (!email) {
      this.messageErreurMembre = "Veuillez saisir l'email ESMT de l'etudiant.";
      return;
    }
    if (!email.endsWith('@esmt.sn')) {
      this.messageErreurMembre = "Email invalide. Utilisez un email institutionnel @esmt.sn.";
      return;
    }

    this.ajoutMembre = true;
    this.projetService.ajouterMembre(this.projetPourMembre.id, email).subscribe({
      next: (reponse) => {
        this.ajoutMembre = false;
        this.messageSuccesMembre = reponse?.message || "Etudiant ajoute au projet.";
        this.chargerProjets();
      },
      error: (err) => {
        this.ajoutMembre = false;
        this.messageErreurMembre = err?.error?.erreur || err?.error?.detail || "Erreur lors de l'ajout de l'etudiant.";
      }
    });
  }

  /**
   * Retourne le libellé lisible d'un statut.
   */
  getLibelleStatut(statut: string): string {
    const labels: Record<string, string> = {
      'EN_COURS': 'En cours', 'TERMINE': 'Terminé',
      'ARCHIVE': 'Archivé', 'SUSPENDU': 'Suspendu'
    };
    return labels[statut] || statut;
  }

  get estProfesseur(): boolean {
    return this.authService.estProfesseur;
  }
}
