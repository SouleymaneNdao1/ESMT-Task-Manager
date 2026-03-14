from rest_framework import serializers
from .models import Tache, CommentaireTache
from users.serializers import UtilisateurSerializer

class CommentaireTacheSérialiseur(serializers.ModelSerializer):
    auteur_nom = serializers.CharField(source='auteur.get_nom_complet', read_only=True)
    auteur_avatar = serializers.SerializerMethodField()

    class Meta:
        model = CommentaireTache
        fields = ['id', 'tache', 'auteur', 'auteur_nom', 'auteur_avatar', 'contenu', 'date_creation']
        read_only_fields = ['auteur']

    def get_auteur_avatar(self, obj):
        return obj.auteur.get_avatar_url()

class TacheListeSérialiseur(serializers.ModelSerializer):
    assigne_a_nom = serializers.CharField(source='assigne_a.get_nom_complet', read_only=True, default="Non assigné")
    projet_titre = serializers.CharField(source='projet.titre', read_only=True)

    class Meta:
        model = Tache
        fields = [
            'id', 'titre', 'projet', 'projet_titre', 'assigne_a', 'assigne_a_nom',
            'statut', 'priorite', 'date_limite', 'est_en_retard'
        ]

class TacheDetailSérialiseur(serializers.ModelSerializer):
    assigne_a_detail = UtilisateurSerializer(source='assigne_a', read_only=True)
    cree_par_detail = UtilisateurSerializer(source='cree_par', read_only=True)
    commentaires = CommentaireTacheSérialiseur(many=True, read_only=True)

    class Meta:
        model = Tache
        fields = [
            'id', 'titre', 'description', 'projet', 'assigne_a', 'assigne_a_detail',
            'cree_par', 'cree_par_detail', 'statut', 'priorite', 'date_limite',
            'date_completion', 'termine_dans_delais', 'ordre', 'etiquettes',
            'date_creation', 'commentaires', 'est_en_retard'
        ]

class CreerTacheSérialiseur(serializers.ModelSerializer):
    class Meta:
        model = Tache
        fields = ['titre', 'description', 'projet', 'assigne_a', 'priorite', 'date_limite', 'etiquettes', 'ordre']

    def validate(self, data):
        # Vérification des rôles (Cahier des charges : étudiant ne peut pas assigner un prof)
        assigne_a = data.get('assigne_a')
        request = self.context.get('request')
        if assigne_a and assigne_a.role == 'PROFESSEUR' and request.user.role == 'ETUDIANT':
            raise serializers.ValidationError({"assigne_a": "Un étudiant ne peut pas assigner un professeur à une tâche."})
        return data
