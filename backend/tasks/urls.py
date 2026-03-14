from django.urls import path
from . import views

app_name = 'tasks'

urlpatterns = [
    # Liste et création des tâches
    path('', views.ListeCreerTachesVue.as_view(), name='liste-taches'),

    # Détail, modification et suppression d'une tâche
    path('<int:pk>/', views.DetailTacheVue.as_view(), name='detail-tache'),

    # Mise à jour rapide du statut (compatibilité)
    path('<int:pk>/statut/', views.mettre_a_jour_statut_tache, name='statut-tache'),

    # Commentaires sur une tâche
    path('<int:tache_id>/commentaires/', views.ListeCommentairesVue.as_view(), name='commentaires-tache'),
]
