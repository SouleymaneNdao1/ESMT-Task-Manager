/**
 * =============================================================
 *   ESMT Task Manager - Composant Kanban des Tâches
 * =============================================================
 * Vue Kanban avec colonnes par statut.
 * Les professeurs créent et gèrent toutes les tâches.
 * Les étudiants peuvent changer le statut de leurs propres tâches.
 */

import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, catchError, debounceTime, distinctUntilChanged, forkJoin, map, of, startWith, switchMap, takeUntil } from 'rxjs';
import { AuthService } from '../../shared/services/auth.service';
import { TacheService } from '../../shared/services/tache.service';
import { ProjetService } from '../../shared/services/projet.service';
import { Tache, StatutTache, Projet, Utilisateur, CreerTacheDonnees } from '../../shared/models/interfaces';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-tasks-kanban',
  templateUrl: './tasks-kanban.component.html',
  styleUrls: ['./tasks-kanban.component.scss']
})
export class TasksKanbanComponent implements OnInit, OnDestroy {

  // Toutes les tâches et version filtrée
  tachesToutes: Tache[] = [];
  tachesFiltrees: Tache[] = [];

  // Filtres
  filtreProjet: number | '' = '';
  filtrePriorite = '';
  filtreAssigneA: number | '' = '';
  recherche = '';
  filtreEnRetard = false;
  filtreEcheance = false;
  readonly echeanceJours = 7;

  // Projets et étudiants pour les listes déroulantes
  projetsDisponibles: Projet[] = [];
  etudiants: Utilisateur[] = [];
  etudiantsProjetCreation: Utilisateur[] = [];

  // États
  chargement = true;
  modalTacheOuverte = false;
  sauvegarde = false;
  erreur = '';

  // Formulaire de création de tâche
  formulaireTache!: FormGroup;

  private detruire$ = new Subject<void>();
  private recherche$ = new Subject<string>();
  private detruireFormTache$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private tacheService: TacheService,
    private projetService: ProjetService,
    public authService: AuthService,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initFormulaire();

    // Options (projets + étudiants)
    this.chargerOptions();

