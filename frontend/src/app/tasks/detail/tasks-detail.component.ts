/**
 * =============================================================
 *   ESMT Task Manager - Détail d'une Tâche
 * =============================================================
 * Page de consultation + actions :
 * - voir les infos d'une tâche
 * - changer le statut (étudiant assigné / professeur)
 * - commentaires (collaboration)
 * - édition (professeur)
 */

import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin, of, Subject, switchMap, takeUntil } from 'rxjs';
import { AuthService } from '../../shared/services/auth.service';
import { TacheService } from '../../shared/services/tache.service';
import { ProjetService } from '../../shared/services/projet.service';
import { CommentaireTache, PrioriteTache, Projet, StatutTache, Tache, Utilisateur } from '../../shared/models/interfaces';

@Component({
  selector: 'app-tasks-detail',
  templateUrl: './tasks-detail.component.html',
  styleUrls: ['./tasks-detail.component.scss']
})
export class TasksDetailComponent implements OnInit, OnDestroy {
  tache: Tache | null = null;
  projet: Projet | null = null;
  etudiantsProjet: Utilisateur[] = [];
  commentaires: CommentaireTache[] = [];

  chargement = true;
  erreur = '';

  // Statut
  sauvegardeStatut = false;
  messageSuccesStatut = '';
  messageErreurStatut = '';

  // Edition (professeur)
  modeEdition = false;
  formulaireEdition!: FormGroup;
  sauvegardeEdition = false;
  messageSuccesEdition = '';
  messageErreurEdition = '';

  // Commentaires
  formulaireCommentaire!: FormGroup;
  envoiCommentaire = false;
  messageErreurCommentaire = '';

  readonly statuts: { value: StatutTache; label: string }[] = [
    { value: 'A_FAIRE', label: 'À faire' },
    { value: 'EN_COURS', label: 'En cours' },
    { value: 'EN_REVISION', label: 'En révision' },
    { value: 'TERMINE', label: 'Terminé' },
    { value: 'ANNULE', label: 'Annulé' }
  ];

  readonly priorites: { value: PrioriteTache; label: string }[] = [
    { value: 'BASSE', label: 'Basse' },
    { value: 'NORMALE', label: 'Normale' },
    { value: 'HAUTE', label: 'Haute' },
    { value: 'URGENTE', label: 'Urgente' }
  ];

