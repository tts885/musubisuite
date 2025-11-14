from django.contrib import admin
from .models import Client


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ['company_name', 'name', 'email', 'industry', 'created_at']
    list_filter = ['industry', 'created_at']
    search_fields = ['name', 'company_name', 'email']
    ordering = ['-created_at']