    // Recherche debounced -> URL sync
    this.recherche$.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      takeUntil(this.detruire$)
    ).subscribe((q) => {
      this.recherche = q;
      this.mettreAJourUrl();
    });

    // Source de vérité: query params
    this.route.queryParamMap.pipe(takeUntil(this.detruire$)).subscribe(params => {
      const projetParam = params.get('projet');
      const assigneParam = params.get('assigne_a');
      const prioriteParam = params.get('priorite');
      const qParam = params.get('q');
      const enRetardParam = params.get('en_retard');
      const echeanceParam = params.get('echeance');

      const projetId = projetParam ? Number(projetParam) : NaN;
      const assigneId = assigneParam ? Number(assigneParam) : NaN;
      this.filtreProjet = Number.isFinite(projetId) && projetId > 0 ? projetId : '';
      this.filtreAssigneA = Number.isFinite(assigneId) && assigneId > 0 ? assigneId : '';
      this.filtrePriorite = prioriteParam || '';
      this.recherche = qParam || '';
      this.filtreEnRetard = enRetardParam === 'true';
      this.filtreEcheance = echeanceParam === String(this.echeanceJours);
      
      const ouvrirModal = this.route.snapshot.queryParamMap.get('ouvrirModal');
      
      this.chargerTaches();
      
      if (ouvrirModal === 'true') {
        setTimeout(() => this.ouvrirModalTache(), 500);
      }
    });
  }

  ngOnDestroy(): void {
    this.detruireFormTache$.next();
    this.detruireFormTache$.complete();
    this.detruire$.next();
    this.detruire$.complete();
  }

  /**
   * Initialise le formulaire de création de tâche.
   */
  initFormulaire(): void {
    // Nettoyer les anciens listeners (si on recrée le form)
    this.detruireFormTache$.next();
    this.detruireFormTache$.complete();
    this.detruireFormTache$ = new Subject<void>();

    const dateDefaut = new Date();
    dateDefaut.setDate(dateDefaut.getDate() + 7);
    const dateStr = dateDefaut.toISOString().substring(0, 16); // Format YYYY-MM-DDTHH:mm

    this.formulaireTache = this.fb.group({
      id: [null],
      titre: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      projet: [null, Validators.required],
      assigne_a: [null],
      priorite: ['NORMALE', Validators.required],
      date_limite: [dateStr, Validators.required],
      etiquettes: [''],
      statut: ['A_FAIRE']
    });

    this.surveillerProjetPourAssignation();
  }

  chargerOptions(): void {
    // On charge les projets
    this.projetService.obtenirProjets().pipe(
      takeUntil(this.detruire$),
      catchError(err => {
        console.error('Erreur chargement projets:', err);
        return of([]);
      })
    ).subscribe(projets => {
      this.projetsDisponibles = projets || [];
      // Si on a un filtre projet actif, on s'assure qu'il est synchronisé avec le formulaire si ouvert
      if (this.modalTacheOuverte && this.filtreProjet && this.formulaireTache) {
        this.formulaireTache.patchValue({ projet: Number(this.filtreProjet) });
      }
    });

    // On charge les étudiants (si professeur)
    if (this.estProfesseur) {
      this.http.get<Utilisateur[]>(`${environment.apiUrl}/utilisateurs/etudiants/`).pipe(
        takeUntil(this.detruire$),
        catchError(() => of([]))
      ).subscribe(etudiants => {
        this.etudiants = etudiants || [];
      });
    }
  }

  chargerTaches(): void {
    this.chargement = true;
    this.erreur = '';

    const filtres: any = {
      projet: this.filtreProjet ? Number(this.filtreProjet) : undefined,
      priorite: this.filtrePriorite || undefined,
      assigne_a: this.filtreAssigneA ? Number(this.filtreAssigneA) : undefined,
      en_retard: this.filtreEnRetard || undefined,
      q: (this.recherche || '').trim() || undefined
    };

    this.tacheService.obtenirTaches(filtres).pipe(takeUntil(this.detruire$)).subscribe({
      next: (taches) => {
        this.tachesToutes = taches;
        this.appliquerFiltresLocaux();
        this.chargement = false;
      },
      error: () => {
        this.chargement = false;
        this.erreur = "Impossible de charger les tâches.";
      }
    });
  }

  /**
   * Filtre les tâches selon les critères sélectionnés.
   */
  appliquerFiltresLocaux(): void {
    let resultat = [...this.tachesToutes];

    if (this.filtreEcheance) {
      resultat = resultat.filter(t => t.statut !== 'TERMINE' && t.jours_restants >= 0 && t.jours_restants <= this.echeanceJours);
    }

    this.tachesFiltrees = resultat;
  }

  onRechercheInput(): void {
    this.recherche$.next(this.recherche);
  }

  onFiltresChanged(): void {
    this.mettreAJourUrl();
  }

  reinitialiserFiltres(): void {
    this.filtreProjet = '';
    this.filtrePriorite = '';
    this.filtreAssigneA = '';
    this.recherche = '';
    this.filtreEnRetard = false;
    this.filtreEcheance = false;
    this.mettreAJourUrl();
    this.chargerTaches(); // Force reload
  }

  mettreAJourUrl(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        projet: this.filtreProjet || null,
        priorite: this.filtrePriorite || null,
        assigne_a: this.filtreAssigneA || null,
        q: (this.recherche || '').trim() || null,
        en_retard: this.filtreEnRetard ? 'true' : null,
        echeance: this.filtreEcheance ? String(this.echeanceJours) : null
      },
      replaceUrl: true
    });
  }

  /**
   * Retourne les tâches d'un statut donné.
   */
  getTachesParStatut(statut: StatutTache): Tache[] {
    return this.tachesFiltrees.filter(t => t.statut === statut);
  }

  /**
   * Retourne la couleur associée à une priorité.
   */
  getCouleurPriorite(priorite: string): string {
    const couleurs: Record<string, string> = {
      'BASSE': '#17a2b8', 'NORMALE': '#007bff',
      'HAUTE': '#fd7e14', 'URGENTE': '#dc3545'
    };
    return couleurs[priorite] || '#007bff';
  }

  /**
   * Change le statut d'une tâche (pour les étudiants).
   */
  changerStatut(tache: Tache, nouveauStatut: StatutTache): void {
    this.tacheService.mettreAJourStatut(tache.id, nouveauStatut).subscribe({
      next: (reponse) => {
        // Recharger pour rester cohérent avec les filtres serveur (ex: en_retard, recherche, etc.)
        this.chargerTaches();
      }
    });
  }

  /**
   * Navigue vers le détail d'une tâche.
   */
  voirTache(tache: Tache): void {
    this.router.navigate(['/taches', tache.id], { queryParamsHandling: 'preserve' });
  }

  /**
   * Ouvre le modal de création de tâche.
   */
  ouvrirModalTache(): void {
    this.erreur = '';
    this.initFormulaire();
    
    // On recharge les projets au cas où
    this.chargerOptions();

    // Pré-remplir le projet si un filtre projet est actif
    if (this.filtreProjet) {
      this.formulaireTache.patchValue({ projet: Number(this.filtreProjet) });
    }
    this.modalTacheOuverte = true;
  }

  fermerModalTache(): void {
    this.modalTacheOuverte = false;
  }

  /**
   * Crée une nouvelle tâche.
   */
  creerTache(): void {
    this.erreur = '';
    console.log('Soumission du formulaire de tâche...', this.formulaireTache.value);

    if (this.formulaireTache.invalid) {
      this.formulaireTache.markAllAsTouched();
      const controls = this.formulaireTache.controls;
      const champsInvalides = [];
      if (controls['titre'].invalid) champsInvalides.push('Titre');
      if (controls['projet'].invalid) champsInvalides.push('Projet');
      if (controls['date_limite'].invalid) champsInvalides.push('Date limite');
      
      this.erreur = "Champs obligatoires manquants ou invalides : " + champsInvalides.join(', ');
      console.warn('Formulaire invalide:', champsInvalides);
      return;
    }

    this.sauvegarde = true;
    const val = this.formulaireTache.value;
    
    // Sécurité sur la date
    let dateISO = '';
    try {
      if (val.date_limite) {
        const d = new Date(val.date_limite);
        if (isNaN(d.getTime())) {
          throw new Error('Date invalide');
        }
        dateISO = d.toISOString();
      } else {
        throw new Error('Date absente');
      }
    } catch (e) {
      console.error('Erreur date:', e, val.date_limite);
      this.erreur = "La date limite est invalide ou manquante.";
      this.sauvegarde = false;
      return;
    }

    const donnees: CreerTacheDonnees = {
      titre: val.titre,
      description: val.description || '',
      projet: Number(val.projet),
      assigne_a: val.assigne_a ? Number(val.assigne_a) : null,
      priorite: val.priorite,
      date_limite: dateISO,
      statut: val.statut || 'A_FAIRE',
      etiquettes: val.etiquettes || ''
    };

    this.tacheService.creerTache(donnees).subscribe({
      next: (tache) => {
        console.log('Tâche créée avec succès:', tache);
        this.chargerTaches();
        this.sauvegarde = false;
        this.fermerModalTache();
      },
      error: (err) => {
        this.sauvegarde = false;
        console.error('Erreur API création tâche:', err);
        // Extraction du message d'erreur
        if (err.error && typeof err.error === 'object') {
          const errors = [];
          for (const key in err.error) {
            errors.push(`${key}: ${err.error[key]}`);
          }
          this.erreur = errors.join(' | ');
        } else {
          this.erreur = "Erreur lors de la création de la tâche.";
        }
      }
    });
  }

  get estProfesseur(): boolean {
    return this.authService.estProfesseur;
  }

  get utilisateurId(): number | undefined {
    return this.authService.utilisateurCourant?.id;
  }

  private surveillerProjetPourAssignation(): void {
    const projetCtrl = this.formulaireTache.get('projet');
    const assigneCtrl = this.formulaireTache.get('assigne_a');
    if (!projetCtrl) return;

    projetCtrl.valueChanges.pipe(
      startWith(projetCtrl.value),
      map((valeur) => {
        const n = Number(valeur);
        return Number.isFinite(n) && n > 0 ? n : null;
      }),
      distinctUntilChanged(),
      switchMap((projetId) => {
        if (!projetId) return of<Utilisateur[]>([]);
        return this.projetService.obtenirMembres(projetId).pipe(
          map((membres: Utilisateur[]) => membres || []),
          catchError(() => of<Utilisateur[]>([]))
        );
      }),
      takeUntil(this.detruireFormTache$),
      takeUntil(this.detruire$)
    ).subscribe({
      next: (membres) => {
        this.etudiantsProjetCreation = membres.filter(m => m.role === 'ETUDIANT');

        // Si l'étudiant sélectionné n'est plus dans la liste, on reset
        if (assigneCtrl) {
          const current = assigneCtrl.value;
          const currentId = current ? Number(current) : null;
          if (!currentId) return;

          const ids = new Set(this.etudiantsProjetCreation.map(e => e.id));
          if (!ids.has(currentId)) assigneCtrl.setValue(null);
        }
      }
    });
  }
}