  private detruire$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    public authService: AuthService,
    private tacheService: TacheService,
    private projetService: ProjetService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(id) || id <= 0) {
      this.chargement = false;
      this.erreur = 'ID de tâche invalide.';
      return;
    }

    this.formulaireCommentaire = this.fb.group({
      contenu: ['', [Validators.required, Validators.minLength(2)]]
    });

    this.chargerPage(id);
  }

  ngOnDestroy(): void {
    this.detruire$.next();
    this.detruire$.complete();
  }

  retour(): void {
    this.router.navigate(['/taches'], { queryParams: this.route.snapshot.queryParams });
  }

  get peutChangerStatut(): boolean {
    if (!this.tache) return false;
    if (this.authService.estProfesseur) return true;
    const utilisateurId = this.authService.utilisateurCourant?.id;
    return !!utilisateurId && this.tache.assigne_a?.id === utilisateurId;
  }

  get estProfesseur(): boolean {
    return this.authService.estProfesseur;
  }

  toggleEdition(): void {
    this.modeEdition = !this.modeEdition;
    this.messageSuccesEdition = '';
    this.messageErreurEdition = '';
    if (this.modeEdition && this.tache) {
      this.initialiserFormulaireEdition(this.tache);
    }
  }

  changerStatut(nouveau: StatutTache): void {
    if (!this.tache || this.sauvegardeStatut) return;
    if (nouveau === this.tache.statut) return;

    this.sauvegardeStatut = true;
    this.messageSuccesStatut = '';
    this.messageErreurStatut = '';

    this.tacheService.mettreAJourStatut(this.tache.id, nouveau).subscribe({
      next: (reponse) => {
        this.tache = reponse.tache;
        this.messageSuccesStatut = 'Statut mis à jour.';
        if (this.modeEdition) this.initialiserFormulaireEdition(reponse.tache);
        this.sauvegardeStatut = false;
        setTimeout(() => (this.messageSuccesStatut = ''), 3000);
      },
      error: (err) => {
        this.sauvegardeStatut = false;
        this.messageErreurStatut = err?.error?.erreur || err?.error?.detail || 'Erreur lors de la mise à jour du statut.';
      }
    });
  }

  sauvegarderEdition(): void {
    if (!this.tache || !this.estProfesseur) return;
    this.formulaireEdition.markAllAsTouched();
    if (this.formulaireEdition.invalid) return;

    this.sauvegardeEdition = true;
    this.messageSuccesEdition = '';
    this.messageErreurEdition = '';

    const valeur = this.formulaireEdition.value;
    const assigne = valeur.assigne_a_id ? Number(valeur.assigne_a_id) : null;

    const payload = {
      titre: (valeur.titre || '').trim(),
      description: valeur.description || '',
      priorite: valeur.priorite,
      date_limite: valeur.date_limite,
      etiquettes: valeur.etiquettes || '',
      assigne_a_id: assigne
    };

    this.tacheService.mettreAJourTache(this.tache.id, payload).subscribe({
      next: (tache) => {
        this.tache = tache;
        this.initialiserFormulaireEdition(tache);
        this.sauvegardeEdition = false;
        this.messageSuccesEdition = 'Tâche mise à jour.';
        setTimeout(() => (this.messageSuccesEdition = ''), 3000);
      },
      error: (err) => {
        this.sauvegardeEdition = false;
        const message = err?.error?.erreur || err?.error?.detail;
        this.messageErreurEdition = typeof message === 'string'
          ? message
          : 'Erreur lors de la sauvegarde.';
      }
    });
  }

  envoyerCommentaire(): void {
    if (!this.tache || this.envoiCommentaire) return;
    this.formulaireCommentaire.markAllAsTouched();
    if (this.formulaireCommentaire.invalid) return;

    this.envoiCommentaire = true;
    this.messageErreurCommentaire = '';

    const contenu = (this.formulaireCommentaire.value.contenu || '').trim();
    this.tacheService.ajouterCommentaire(this.tache.id, contenu).subscribe({
      next: (commentaire) => {
        this.commentaires = [...this.commentaires, commentaire];
        this.formulaireCommentaire.reset();
        this.envoiCommentaire = false;
      },
      error: (err) => {
        this.envoiCommentaire = false;
        this.messageErreurCommentaire = err?.error?.erreur || err?.error?.detail || "Impossible d'ajouter le commentaire.";
      }
    });
  }

  libelleStatut(statut: StatutTache): string {
    const map: Record<StatutTache, string> = {
      A_FAIRE: 'À faire',
      EN_COURS: 'En cours',
      EN_REVISION: 'En révision',
      TERMINE: 'Terminé',
      ANNULE: 'Annulé'
    };
    return map[statut] || statut;
  }

  classeStatut(statut: StatutTache): string {
    const map: Record<StatutTache, string> = {
      A_FAIRE: 'badge-a-faire',
      EN_COURS: 'badge-en-cours',
      EN_REVISION: 'badge-en-revision',
      TERMINE: 'badge-termine',
      ANNULE: 'badge-annule'
    };
    return map[statut] || 'badge-a-faire';
  }

  private chargerPage(id: number): void {
    this.chargement = true;
    this.erreur = '';

    this.tacheService.obtenirTache(id).pipe(
      switchMap((tache) => forkJoin({
        tache: of(tache),
        projet: this.projetService.obtenirProjet(tache.projet),
        membres: this.projetService.obtenirMembres(tache.projet),
        commentaires: this.tacheService.obtenirCommentaires(id)
      })),
      takeUntil(this.detruire$)
    ).subscribe({
      next: ({ tache, projet, membres, commentaires }) => {
        this.tache = tache;
        this.projet = projet;
        this.etudiantsProjet = (membres || []).filter(m => m.role === 'ETUDIANT');
        this.commentaires = commentaires || [];
        this.initialiserFormulaireEdition(tache);
        this.chargement = false;
      },
      error: (err) => {
        this.chargement = false;
        this.erreur = err?.error?.detail || err?.error?.erreur || "Impossible de charger la tâche.";
      }
    });
  }

  private initialiserFormulaireEdition(tache: Tache): void {
    this.formulaireEdition = this.fb.group({
      titre: [tache.titre || '', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      description: [tache.description || ''],
      priorite: [tache.priorite, Validators.required],
      date_limite: [this.formatDatetimeLocal(tache.date_limite), Validators.required],
      etiquettes: [tache.etiquettes || ''],
      assigne_a_id: [tache.assigne_a?.id ?? null]
    });
  }

  private formatDatetimeLocal(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const min = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  }
}

