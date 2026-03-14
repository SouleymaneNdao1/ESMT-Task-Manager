/**
 * =============================================================
 *   ESMT Task Manager - Module de Routage Angular
 * =============================================================
 * Définition de toutes les routes de l'application avec
 * la protection par les gardes d'authentification.
 */

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGarde, ProfesseurGarde } from './shared/guards/auth.garde';

const routes: Routes = [
  // Redirection de la racine vers le tableau de bord
  {
    path: '',
    redirectTo: 'tableau-de-bord',
    pathMatch: 'full'
  },

  // =============================================================
  // Routes d'authentification (sans garde)
  // =============================================================
  {
    path: 'connexion',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule),
    data: { titre: 'Connexion - ESMT Task Manager' }
  },
  {
    path: 'inscription',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule),
    data: { titre: 'Inscription - ESMT Task Manager' }
  },

  // =============================================================
  // Routes protégées (nécessitent une authentification)
  // =============================================================
  {
    path: 'tableau-de-bord',
    canActivate: [AuthGarde],
    loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule),
    data: { titre: 'Tableau de bord - ESMT Task Manager' }
  },
  {
    path: 'projets',
    canActivate: [AuthGarde],
    loadChildren: () => import('./projects/projects.module').then(m => m.ProjectsModule),
    data: { titre: 'Projets - ESMT Task Manager' }
  },
  {
    path: 'taches',
    canActivate: [AuthGarde],
    loadChildren: () => import('./tasks/tasks.module').then(m => m.TasksModule),
    data: { titre: 'Tâches - ESMT Task Manager' }
  },
  {
    path: 'statistiques',
    canActivate: [AuthGarde],
    loadChildren: () => import('./statistics/statistics.module').then(m => m.StatisticsModule),
    data: { titre: 'Statistiques - ESMT Task Manager' }
  },
  {
    path: 'profil',
    canActivate: [AuthGarde],
    loadChildren: () => import('./profile/profile.module').then(m => m.ProfileModule),
    data: { titre: 'Mon Profil - ESMT Task Manager' }
  },

  // Route 404 - Page non trouvée
  {
    path: '**',
    redirectTo: 'tableau-de-bord'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    // Restaurer la position de défilement après navigation
    scrollPositionRestoration: 'top',
    // Activer le tracing des routes en développement
    enableTracing: false
  })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
