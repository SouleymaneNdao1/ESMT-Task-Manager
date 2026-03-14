from django.db import models
from django.conf import settings
from django.utils import timezone

class Tache(models.Model):
    STATUT_CHOICES = [
        ('A_FAIRE', 'À faire'),
        ('EN_COURS', 'En cours'),
        ('EN_REVISION', 'En révision'),
        ('TERMINE', 'Terminé'),
        ('ANNULE', 'Annulé'),
    ]

    PRIORITE_CHOICES = [
        ('BASSE', 'Basse'),
        ('NORMALE', 'Normale'),
        ('HAUTE', 'Haute'),
        ('URGENTE', 'Urgente'),
    ]

    titre = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    projet = models.ForeignKey('projects.Projet', on_delete=models.CASCADE, related_name='taches')
    assigne_a = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='taches_assignees'
    )
    cree_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='taches_creees'
    )
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='A_FAIRE')
    priorite = models.CharField(max_length=20, choices=PRIORITE_CHOICES, default='NORMALE')
    date_limite = models.DateTimeField()
    date_completion = models.DateTimeField(null=True, blank=True)
    termine_dans_delais = models.BooleanField(null=True, blank=True)
    ordre = models.PositiveIntegerField(default=0)
    etiquettes = models.CharField(max_length=200, blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['ordre', '-date_creation']
        verbose_name = 'Tâche'
        verbose_name_plural = 'Tâches'

    def __str__(self):
        return self.titre

    def save(self, *args, **kwargs):
        if self.statut == 'TERMINE' and not self.date_completion:
            self.date_completion = timezone.now()
            self.termine_dans_delais = self.date_completion <= self.date_limite
        elif self.statut != 'TERMINE':
            self.date_completion = None
            self.termine_dans_delais = None
        super().save(*args, **kwargs)

    @property
    def est_en_retard(self):
        if self.statut != 'TERMINE' and self.date_limite < timezone.now():
            return True
        return False

class CommentaireTache(models.Model):
    tache = models.ForeignKey(Tache, on_delete=models.CASCADE, related_name='commentaires')
    auteur = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    contenu = models.TextField()
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['date_creation']
        verbose_name = 'Commentaire'
        verbose_name_plural = 'Commentaires'
