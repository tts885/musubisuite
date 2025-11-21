"""
AI設定 App設定

Author: 開発チーム
Created: 2025-11-16
"""

from django.apps import AppConfig


class AiSettingsConfig(AppConfig):
    """AI設定アプリケーション設定"""
    
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'ai_settings'
    verbose_name = 'AI設定'
