/**
 * =============================================================
 *   ESMT Task Manager - Module Statistiques
 * =============================================================
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { StatisticsComponent } from './statistics.component';

const routes: Routes = [
  { path: '', component: StatisticsComponent },
  { path: 'primes', component: StatisticsComponent }
];

@NgModule({
  declarations: [StatisticsComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule.forChild(routes)
  ]
})
export class StatisticsModule {}
