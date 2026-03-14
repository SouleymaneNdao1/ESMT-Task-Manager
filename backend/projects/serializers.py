from rest_framework import serializers
from .models import Projet, MembreProjet
from users.serializers import UtilisateurSerializer
from users.models import UtilisateurESMT

class ProjetListeSérialiseur(serializers.ModelSerializer):
    createur_nom = serializers.CharField(source='createur.get_nom_complet', read_only=True)
    nombre_membres = serializers.IntegerField(source='membres.count', read_only=True)
    nombre_taches = serializers.IntegerField(source='taches.count', read_only=True)

    class Meta:
        model = Projet
        fields = [
            'id', 'titre', 'description', 'createur', 'createur_nom', 
            'statut', 'couleur', 'date_debut', 'date_fin_prevue', 
            'nombre_membres', 'nombre_taches', 'progression'
        ]

class ProjetDetailSérialiseur(serializers.ModelSerializer):
    createur_detail = UtilisateurSerializer(source='createur', read_only=True)
    membres = UtilisateurSerializer(many=True, read_only=True)
    progression = serializers.FloatField(read_only=True)
    nombre_taches = serializers.IntegerField(source='taches.count', read_only=True)
    nombre_taches_terminees = serializers.SerializerMethodField()

    def get_nombre_taches_terminees(self, obj):
        return obj.taches.filter(statut='TERMINE').count()

    class Meta:
        model = Projet
        fields = [
            'id', 'titre', 'description', 'createur', 'createur_detail',
            'statut', 'couleur', 'date_debut', 'date_fin_prevue',
            'date_creation', 'membres', 'progression', 
            'nombre_taches', 'nombre_taches_terminees'
        ]

class CreerProjetSérialiseur(serializers.ModelSerializer):
    membres_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = Projet
        fields = ['titre', 'description', 'statut', 'couleur', 'date_debut', 'date_fin_prevue', 'membres_ids']

    def create(self, données_validées):
        membres_ids = données_validées.pop('membres_ids', [])
        createur = self.context['request'].user
        projet = Projet.objects.create(createur=createur, **données_validées)
        
        # Ajouter le créateur comme membre par défaut
        MembreProjet.objects.create(projet=projet, utilisateur=createur, role_dans_projet="Créateur")
        
        # Ajouter les autres membres
        for m_id in membres_ids:
            if m_id != createur.id:
                MembreProjet.objects.create(projet=projet, utilisateur_id=m_id)
        
        return projet

class AjouterMembreSérialiseur(serializers.Serializer):
    utilisateur_id = serializers.IntegerField(required=False)
    email = serializers.EmailField(required=False)

    def get_utilisateur(self):
        u_id = self.validated_data.get('utilisateur_id')
        email = self.validated_data.get('email')
        
        if u_id:
            return UtilisateurESMT.objects.get(id=u_id)
        elif email:
            return UtilisateurESMT.objects.get(email=email)
        raise serializers.ValidationError("ID ou Email requis.")
