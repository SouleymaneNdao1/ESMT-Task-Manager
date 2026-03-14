"""
=============================================================
  ESMT Task Manager - Vues des Projets
=============================================================
Gestion des projets via l'API REST.
Les professeurs créent et gèrent les projets.
Les étudiants consultent uniquement leurs projets.
"""

from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import Projet, MembreProjet
from .serializers import (
    ProjetListeSérialiseur,
    ProjetDetailSérialiseur,
    CreerProjetSérialiseur,
    AjouterMembreSérialiseur
)
from users.models import UtilisateurESMT


class EstProfesseur(permissions.BasePermission):
    """
    Permission personnalisée : seuls les professeurs peuvent accéder.
    Utilisée pour les actions de création/modification de projets.
    """
    message = "Seuls les professeurs peuvent effectuer cette action."

    def has_permission(self, requête, vue):
        return requête.user.est_professeur


class EstCreateurDuProjet(permissions.BasePermission):
    """
    Permission : seul le créateur du projet peut le modifier/supprimer.
    """
    message = "Seul le créateur du projet peut effectuer cette action."

    def has_object_permission(self, requête, vue, objet):
        # Les méthodes GET sont toujours autorisées
        if requête.method in permissions.SAFE_METHODS:
            return True
        return objet.createur == requête.user


class ListeCreerProjetsVue(generics.ListCreateAPIView):
    """
    Vue pour lister et créer des projets.
    
    GET  /api/v1/projets/          - Liste des projets de l'utilisateur
    POST /api/v1/projets/          - Créer un nouveau projet (professeurs seulement)
    """
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        """Utilise différents sérialiseurs selon l'action."""
        if self.request.method == 'POST':
            return CreerProjetSérialiseur
        return ProjetListeSérialiseur

    def get_queryset(self):
        """
        Retourne les projets accessibles à l'utilisateur connecté.
        - Professeurs : leurs projets créés
        - Étudiants : projets où ils sont membres
        """
        utilisateur = self.request.user

        if utilisateur.est_professeur:
            # Le professeur voit tous ses projets créés
            queryset = Projet.objects.filter(createur=utilisateur)
        else:
            # L'étudiant voit uniquement les projets où il est membre
            queryset = utilisateur.projets_membres.all()

        # Filtres optionnels
        statut = self.request.query_params.get('statut')
        if statut:
            queryset = queryset.filter(statut=statut)

        # Recherche par titre
        recherche = self.request.query_params.get('recherche')
        if recherche:
            queryset = queryset.filter(titre__icontains=recherche)

        return queryset.order_by('-date_creation')

    def create(self, requête, *args, **kwargs):
        """Crée un nouveau projet - réservé aux professeurs."""
        if not requête.user.est_professeur:
            return Response(
                {"erreur": "Seuls les professeurs peuvent créer des projets."},
                status=status.HTTP_403_FORBIDDEN
            )
        sérialiseur = CreerProjetSérialiseur(
            data=requête.data,
            context={'request': requête}
        )
        sérialiseur.is_valid(raise_exception=True)
        projet = sérialiseur.save()

        return Response(
            ProjetDetailSérialiseur(projet).data,
            status=status.HTTP_201_CREATED
        )


class DetailProjetVue(generics.RetrieveUpdateDestroyAPIView):
    """
    Vue pour consulter, modifier et supprimer un projet.
    
    GET    /api/v1/projets/<id>/   - Détails du projet
    PUT    /api/v1/projets/<id>/   - Modifier le projet (créateur seulement)
    PATCH  /api/v1/projets/<id>/   - Modification partielle
    DELETE /api/v1/projets/<id>/   - Supprimer le projet (créateur seulement)
    """
    permission_classes = [IsAuthenticated, EstCreateurDuProjet]
    serializer_class = ProjetDetailSérialiseur

    def get_queryset(self):
        """Retourne les projets accessibles à l'utilisateur."""
        utilisateur = self.request.user
        if utilisateur.est_professeur:
            return Projet.objects.filter(createur=utilisateur)
        return utilisateur.projets_membres.all()

    def destroy(self, requête, *args, **kwargs):
        """Supprime le projet après vérification des permissions."""
        projet = self.get_object()
        titre = projet.titre
        projet.delete()
        return Response(
            {"message": f"Le projet '{titre}' a été supprimé avec succès."},
            status=status.HTTP_200_OK
        )


class GestionMembresVue(APIView):
    """
    Vue pour gérer les membres d'un projet.
    
    POST   /api/v1/projets/<id>/membres/         - Ajouter un membre
    DELETE /api/v1/projets/<id>/membres/<uid>/   - Retirer un membre
    GET    /api/v1/projets/<id>/membres/         - Lister les membres
    """
    permission_classes = [IsAuthenticated]

    def get_projet(self, projet_id, utilisateur):
        """Récupère le projet et vérifie que l'utilisateur en est le créateur."""
        projet = get_object_or_404(Projet, id=projet_id)
        if projet.createur != utilisateur:
            return None, Response(
                {"erreur": "Seul le créateur du projet peut gérer les membres."},
                status=status.HTTP_403_FORBIDDEN
            )
        return projet, None

    def get(self, requête, projet_id):
        """Liste tous les membres du projet."""
        projet = get_object_or_404(Projet, id=projet_id)
        utilisateur = requête.user

        # Seuls le créateur du projet et ses membres peuvent voir la liste des membres
        est_membre = projet.membres.filter(id=utilisateur.id).exists()
        if projet.createur_id != utilisateur.id and not est_membre:
            return Response(
                {"erreur": "Accès interdit. Vous devez être membre du projet."},
                status=status.HTTP_403_FORBIDDEN
            )

        membres = projet.membres.all()
        from users.serializers import UtilisateurListeSérialiseur
        sérialiseur = UtilisateurListeSérialiseur(membres, many=True)
        return Response(sérialiseur.data)

    def post(self, requête, projet_id):
        """Ajoute un étudiant au projet."""
        projet, erreur = self.get_projet(projet_id, requête.user)
        if erreur:
            return erreur

        sérialiseur = AjouterMembreSérialiseur(data=requête.data)
        sérialiseur.is_valid(raise_exception=True)

        try:
            membre = sérialiseur.get_utilisateur()
        except UtilisateurESMT.DoesNotExist:
            return Response(
                {"erreur": "Utilisateur introuvable."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Vérifier si le membre est déjà dans le projet
        if MembreProjet.objects.filter(projet=projet, utilisateur=membre).exists():
            return Response(
                {"erreur": f"{membre.get_nom_complet()} est déjà membre de ce projet."},
                status=status.HTTP_400_BAD_REQUEST
            )

        MembreProjet.objects.create(projet=projet, utilisateur=membre)
        return Response(
            {"message": f"{membre.get_nom_complet()} a été ajouté au projet."},
            status=status.HTTP_201_CREATED
        )

    def delete(self, requête, projet_id, utilisateur_id):
        """Retire un membre du projet."""
        projet, erreur = self.get_projet(projet_id, requête.user)
        if erreur:
            return erreur

        adhesion = get_object_or_404(
            MembreProjet,
            projet=projet,
            utilisateur_id=utilisateur_id
        )
        nom = adhesion.utilisateur.get_nom_complet()
        adhesion.delete()

        return Response(
            {"message": f"{nom} a été retiré du projet."}
        )
