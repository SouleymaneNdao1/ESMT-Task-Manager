"""
=============================================================
  ESMT Task Manager - Modèles des Projets
=============================================================
Ce module définit les modèles pour la gestion des projets.
Seuls les professeurs peuvent créer des projets et y ajouter
des membres (étudiants de leur équipe).
"""

from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class Projet(models.Model):
    """
    Modèle représentant un projet dans l'ESMT.
    
    Un projet est créé par un professeur qui en est le responsable.
    Les étudiants sont assignés comme membres et reçoivent des tâches.
    Comparable à une "salle de cours" dans Google Classroom.
    """

    # ---------------------------------------------------------
    # Statuts possibles d'un projet
    # ---------------------------------------------------------
    class StatutProjet(models.TextChoices):
        EN_COURS = 'EN_COURS', _('En cours')
        TERMINE = 'TERMINE', _('Terminé')
        ARCHIVE = 'ARCHIVE', _('Archivé')
        SUSPENDU = 'SUSPENDU', _('Suspendu')

    # Titre du projet (obligatoire)
    titre = models.CharField(
        max_length=200,
        verbose_name="Titre du projet"
    )

    # Description détaillée du projet
    description = models.TextField(
        blank=True,
        verbose_name="Description"
    )

    # Professeur créateur et responsable du projet
    # Un professeur peut créer plusieurs projets
    createur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='projets_crees',
        verbose_name="Professeur responsable",
        limit_choices_to={'role': 'PROFESSEUR'}
    )

    # Membres de l'équipe (étudiants assignés au projet)
    membres = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through='MembreProjet',
        related_name='projets_membres',
        blank=True,
        verbose_name="Membres de l'équipe"
    )

    # Statut actuel du projet
    statut = models.CharField(
        max_length=20,
        choices=StatutProjet.choices,
        default=StatutProjet.EN_COURS,
        verbose_name="Statut"
    )

    # Couleur d'identification visuelle du projet
    couleur = models.CharField(
        max_length=7,
        default='#1a3a6b',
        verbose_name="Couleur",
        help_text="Code couleur hexadécimal (ex: #1a3a6b)"
    )

    # Image/bannière du projet
    image = models.ImageField(
        upload_to='projets/',
        null=True,
        blank=True,
        verbose_name="Image du projet"
    )

    # Date de début du projet
    date_debut = models.DateField(
        verbose_name="Date de début"
    )

    # Date de fin prévue
    date_fin_prevue = models.DateField(
        null=True,
        blank=True,
        verbose_name="Date de fin prévue"
    )

    # Dates automatiques de création et modification
    date_creation = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Créé le"
    )
    date_modification = models.DateTimeField(
        auto_now=True,
        verbose_name="Modifié le"
    )

    class Meta:
        verbose_name = "Projet"
        verbose_name_plural = "Projets"
        ordering = ['-date_creation']

    def __str__(self):
        return f"{self.titre} - Prof. {self.createur.get_nom_complet()}"

    @property
    def nombre_taches(self):
        """Retourne le nombre total de tâches du projet."""
        return self.taches.count()

    @property
    def nombre_taches_terminees(self):
        """Retourne le nombre de tâches terminées."""
        return self.taches.filter(statut='TERMINE').count()

    @property
    def progression(self):
        """Calcule le pourcentage de progression du projet."""
        total = self.nombre_taches
        if total == 0:
            return 0
        return round((self.nombre_taches_terminees / total) * 100, 1)


class MembreProjet(models.Model):
    """
    Modèle intermédiaire pour la relation Projet-Membre.
    Permet de stocker des informations supplémentaires sur
    la participation d'un membre à un projet.
    """

    # Référence au projet
    projet = models.ForeignKey(
        Projet,
        on_delete=models.CASCADE,
        related_name='adhesions',
        verbose_name="Projet"
    )

    # Référence à l'utilisateur membre
    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='adhesions_projets',
        verbose_name="Membre"
    )

    # Date d'ajout au projet
    date_adhesion = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date d'adhésion"
    )

    # Rôle dans le projet (peut être différent du rôle global)
    role_dans_projet = models.CharField(
        max_length=50,
        blank=True,
        verbose_name="Rôle dans le projet"
    )

    class Meta:
        verbose_name = "Membre du projet"
        verbose_name_plural = "Membres du projet"
        # Un utilisateur ne peut être ajouté qu'une fois par projet
        unique_together = ['projet', 'utilisateur']

    def __str__(self):
        return f"{self.utilisateur.get_nom_complet()} → {self.projet.titre}"
