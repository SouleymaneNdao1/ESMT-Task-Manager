/**
 * =============================================================
 *   ESMT Task Manager - Module Projets
 * =============================================================
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { ProjectsListComponent } from './list/projects-list.component';
import { ProjectsDetailComponent } from './detail/projects-detail.component';

const routes: Routes = [
  { path: '', component: ProjectsListComponent },
  { path: 'nouveau', component: ProjectsListComponent },  // TODO: Créer formulaire dédié
  { path: ':id', component: ProjectsDetailComponent }
];

@NgModule({
  declarations: [ProjectsListComponent, ProjectsDetailComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    RouterModule.forChild(routes)
  ]
})
export class ProjectsModule {}
