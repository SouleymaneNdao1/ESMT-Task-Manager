/**
 * Point d'entrée de l'application Angular ESMT Task Manager.
 * Lance le module AppModule dans le navigateur.
 */
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error('Erreur démarrage Angular:', err));
