from django.contrib import admin
from .models import Client


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ['company_name', 'legal_name', 'email', 'industry', 'priority', 'ai_generated', 'created_at']
    list_filter = ['industry', 'priority', 'ai_generated', 'created_at']
    search_fields = ['company_name', 'legal_name', 'email', 'representative']
    ordering = ['-created_at']
