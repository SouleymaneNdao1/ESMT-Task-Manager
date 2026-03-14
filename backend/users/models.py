"""
=============================================================
  ESMT Task Manager - Modèles des Utilisateurs
=============================================================
Ce module définit le modèle utilisateur personnalisé pour
l'application ESMT avec deux profils : Étudiant et Professeur.

Les professeurs ont des droits de gestion des projets/tâches,
les étudiants peuvent uniquement modifier leurs propres tâches.
"""

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _


class UtilisateurESMT(AbstractUser):
    """
    Modèle utilisateur personnalisé pour l'ESMT.
    
    Étend le modèle AbstractUser de Django pour ajouter :
    - Le rôle (Professeur ou Étudiant)
    - Un avatar/photo de profil
    - Le département/spécialité
    - La date de dernière activité
    """

    # ---------------------------------------------------------
    # Choix des rôles disponibles dans l'application
    # ---------------------------------------------------------
    class RoleUtilisateur(models.TextChoices):
        PROFESSEUR = 'PROFESSEUR', _('Professeur')
        ETUDIANT = 'ETUDIANT', _('Étudiant')

    # ---------------------------------------------------------
    # Champs personnalisés ajoutés au modèle utilisateur
    # ---------------------------------------------------------
    
    # Rôle de l'utilisateur dans l'ESMT (obligatoire)
    role = models.CharField(
        max_length=20,
        choices=RoleUtilisateur.choices,
        default=RoleUtilisateur.ETUDIANT,
        verbose_name="Rôle",
        help_text="Définit les permissions de l'utilisateur dans l'application"
    )

    # Photo de profil / Avatar
    avatar = models.ImageField(
        upload_to='avatars/',
        null=True,
        blank=True,
        verbose_name="Avatar",
        help_text="Photo de profil de l'utilisateur"
    )

    # Département ou spécialité à l'ESMT
    departement = models.CharField(
        max_length=100,
        blank=True,
        verbose_name="Département",
        help_text="Département ou spécialité de l'utilisateur à l'ESMT"
    )

    # Biographie courte
    bio = models.TextField(
        blank=True,
        verbose_name="Biographie",
        help_text="Courte description de l'utilisateur"
    )

    # Date de création du compte
    date_creation = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date de création"
    )

    # Date de dernière mise à jour du profil
    date_modification = models.DateTimeField(
        auto_now=True,
        verbose_name="Dernière modification"
    )

    # L'email est requis et unique pour chaque utilisateur
    email = models.EmailField(
        unique=True,
        verbose_name="Adresse email"
    )

    # Connexion par email au lieu du nom d'utilisateur
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    class Meta:
        verbose_name = "Utilisateur ESMT"
        verbose_name_plural = "Utilisateurs ESMT"
        ordering = ['last_name', 'first_name']

    def __str__(self):
        """Représentation lisible de l'utilisateur."""
        return f"{self.get_full_name()} ({self.get_role_display()})"

    @property
    def est_professeur(self):
        """Vérifie si l'utilisateur est un professeur."""
        return self.role == self.RoleUtilisateur.PROFESSEUR

    @property
    def est_etudiant(self):
        """Vérifie si l'utilisateur est un étudiant."""
        return self.role == self.RoleUtilisateur.ETUDIANT

    def get_nom_complet(self):
        """Retourne le nom complet de l'utilisateur."""
        return f"{self.first_name} {self.last_name}".strip() or self.email

    def get_avatar_url(self):
        """Retourne l'URL de l'avatar ou une URL par défaut."""
        if self.avatar:
            return self.avatar.url
        # Avatar par défaut basé sur les initiales
        return f"https://ui-avatars.com/api/?name={self.first_name}+{self.last_name}&background=1a3a6b&color=fff"
