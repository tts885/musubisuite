from django.contrib import admin
from .models import CodeCategory, CodeMaster


@admin.register(CodeCategory)
class CodeCategoryAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'is_system', 'sort_order', 'is_active', 'created_at']
    list_filter = ['is_system', 'is_active']
    search_fields = ['code', 'name', 'description']
    ordering = ['sort_order', 'code']


@admin.register(CodeMaster)
class CodeMasterAdmin(admin.ModelAdmin):
    list_display = ['category', 'code', 'name', 'sort_order', 'is_active', 'color']
    list_filter = ['category', 'is_active']
    search_fields = ['code', 'name', 'description']
    ordering = ['category', 'sort_order', 'code']
    list_select_related = ['category']
