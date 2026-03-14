/**
 * =============================================================
 *   ESMT Task Manager - Module Principal Angular
 * =============================================================
 * Module racine de l'application Angular.
 * Configure tous les modules, services et intercepteurs.
 */

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Intercepteurs HTTP
import { JwtIntercepteur } from './shared/services/jwt.intercepteur';

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    AppRoutingModule,
  ],
  providers: [
    // Intercepteur JWT - Ajoute automatiquement le token Bearer
    {
      provide: HTTP_INTERCEPTORS,
      useClass: JwtIntercepteur,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
