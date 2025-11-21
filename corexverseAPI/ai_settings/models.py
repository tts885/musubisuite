"""
AI設定モデル

AI機能全体で共通利用する設定を管理します。
LLMプロバイダー、検索エンジン、その他のAI関連設定を一元管理します。

Author: 開発チーム
Created: 2025-11-16
"""

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from django.utils import timezone
from cryptography.fernet import Fernet
import base64
import hashlib


class AIProvider(models.Model):
    """
    AIプロバイダー設定モデル
    
    LLM（Large Language Model）プロバイダーの設定を管理します。
    複数のプロバイダーを登録でき、機能ごとに使い分けることができます。
    
    Attributes:
        name (str): プロバイダー名
        provider_type (str): プロバイダータイプ（openai/azure_openai/anthropic）
        endpoint (str): APIエンドポイント
        api_key (str): APIキー（暗号化保存）
        model_name (str): 使用モデル名
        max_tokens (int): 最大トークン数
        temperature (float): 生成の多様性（0.0-2.0）
        is_active (bool): 有効フラグ
        is_default (bool): デフォルト設定フラグ
        created_at (datetime): 作成日時
        updated_at (datetime): 最終更新日時
    """
    
    PROVIDER_TYPES = [
        ('openai', 'OpenAI'),
        ('azure_openai', 'Azure OpenAI'),
        ('anthropic', 'Anthropic Claude'),
        ('google', 'Google Gemini'),
    ]
    
    name = models.CharField(
        '設定名',
        max_length=100,
        help_text='識別用の設定名'
    )
    
    provider_type = models.CharField(
        'プロバイダータイプ',
        max_length=20,
        choices=PROVIDER_TYPES,
        help_text='LLMプロバイダーの種類'
    )
    
    endpoint = models.URLField(
        'エンドポイント',
        blank=True,
        max_length=500,
        help_text='APIエンドポイントURL（Azure OpenAIの場合は必須）'
    )
    
    api_key_encrypted = models.TextField(
        'APIキー（暗号化）',
        help_text='APIキー（自動的に暗号化されます）'
    )
    
    # Azure OpenAI固有フィールド
    api_version = models.CharField(
        'APIバージョン',
        max_length=50,
        blank=True,
        help_text='Azure OpenAIのAPIバージョン（例：2024-02-01）'
    )
    
    deployment_name = models.CharField(
        'デプロイメント名',
        max_length=100,
        blank=True,
        help_text='Azure OpenAIのデプロイメント名（オプション）'
    )
    
    # OpenAI固有フィールド
    organization_id = models.CharField(
        '組織ID',
        max_length=100,
        blank=True,
        help_text='OpenAIの組織ID（オプション）'
    )
    
    model_name = models.CharField(
        'モデル名',
        max_length=100,
        help_text='使用するモデル名（例：gpt-4o, claude-3-5-sonnet, gemini-2.0-flash）'
    )
    
    max_tokens = models.IntegerField(
        '最大トークン数',
        default=4000,
        validators=[MinValueValidator(1), MaxValueValidator(200000)],
        help_text='生成する最大トークン数'
    )
    
    temperature = models.FloatField(
        '温度パラメータ',
        default=0.7,
        validators=[MinValueValidator(0.0), MaxValueValidator(2.0)],
        help_text='生成の多様性（0.0=決定的、2.0=ランダム）'
    )
    
    is_active = models.BooleanField(
        '有効',
        default=True,
        help_text='この設定を有効にするか'
    )
    
    is_default = models.BooleanField(
        'デフォルト',
        default=False,
        help_text='デフォルトのプロバイダーとして使用'
    )
    
    # システム
    created_at = models.DateTimeField(
        '作成日時',
        default=timezone.now
    )
    
    updated_at = models.DateTimeField(
        '更新日時',
        auto_now=True
    )
    
    class Meta:
        db_table = 'ai_providers'
        verbose_name = 'AIプロバイダー'
        verbose_name_plural = 'AIプロバイダー'
        ordering = ['-is_default', '-is_active', 'name']
    
    def __str__(self) -> str:
        """文字列表現"""
        status = "✓" if self.is_active else "×"
        default = " [デフォルト]" if self.is_default else ""
        return f"{status} {self.name} ({self.get_provider_type_display()}){default}"
    
    @staticmethod
    def _get_encryption_key() -> bytes:
        """暗号化キーを生成（Django SECRET_KEYベース）"""
        from django.conf import settings
        key = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
        return base64.urlsafe_b64encode(key)
    
    def set_api_key(self, api_key: str):
        """APIキーを暗号化して保存"""
        if not api_key:
            return
        fernet = Fernet(self._get_encryption_key())
        self.api_key_encrypted = fernet.encrypt(api_key.encode()).decode()
    
    def get_api_key(self) -> str:
        """APIキーを復号化して取得"""
        if not self.api_key_encrypted:
            return ""
        try:
            fernet = Fernet(self._get_encryption_key())
            return fernet.decrypt(self.api_key_encrypted.encode()).decode()
        except Exception:
            return ""
    
    def save(self, *args, **kwargs):
        """保存処理"""
        # デフォルト設定は1つだけ
        if self.is_default:
            AIProvider.objects.filter(is_default=True).exclude(pk=self.pk).update(is_default=False)
        
        super().save(*args, **kwargs)


