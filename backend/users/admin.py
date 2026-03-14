"""Administration des utilisateurs ESMT."""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import UtilisateurESMT

@admin.register(UtilisateurESMT)
class UtilisateurESMTAdmin(UserAdmin):
    list_display = ['email', 'get_full_name', 'role', 'departement', 'is_active', 'date_joined']
    list_filter = ['role', 'is_active', 'departement']
    search_fields = ['email', 'first_name', 'last_name', 'username']
    ordering = ['last_name', 'first_name']
    fieldsets = UserAdmin.fieldsets + (
        ('Informations ESMT', {
            'fields': ('role', 'departement', 'bio', 'avatar')
        }),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Informations ESMT', {
            'fields': ('email', 'role', 'departement')
        }),
    )
