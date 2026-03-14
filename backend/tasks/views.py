from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.shortcuts import get_object_or_404
from django.db import models
from .models import Tache, CommentaireTache
from projects.models import Projet
from .serializers import (
    TacheListeSérialiseur,
    TacheDetailSérialiseur,
    CreerTacheSérialiseur,
    CommentaireTacheSérialiseur
)

class ListeCreerTachesVue(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreerTacheSérialiseur
        return TacheListeSérialiseur

    def get_queryset(self):
        user = self.request.user
        
        # Un utilisateur voit les tâches des projets dont il est le créateur
        # OU les tâches des projets dont il est membre.
        queryset = Tache.objects.filter(
            models.Q(projet__createur=user) | 
            models.Q(projet__membres=user)
        ).distinct()

        # Filtre par projet spécifique
        projet_id = self.request.query_params.get('projet')
        if projet_id:
            queryset = queryset.filter(projet_id=projet_id)

        return queryset.order_by('ordre', 'date_limite')

    def create(self, request, *args, **kwargs):
        # Vérification des permissions de création de tâche
        projet_id = request.data.get('projet')
        if not projet_id:
            return Response({"projet": "Ce champ est obligatoire."}, status=status.HTTP_400_BAD_REQUEST)
        
        projet = get_object_or_404(Projet, id=projet_id)
        # Vérifier si l'utilisateur est le créateur OU un membre du projet
        est_membre = projet.membres.filter(id=request.user.id).exists()
        if projet.createur != request.user and not est_membre:
            return Response(
                {"erreur": "Vous devez être membre ou créateur du projet pour ajouter des tâches."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(cree_par=self.request.user)


class DetailTacheVue(generics.RetrieveUpdateDestroyAPIView):
    queryset = Tache.objects.all()
    serializer_class = TacheDetailSérialiseur
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        # Les étudiants peuvent uniquement changer le statut
        if not request.user.est_professeur:
            if set(request.data.keys()) - {'statut'}:
                return Response(
                    {"erreur": "Les étudiants peuvent uniquement modifier le statut."},
                    status=status.HTTP_403_FORBIDDEN
                )
        return super().patch(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        tache = self.get_object()
        if tache.projet.createur != request.user:
            return Response(
                {"erreur": "Seul le créateur du projet peut supprimer ses tâches."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)


@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def mettre_a_jour_statut_tache(request, pk):
    tache = get_object_or_404(Tache, pk=pk)
    if not request.user.est_professeur and tache.assigne_a != request.user:
        return Response(status=status.HTTP_403_FORBIDDEN)
    
    nouveau_statut = request.data.get('statut')
    if nouveau_statut:
        tache.statut = nouveau_statut
        tache.save()
        return Response(TacheListeSérialiseur(tache).data)
    return Response(status=status.HTTP_400_BAD_REQUEST)

class ListeCommentairesVue(generics.ListCreateAPIView):
    serializer_class = CommentaireTacheSérialiseur
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CommentaireTache.objects.filter(tache_id=self.kwargs['tache_id'])

    def perform_create(self, serializer):
        tache = get_object_or_404(Tache, id=self.kwargs['tache_id'])
        serializer.save(auteur=self.request.user, tache=tache)