class SearchEngineConfig(models.Model):
    """
    検索エンジン設定モデル
    
    Web検索に使用する検索エンジンの設定を管理します。
    
    Attributes:
        name (str): 設定名
        engine_type (str): 検索エンジンタイプ（bing/google）
        api_key (str): APIキー（暗号化保存）
        search_engine_id (str): カスタム検索エンジンID（Google用）
        max_results (int): 最大検索結果数
        is_active (bool): 有効フラグ
        is_default (bool): デフォルト設定フラグ
        created_at (datetime): 作成日時
        updated_at (datetime): 最終更新日時
    """
    
    ENGINE_TYPES = [
        ('bing', 'Bing Search API'),
        ('google', 'Google Custom Search'),
        ('serper', 'Serper API'),
    ]
    
    name = models.CharField(
        '設定名',
        max_length=100,
        help_text='識別用の設定名'
    )
    
    engine_type = models.CharField(
        '検索エンジン',
        max_length=20,
        choices=ENGINE_TYPES,
        help_text='検索エンジンの種類'
    )
    
    api_key_encrypted = models.TextField(
        'APIキー（暗号化）',
        help_text='検索APIキー（自動的に暗号化されます）'
    )
    
    search_engine_id = models.CharField(
        '検索エンジンID',
        max_length=100,
        blank=True,
        help_text='カスタム検索エンジンID（Google CSEの場合のみ）'
    )
    
    max_results = models.IntegerField(
        '最大検索結果数',
        default=5,
        validators=[MinValueValidator(1), MaxValueValidator(20)],
        help_text='取得する検索結果の最大数'
    )
    
    is_active = models.BooleanField(
        '有効',
        default=True,
        help_text='この設定を有効にするか'
    )
    
    is_default = models.BooleanField(
        'デフォルト',
        default=False,
        help_text='デフォルトの検索エンジンとして使用'
    )
    
    # システム
    created_at = models.DateTimeField(
        '作成日時',
        default=timezone.now
    )
    
    updated_at = models.DateTimeField(
        '更新日時',
        auto_now=True
    )
    
    class Meta:
        db_table = 'search_engine_configs'
        verbose_name = '検索エンジン設定'
        verbose_name_plural = '検索エンジン設定'
        ordering = ['-is_default', '-is_active', 'name']
    
    def __str__(self) -> str:
        """文字列表現"""
        status = "✓" if self.is_active else "×"
        default = " [デフォルト]" if self.is_default else ""
        return f"{status} {self.name} ({self.get_engine_type_display()}){default}"
    
    @staticmethod
    def _get_encryption_key() -> bytes:
        """暗号化キーを生成"""
        from django.conf import settings
        key = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
        return base64.urlsafe_b64encode(key)
    
    def set_api_key(self, api_key: str):
        """APIキーを暗号化して保存"""
        if not api_key:
            return
        fernet = Fernet(self._get_encryption_key())
        self.api_key_encrypted = fernet.encrypt(api_key.encode()).decode()
    
    def get_api_key(self) -> str:
        """APIキーを復号化して取得"""
        if not self.api_key_encrypted:
            return ""
        try:
            fernet = Fernet(self._get_encryption_key())
            return fernet.decrypt(self.api_key_encrypted.encode()).decode()
        except Exception:
            return ""
    
    def save(self, *args, **kwargs):
        """保存処理"""
        # デフォルト設定は1つだけ
        if self.is_default:
            SearchEngineConfig.objects.filter(is_default=True).exclude(pk=self.pk).update(is_default=False)
        
        super().save(*args, **kwargs)


class AISettings(models.Model):
    """
    AI機能全般の設定モデル
    
    AI機能全体で共通する設定を管理します（シングルトン）。
    
    Attributes:
        ai_enabled (bool): AI機能を有効化
        require_confirmation (bool): AI取得時に確認ダイアログを表示
        allow_overwrite (bool): 既存データの上書きを許可
        confidence_threshold (int): 信頼度しきい値（0-100）
        auto_save_on_high_confidence (bool): 高信頼度時は自動保存
        updated_at (datetime): 最終更新日時
    """
    
    ai_enabled = models.BooleanField(
        'AI機能を有効化',
        default=True,
        help_text='AI機能全体を有効にするか'
    )
    
    require_confirmation = models.BooleanField(
        '確認ダイアログを表示',
        default=True,
        help_text='AI取得前に確認ダイアログを表示'
    )
    
    allow_overwrite = models.BooleanField(
        '既存データの上書きを許可',
        default=False,
        help_text='既存のデータをAI取得データで上書きすることを許可'
    )
    
    confidence_threshold = models.IntegerField(
        '信頼度しきい値',
        default=70,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text='この値以上の信頼度のデータのみ使用（0-100）'
    )
    
    auto_save_on_high_confidence = models.BooleanField(
        '高信頼度時は自動保存',
        default=False,
        help_text='信頼度が90%以上の場合は自動保存'
    )
    
    # システム
    updated_at = models.DateTimeField(
        '更新日時',
        auto_now=True
    )
    
    class Meta:
        db_table = 'ai_settings'
        verbose_name = 'AI設定'
        verbose_name_plural = 'AI設定'
    
    def __str__(self) -> str:
        """文字列表現"""
        return "AI設定"
    
    def save(self, *args, **kwargs):
        """保存処理（シングルトン）"""
        self.pk = 1
        super().save(*args, **kwargs)
    
    def delete(self, *args, **kwargs):
        """削除を防止"""
        pass
    
    @classmethod
    def load(cls):
        """設定を読み込み（存在しない場合は作成）"""
        obj, created = cls.objects.get_or_create(pk=1)
        return obj
