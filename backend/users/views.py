"""
=============================================================
  ESMT Task Manager - Vues des Utilisateurs
=============================================================
Ce module gère toutes les vues API liées aux utilisateurs :
inscription, connexion, profil, liste des membres.
"""

from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import update_session_auth_hash
from .models import UtilisateurESMT
from .serializers import (
    InscriptionSérialiseur,
    ProfilSérialiseur,
    ChangementMotDePasseSérialiseur,
    UtilisateurListeSérialiseur
)


class InscriptionVue(generics.CreateAPIView):
    """
    Vue d'inscription pour les nouveaux utilisateurs.
    Accessible sans authentification (AllowAny).
    
    POST /api/v1/utilisateurs/inscription/
    """
    queryset = UtilisateurESMT.objects.all()
    serializer_class = InscriptionSérialiseur
    permission_classes = [AllowAny]

    def create(self, requête, *args, **kwargs):
        """Crée un nouvel utilisateur et retourne un message de succès."""
        sérialiseur = self.get_serializer(data=requête.data)
        sérialiseur.is_valid(raise_exception=True)
        utilisateur = sérialiseur.save()

        return Response({
            "message": f"Compte créé avec succès. Bienvenue {utilisateur.get_nom_complet()} !",
            "utilisateur": {
                "id": utilisateur.id,
                "email": utilisateur.email,
                "role": utilisateur.role,
                "nom_complet": utilisateur.get_nom_complet()
            }
        }, status=status.HTTP_201_CREATED)


class MonProfilVue(generics.RetrieveUpdateAPIView):
    """
    Vue pour consulter et modifier son propre profil.
    
    GET /api/v1/utilisateurs/profil/     - Voir son profil
    PUT /api/v1/utilisateurs/profil/     - Modifier son profil
    PATCH /api/v1/utilisateurs/profil/   - Modification partielle
    """
    serializer_class = ProfilSérialiseur
    permission_classes = [IsAuthenticated]

    def get_object(self):
        """Retourne l'utilisateur connecté."""
        return self.request.user

    def update(self, requête, *args, **kwargs):
        """Met à jour le profil de l'utilisateur connecté."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        sérialiseur = self.get_serializer(instance, data=requête.data, partial=partial)
        sérialiseur.is_valid(raise_exception=True)
        self.perform_update(sérialiseur)

        return Response({
            "message": "Profil mis à jour avec succès.",
            "profil": sérialiseur.data
        })


class ChangementMotDePasseVue(APIView):
    """
    Vue pour changer le mot de passe de l'utilisateur connecté.
    
    POST /api/v1/utilisateurs/changer-mot-de-passe/
    """
    permission_classes = [IsAuthenticated]

    def post(self, requête):
        """Valide et change le mot de passe."""
        sérialiseur = ChangementMotDePasseSérialiseur(data=requête.data)
        sérialiseur.is_valid(raise_exception=True)

        utilisateur = requête.user

        # Vérifier que l'ancien mot de passe est correct
        if not utilisateur.check_password(sérialiseur.validated_data['ancien_mot_de_passe']):
            return Response(
                {"ancien_mot_de_passe": "Mot de passe actuel incorrect."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Définir le nouveau mot de passe
        utilisateur.set_password(sérialiseur.validated_data['nouveau_mot_de_passe'])
        utilisateur.save()

        # Maintenir la session active après changement
        update_session_auth_hash(requête, utilisateur)

        return Response({"message": "Mot de passe modifié avec succès."})


class ListeEtudiantsVue(generics.ListAPIView):
    """
    Vue pour lister tous les étudiants.
    Utilisée par les professeurs pour assigner des tâches.
    
    GET /api/v1/utilisateurs/etudiants/
    """
    serializer_class = UtilisateurListeSérialiseur
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Retourne uniquement les étudiants actifs."""
        return UtilisateurESMT.objects.filter(
            role=UtilisateurESMT.RoleUtilisateur.ETUDIANT,
            is_active=True
        ).order_by('last_name', 'first_name')


class ListeProfesseursVue(generics.ListAPIView):
    """
    Vue pour lister tous les professeurs.
    
    GET /api/v1/utilisateurs/professeurs/
    """
    serializer_class = UtilisateurListeSérialiseur
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Retourne uniquement les professeurs actifs."""
        return UtilisateurESMT.objects.filter(
            role=UtilisateurESMT.RoleUtilisateur.PROFESSEUR,
            is_active=True
        ).order_by('last_name', 'first_name')


class ListeUtilisateursVue(generics.ListAPIView):
    """
    Vue pour lister tous les utilisateurs.
    Accessible uniquement aux professeurs.
    
    GET /api/v1/utilisateurs/
    """
    serializer_class = UtilisateurListeSérialiseur
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Retourne tous les utilisateurs actifs.
        Les étudiants ne voient que les étudiants de leurs projets.
        """
        utilisateur = self.request.user
        if utilisateur.est_professeur:
            # Les professeurs voient tous les utilisateurs
            return UtilisateurESMT.objects.filter(is_active=True).order_by('role', 'last_name')
        else:
            # Les étudiants voient uniquement les membres de leurs projets
            projets_ids = utilisateur.projets_membres.values_list('id', flat=True)
            return UtilisateurESMT.objects.filter(
                projets_membres__in=projets_ids,
                is_active=True
            ).distinct().order_by('last_name')
