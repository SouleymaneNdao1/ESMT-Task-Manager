"""
=============================================================
  ESMT Task Manager - Sérialiseurs des Utilisateurs
=============================================================
Les sérialiseurs convertissent les modèles Django en JSON
et valident les données entrantes depuis le frontend Angular.
"""

from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import UtilisateurESMT


class InscriptionSérialiseur(serializers.ModelSerializer):
    """
    Sérialiseur pour l'inscription d'un nouvel utilisateur.
    Gère la validation et la création sécurisée du compte.
    """

    # Champ de confirmation du mot de passe (non sauvegardé en base)
    mot_de_passe = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    confirmation_mot_de_passe = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )

    class Meta:
        model = UtilisateurESMT
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'role', 'departement', 'mot_de_passe', 'confirmation_mot_de_passe'
        ]
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
        }

    def validate(self, données):
        """Valide que les deux mots de passe correspondent."""
        if données['mot_de_passe'] != données['confirmation_mot_de_passe']:
            raise serializers.ValidationError({
                "mot_de_passe": "Les mots de passe ne correspondent pas."
            })
        return données

    def create(self, données_validées):
        """Crée un nouvel utilisateur avec le mot de passe chiffré."""
        # Supprimer la confirmation avant la création
        données_validées.pop('confirmation_mot_de_passe')
        mot_de_passe = données_validées.pop('mot_de_passe')

        # Créer l'utilisateur avec le mot de passe chiffré
        utilisateur = UtilisateurESMT.objects.create_user(
            password=mot_de_passe,
            **données_validées
        )
        return utilisateur


class ProfilSérialiseur(serializers.ModelSerializer):
    """
    Sérialiseur pour afficher et modifier le profil utilisateur.
    Inclut les statistiques de base de l'utilisateur.
    """

    # Champ calculé - nom complet
    nom_complet = serializers.SerializerMethodField()
    # URL de l'avatar
    avatar_url = serializers.SerializerMethodField()
    # Nombre de projets
    nombre_projets = serializers.SerializerMethodField()
    # Nombre de tâches assignées
    nombre_taches = serializers.SerializerMethodField()

    class Meta:
        model = UtilisateurESMT
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'role', 'departement', 'bio', 'avatar', 'avatar_url',
            'nom_complet', 'nombre_projets', 'nombre_taches',
            'date_creation', 'last_login'
        ]
        read_only_fields = ['id', 'date_creation', 'last_login', 'role']

    def get_nom_complet(self, utilisateur):
        """Retourne le nom complet de l'utilisateur."""
        return utilisateur.get_nom_complet()

    def get_avatar_url(self, utilisateur):
        """Retourne l'URL complète de l'avatar."""
        return utilisateur.get_avatar_url()

    def get_nombre_projets(self, utilisateur):
        """Compte les projets où l'utilisateur est membre."""
        if utilisateur.est_professeur:
            return utilisateur.projets_crees.count()
        return utilisateur.projets_membres.count()

    def get_nombre_taches(self, utilisateur):
        """Compte les tâches assignées à l'utilisateur."""
        return utilisateur.taches_assignees.count()


class ChangementMotDePasseSérialiseur(serializers.Serializer):
    """
    Sérialiseur pour le changement de mot de passe.
    Vérifie l'ancien mot de passe avant de le changer.
    """

    ancien_mot_de_passe = serializers.CharField(
        required=True,
        style={'input_type': 'password'}
    )
    nouveau_mot_de_passe = serializers.CharField(
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    confirmation_nouveau_mot_de_passe = serializers.CharField(
        required=True,
        style={'input_type': 'password'}
    )

    def validate(self, données):
        """Vérifie que les nouveaux mots de passe correspondent."""
        if données['nouveau_mot_de_passe'] != données['confirmation_nouveau_mot_de_passe']:
            raise serializers.ValidationError({
                "nouveau_mot_de_passe": "Les nouveaux mots de passe ne correspondent pas."
            })
        return données


class UtilisateurListeSérialiseur(serializers.ModelSerializer):
    """
    Sérialiseur simplifié pour la liste des utilisateurs.
    Utilisé pour assigner des membres aux projets/tâches.
    """

    nom_complet = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = UtilisateurESMT
        fields = ['id', 'email', 'username', 'nom_complet', 'role', 'avatar_url', 'departement']

    def get_nom_complet(self, utilisateur):
        return utilisateur.get_nom_complet()

    def get_avatar_url(self, utilisateur):
        return utilisateur.get_avatar_url()

# Alias pour compatibilité avec le code existant
UtilisateurSerializer = UtilisateurListeSérialiseur
UtilisateurProfilSerializer = ProfilSérialiseur
