/**
 * =============================================================
 *   ESMT Task Manager - Détail d'un Projet
 * =============================================================
 * Affiche les informations du projet, la liste des membres et
 * les tâches associées (avec liens vers le kanban et le détail).
 */

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../shared/services/auth.service';
import { ProjetService } from '../../shared/services/projet.service';
import { TacheService } from '../../shared/services/tache.service';
import { Projet, StatutTache, Tache, Utilisateur } from '../../shared/models/interfaces';

@Component({
  selector: 'app-projects-detail',
  templateUrl: './projects-detail.component.html',
  styleUrls: ['./projects-detail.component.scss']
})
export class ProjectsDetailComponent implements OnInit {
  projet: Projet | null = null;
  membres: Utilisateur[] = [];
  taches: Tache[] = [];
  tachesFiltrees: Tache[] = [];

  chargement = true;
  erreur = '';

  // Filtres tâches
  recherche = '';
  filtreStatut: StatutTache | '' = '';

  // Modal ajout membre (créateur uniquement)
  modalMembreOuverte = false;
  ajoutMembre = false;
  emailMembre = '';
  messageSuccesMembre = '';
  messageErreurMembre = '';

  readonly statutsTache: { value: StatutTache; label: string }[] = [
    { value: 'A_FAIRE', label: 'À faire' },
    { value: 'EN_COURS', label: 'En cours' },
    { value: 'EN_REVISION', label: 'En révision' },
    { value: 'TERMINE', label: 'Terminé' },
    { value: 'ANNULE', label: 'Annulé' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public authService: AuthService,
    private projetService: ProjetService,
    private tacheService: TacheService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(id) || id <= 0) {
      this.chargement = false;
      this.erreur = 'ID de projet invalide.';
      return;
    }
    this.chargerProjet(id);
  }

  retour(): void {
    this.router.navigate(['/projets']);
  }

  get estCreateur(): boolean {
    const userId = this.authService.utilisateurCourant?.id;
    return !!userId && this.projet?.createur?.id === userId;
  }

  ouvrirModalMembre(): void {
    if (!this.estCreateur) return;
    this.emailMembre = '';
    this.messageSuccesMembre = '';
    this.messageErreurMembre = '';
    this.modalMembreOuverte = true;
  }

  fermerModalMembre(): void {
    this.modalMembreOuverte = false;
    this.ajoutMembre = false;
    this.emailMembre = '';
    this.messageSuccesMembre = '';
    this.messageErreurMembre = '';
  }

  ajouterMembreParEmail(): void {
    if (!this.projet) return;
    const email = (this.emailMembre || '').trim().toLowerCase();
    this.messageSuccesMembre = '';
    this.messageErreurMembre = '';

    if (!email) {
      this.messageErreurMembre = "Veuillez saisir l'email ESMT de l'etudiant.";
      return;
    }
    if (!email.endsWith('@esmt.sn')) {
      this.messageErreurMembre = "Email invalide. Utilisez un email institutionnel @esmt.sn.";
      return;
    }

    this.ajoutMembre = true;
    this.projetService.ajouterMembre(this.projet.id, email).subscribe({
      next: (reponse) => {
        this.ajoutMembre = false;
        this.messageSuccesMembre = reponse?.message || "Etudiant ajouté au projet.";
        this.chargerMembres(this.projet!.id);
      },
      error: (err) => {
        this.ajoutMembre = false;
        this.messageErreurMembre = err?.error?.erreur || err?.error?.detail || "Erreur lors de l'ajout.";
      }
    });
  }

  retirerMembre(utilisateur: Utilisateur): void {
    if (!this.projet || !this.estCreateur) return;
    if (!confirm(`Retirer ${utilisateur.nom_complet} du projet ?`)) return;

    this.projetService.retirerMembre(this.projet.id, utilisateur.id).subscribe({
      next: () => this.chargerMembres(this.projet!.id)
    });
  }

  getLibelleStatut(statut: string | undefined): string {
    if (!statut) return 'Indéfini';
    const s = statut.toUpperCase();
    switch (s) {
      case 'EN_COURS': return 'En cours';
      case 'TERMINE': return 'Terminé';
      case 'PLANIFIE': return 'Planifié';
      case 'ANNULE': return 'Annulé';
      default: return statut;
    }
  }

  getLibelleStatutTache(statut: StatutTache): string {
    return this.statutsTache.find(s => s.value === statut)?.label || statut;
  }

  filtrerTaches(): void {
    const q = (this.recherche || '').trim().toLowerCase();
    this.tachesFiltrees = this.taches.map(t => ({
      ...t,
      est_en_retard: t.statut !== 'TERMINE' && new Date(t.date_limite) < new Date()
    })).filter(t => {
      const matchTexte = !q ||
        (t.titre || '').toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q) ||
        (t.etiquettes || '').toLowerCase().includes(q);
      const matchStatut = !this.filtreStatut || t.statut === this.filtreStatut;
      return matchTexte && matchStatut;
    });
  }

  allerAuKanban(ouvrirModal = false): void {
    if (!this.projet) return;
    const params: any = { projet: this.projet.id };
    if (ouvrirModal) params.ouvrirModal = 'true';
    this.router.navigate(['/taches'], { queryParams: params });
  }

  private chargerProjet(id: number): void {
    this.chargement = true;
    this.erreur = '';

    forkJoin({
      projet: this.projetService.obtenirProjet(id),
      membres: this.projetService.obtenirMembres(id),
      taches: this.tacheService.obtenirTaches({ projet: id })
    }).subscribe({
      next: ({ projet, membres, taches }) => {
        this.projet = projet;
        this.membres = membres || [];
        this.taches = taches || [];
        this.filtrerTaches(); // Calcule est_en_retard et initialise tachesFiltrees
        this.chargement = false;
      },
      error: (err) => {
        this.chargement = false;
        this.erreur = err?.error?.detail || err?.error?.erreur || "Impossible de charger le projet.";
      }
    });
  }

  private chargerMembres(id: number): void {
    this.projetService.obtenirMembres(id).subscribe({
      next: (m) => (this.membres = m || [])
    });
  }
}

