"""
=============================================================
  ESMT Task Manager - URLs des Utilisateurs
=============================================================
Définition de toutes les routes URL pour la gestion
des utilisateurs de l'application ESMT.
"""

from django.urls import path
from . import views

# Namespace pour les URLs des utilisateurs
app_name = 'users'

urlpatterns = [
    # Inscription d'un nouvel utilisateur (accessible sans auth)
    path('inscription/', views.InscriptionVue.as_view(), name='inscription'),

    # Consulter/modifier son propre profil
    path('profil/', views.MonProfilVue.as_view(), name='mon-profil'),

    # Changer son mot de passe
    path('changer-mot-de-passe/', views.ChangementMotDePasseVue.as_view(), name='changer-mdp'),

    # Lister tous les étudiants (pour les professeurs)
    path('etudiants/', views.ListeEtudiantsVue.as_view(), name='liste-etudiants'),

    # Lister tous les professeurs
    path('professeurs/', views.ListeProfesseursVue.as_view(), name='liste-professeurs'),

    # Lister tous les utilisateurs
    path('', views.ListeUtilisateursVue.as_view(), name='liste-utilisateurs'),
]
