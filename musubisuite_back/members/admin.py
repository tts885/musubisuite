from django.contrib import admin
from .models import Member


@admin.register(Member)
class MemberAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'role', 'department', 'position', 'joined_at']
    list_filter = ['role', 'department', 'joined_at']
    search_fields = ['name', 'email', 'department', 'position']
    ordering = ['name']
