"""
AI設定 Django Admin

Author: 開発チーム
Created: 2025-11-16
"""

from django.contrib import admin
from .models import AIProvider, SearchEngineConfig, AISettings


@admin.register(AIProvider)
class AIProviderAdmin(admin.ModelAdmin):
    """AIプロバイダー管理画面"""
    
    list_display = [
        'name',
        'provider_type',
        'model_name',
        'is_active',
        'is_default',
        'created_at',
    ]
    
    list_filter = [
        'provider_type',
        'is_active',
        'is_default',
    ]
    
    search_fields = ['name', 'model_name', 'endpoint']
    
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('基本情報', {
            'fields': (
                'name',
                'provider_type',
                'endpoint',
                'model_name',
            )
        }),
        ('APIキー', {
            'fields': (
                'api_key_encrypted',
            ),
            'description': 'APIキーは暗号化して保存されます',
        }),
        ('パラメータ', {
            'fields': (
                'max_tokens',
                'temperature',
            )
        }),
        ('設定', {
            'fields': (
                'is_active',
                'is_default',
            )
        }),
        ('システム情報', {
            'fields': (
                'created_at',
                'updated_at',
            ),
            'classes': ('collapse',),
        }),
    )


@admin.register(SearchEngineConfig)
class SearchEngineConfigAdmin(admin.ModelAdmin):
    """検索エンジン設定管理画面"""
    
    list_display = [
        'name',
        'engine_type',
        'max_results',
        'is_active',
        'is_default',
        'created_at',
    ]
    
    list_filter = [
        'engine_type',
        'is_active',
        'is_default',
    ]
    
    search_fields = ['name', 'search_engine_id']
    
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('基本情報', {
            'fields': (
                'name',
                'engine_type',
                'search_engine_id',
            )
        }),
        ('APIキー', {
            'fields': (
                'api_key_encrypted',
            ),
            'description': 'APIキーは暗号化して保存されます',
        }),
        ('設定', {
            'fields': (
                'max_results',
                'is_active',
                'is_default',
            )
        }),
        ('システム情報', {
            'fields': (
                'created_at',
                'updated_at',
            ),
            'classes': ('collapse',),
        }),
    )


@admin.register(AISettings)
class AISettingsAdmin(admin.ModelAdmin):
    """AI設定管理画面"""
    
    list_display = [
        'ai_enabled',
        'require_confirmation',
        'allow_overwrite',
        'confidence_threshold',
        'auto_save_on_high_confidence',
        'updated_at',
    ]
    
    readonly_fields = ['updated_at']
    
    fieldsets = (
        ('AI機能設定', {
            'fields': (
                'ai_enabled',
                'require_confirmation',
                'allow_overwrite',
            )
        }),
        ('信頼度設定', {
            'fields': (
                'confidence_threshold',
                'auto_save_on_high_confidence',
            )
        }),
        ('システム情報', {
            'fields': (
                'updated_at',
            ),
            'classes': ('collapse',),
        }),
    )
    
    def has_add_permission(self, request):
        """追加を禁止（シングルトン）"""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """削除を禁止（シングルトン）"""
        return False
