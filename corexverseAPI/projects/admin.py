from django.contrib import admin
from .models import Project, Attachment, Comment


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'client', 'status', 'priority', 'progress', 'start_date', 'end_date', 'created_at']
    list_filter = ['status', 'priority', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['-created_at']
    filter_horizontal = ['members']


@admin.register(Attachment)
class AttachmentAdmin(admin.ModelAdmin):
    list_display = ['file_name', 'project', 'uploaded_by', 'file_size', 'uploaded_at']
    list_filter = ['uploaded_at']
    search_fields = ['file_name', 'project__name']
    ordering = ['-uploaded_at']


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ['author', 'project', 'task', 'content_preview', 'created_at']
    list_filter = ['created_at']
    search_fields = ['content', 'author__name', 'project__name']
    ordering = ['created_at']
    
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content'
