from django.contrib import admin
from .models import ActivityLog


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'project', 'action', 'description_preview', 'created_at']
    list_filter = ['created_at', 'action']
    search_fields = ['description', 'user__name', 'project__name']
    ordering = ['-created_at']
    
    def description_preview(self, obj):
        return obj.description[:50] + '...' if len(obj.description) > 50 else obj.description
    description_preview.short_description = 'Description'
