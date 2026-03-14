/**
 * =============================================================
 *   ESMT Task Manager - Module Tâches
 * =============================================================
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { TasksKanbanComponent } from './kanban/tasks-kanban.component';
import { TasksDetailComponent } from './detail/tasks-detail.component';

const routes: Routes = [
  { path: '', component: TasksKanbanComponent },
  { path: ':id', component: TasksDetailComponent }
];

@NgModule({
  declarations: [TasksKanbanComponent, TasksDetailComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    RouterModule.forChild(routes)
  ]
})
export class TasksModule {}
