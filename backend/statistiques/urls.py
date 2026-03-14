"""
URLs de l'application Statistiques ESMT.
ATTENTION : Ce module s'appelle 'statistiques' (pas 'statistics')
pour éviter le conflit avec le module standard Python.
"""
from django.urls import path
from . import views

app_name = 'statistiques'

urlpatterns = [
    # Statistiques du tableau de bord (résumé rapide)
    path('tableau-de-bord/', views.StatistiquesTableauBordVue.as_view(), name='tableau-bord'),

    # Statistiques trimestrielles (?annee=2024&trimestre=1)
    path('trimestriel/', views.StatistiquesTrimestriellesVue.as_view(), name='trimestriel'),

    # Statistiques annuelles (?annee=2024)
    path('annuel/', views.StatistiquesAnnuellesVue.as_view(), name='annuel'),

    # Évaluation des primes de tous les professeurs
    path('primes/', views.EvaluationPrimesProfesseursVue.as_view(), name='primes'),
]
