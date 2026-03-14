"""URLs des projets ESMT."""
from django.urls import path
from . import views

app_name = 'projects'

urlpatterns = [
    # Liste et création des projets
    path('', views.ListeCreerProjetsVue.as_view(), name='liste-projets'),

    # Détail, modification et suppression d'un projet
    path('<int:pk>/', views.DetailProjetVue.as_view(), name='detail-projet'),

    # Gestion des membres d'un projet
    path('<int:projet_id>/membres/', views.GestionMembresVue.as_view(), name='membres-projet'),
    path('<int:projet_id>/membres/<int:utilisateur_id>/', views.GestionMembresVue.as_view(), name='retirer-membre'),
]
