"""
Configuration de l'application Statistiques.
IMPORTANT : Renommée 'statistiques' (avec un 'q') pour éviter
le conflit avec le module standard Python 'statistics'.
"""
from django.apps import AppConfig

class StatistiquesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'statistiques'
    verbose_name = "Statistiques et Primes"
