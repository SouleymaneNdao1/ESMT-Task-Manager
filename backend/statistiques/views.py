from rest_framework import views, permissions, status
from rest_framework.response import Response
from django.db.models import Count, Q
from django.utils import timezone
from datetime import datetime
from tasks.models import Tache
from projects.models import Projet
from users.models import UtilisateurESMT

def calculer_prime(total, dans_delais):
    if total == 0:
        return {"prime": 0, "pourcentage": 0, "eligible_100k": False, "eligible_30k": False}
    
    pourcentage = (dans_delais / total) * 100
    prime = 0
    eligible_100k = False
    eligible_30k = False

    if pourcentage == 100:
        prime = 100000
        eligible_100k = True
        eligible_30k = True
    elif pourcentage >= 90:
        prime = 30000
        eligible_30k = True
    
    return {
        "prime": prime,
        "pourcentage": round(pourcentage, 2),
        "eligible_100k": eligible_100k,
        "eligible_30k": eligible_30k
    }

class StatistiquesTableauBordVue(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        est_prof = user.role == 'PROFESSEUR'
        
        # Filtre de base pour les tâches selon le rôle
        filtre_taches = Q(cree_par=user) if est_prof else Q(assigne_a=user)
        
        projets_actifs = Projet.objects.filter(Q(createur=user) | Q(membres=user)).distinct().count()
        
        taches_stats = Tache.objects.filter(filtre_taches).aggregate(
            total=Count('id'),
            a_faire=Count('id', filter=Q(statut='A_FAIRE')),
            en_cours=Count('id', filter=Q(statut='EN_COURS')),
            terminees=Count('id', filter=Q(statut='TERMINE')),
            en_retard=Count('id', filter=Q(date_limite__lt=timezone.now(), statut__in=['A_FAIRE', 'EN_COURS', 'EN_REVISION']))
        )

        nombre_etudiants = 0
        if est_prof:
            # Compte les étudiants uniques dans tous les projets du professeur
            nombre_etudiants = UtilisateurESMT.objects.filter(
                adhesions_projets__projet__createur=user,
                role='ETUDIANT'
            ).distinct().count()

        data = {
            "role": user.role,
            "nombre_projets": projets_actifs,
            "taches": {
                "total": taches_stats['total'],
                "a_faire": taches_stats['a_faire'],
                "en_cours": taches_stats['en_cours'],
                "terminees": taches_stats['terminees'],
                "en_retard": taches_stats['en_retard']
            }
        }

        if est_prof:
            data["nombre_etudiants"] = nombre_etudiants
        else:
            # Performance pour les étudiants
            terminees = taches_stats['terminees']
            total = taches_stats['total']
            dans_delais = Tache.objects.filter(
                assigne_a=user, 
                statut='TERMINE', 
                termine_dans_delais=True
            ).count()
            
            data["performance"] = {
                "total_terminees": terminees,
                "pourcentage_dans_delais": round((dans_delais / terminees * 100) if terminees > 0 else 0, 1)
            }

        return Response(data)

class StatistiquesTrimestriellesVue(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        annee = int(request.query_params.get('annee', timezone.now().year))
        trimestre = int(request.query_params.get('trimestre', (timezone.now().month - 1) // 3 + 1))
        
        mois_debut = (trimestre - 1) * 3 + 1
        mois_fin = trimestre * 3
        
        taches = Tache.objects.filter(
            assigne_a=request.user,
            date_limite__year=annee,
            date_limite__month__gte=mois_debut,
            date_limite__month__lte=mois_fin
        )
        
        total = taches.count()
        terminees = taches.filter(statut='TERMINE').count()
        dans_delais = taches.filter(termine_dans_delais=True).count()
        
        stats_prime = calculer_prime(total, dans_delais)
        
        return Response({
            "trimestre": trimestre,
            "annee": annee,
            "taches": {
                "total": total,
                "terminees": terminees,
                "dans_delais": dans_delais
            },
            "performance": {
                "pourcentage_completion": round((terminees / total * 100), 2) if total > 0 else 0,
                "pourcentage_dans_delais": stats_prime["pourcentage"]
            },
            "prime": stats_prime if request.user.est_professeur else None
        })

class StatistiquesAnnuellesVue(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        annee = int(request.query_params.get('annee', timezone.now().year))
        par_trimestre = []
        
        total_annuel = 0
        terminees_annuel = 0
        
        for t in range(1, 5):
            mois_debut = (t - 1) * 3 + 1
            mois_fin = t * 3
            
            taches = Tache.objects.filter(
                assigne_a=request.user,
                date_limite__year=annee,
                date_limite__month__gte=mois_debut,
                date_limite__month__lte=mois_fin
            )
            
            total = taches.count()
            terminees = taches.filter(statut='TERMINE').count()
            dans_delais = taches.filter(termine_dans_delais=True).count()
            
            total_annuel += total
            terminees_annuel += terminees
            
            stats_prime = calculer_prime(total, dans_delais)
            
            par_trimestre.append({
                "trimestre": t,
                "date_debut": datetime(annee, mois_debut, 1),
                "date_fin": datetime(annee, mois_fin, 28), # Approximatif
                "total_taches": total,
                "terminees": terminees,
                "dans_delais": dans_delais,
                "pourcentage_delais": stats_prime["pourcentage"],
                "prime": stats_prime if request.user.est_professeur else None
            })
            
        return Response({
            "annee": annee,
            "par_trimestre": par_trimestre,
            "resume_annuel": {
                "total_taches": total_annuel,
                "terminees": terminees_annuel,
                "pourcentage_global": round((terminees_annuel / total_annuel * 100), 2) if total_annuel > 0 else 0
            }
        })

class EvaluationPrimesProfesseursVue(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # On permet à tous les professeurs de voir le classement
        if not request.user.est_professeur:
            return Response({"erreur": "Accès réservé aux professeurs."}, status=status.HTTP_403_FORBIDDEN)
            
        annee = int(request.query_params.get('annee', timezone.now().year))
        trimestre = int(request.query_params.get('trimestre', (timezone.now().month - 1) // 3 + 1))
        
        mois_debut = (trimestre - 1) * 3 + 1
        mois_fin = trimestre * 3
        
        professeurs = UtilisateurESMT.objects.filter(role='PROFESSEUR')
        resultats = []
        
        for prof in professeurs:
            taches = Tache.objects.filter(
                assigne_a=prof,
                date_limite__year=annee,
                date_limite__month__gte=mois_debut,
                date_limite__month__lte=mois_fin
            )
            
            total = taches.count()
            if total == 0: continue # On n'affiche que ceux qui ont des tâches
            
            terminees = taches.filter(statut='TERMINE').count()
            dans_delais = taches.filter(termine_dans_delais=True).count()
            
            stats_prime = calculer_prime(total, dans_delais)
            
            resultats.append({
                "professeur": {
                    "id": prof.id,
                    "nom": prof.get_full_name() or prof.username,
                    "avatar": prof.get_avatar_url(),
                    "departement": prof.departement
                },
                "total_taches": total,
                "taches_terminees": terminees,
                "dans_delais": dans_delais,
                "pourcentage_dans_delais": stats_prime["pourcentage"],
                "prime": stats_prime
            })
            
        # Trier par pourcentage (décroissant)
        resultats.sort(key=lambda x: x["pourcentage_dans_delais"], reverse=True)
        
        return Response({
            "annee": annee,
            "trimestre": trimestre,
            "evaluation_professeurs": resultats
        })

