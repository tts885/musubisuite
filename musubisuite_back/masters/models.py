"""
コードマスタ管理モデル

システム全体で使用するドロップダウンリストなどの
マスタデータを一元管理するモデル。
"""

from django.db import models


class CodeCategory(models.Model):
    """
    コードカテゴリモデル
    
    業種、ステータス、優先度などの分類を管理します。
    """
    code = models.CharField(
        'カテゴリコード',
        max_length=50,
        unique=True,
        primary_key=True,
        help_text='英大文字とアンダースコア推奨 (例: PROJECT_STATUS)'
    )
    name = models.CharField('カテゴリ名', max_length=100)
    description = models.TextField('説明', blank=True)
    is_system = models.BooleanField(
        'システム定義',
        default=False,
        help_text='True: システム固定、False: ユーザー定義可能'
    )
    sort_order = models.IntegerField('表示順', default=0)
    is_active = models.BooleanField('有効', default=True)
    created_at = models.DateTimeField('作成日時', auto_now_add=True)
    updated_at = models.DateTimeField('更新日時', auto_now=True)
    
    class Meta:
        db_table = 'code_categories'
        ordering = ['sort_order', 'code']
        verbose_name = 'コードカテゴリ'
        verbose_name_plural = 'コードカテゴリ'
    
    def __str__(self):
        return f"{self.code}: {self.name}"


class CodeMaster(models.Model):
    """
    コードマスタモデル
    
    各カテゴリに属する個別の選択肢を管理します。
    """
    category = models.ForeignKey(
        CodeCategory,
        on_delete=models.CASCADE,
        related_name='codes',
        verbose_name='カテゴリ'
    )
    code = models.CharField(
        'コード',
        max_length=50,
        help_text='半角英数字推奨 (例: planning, active)'
    )
    name = models.CharField('表示名', max_length=100)
    name_en = models.CharField('英語名', max_length=100, blank=True)
    description = models.TextField('説明', blank=True)
    sort_order = models.IntegerField('表示順', default=0)
    is_active = models.BooleanField('有効', default=True)
    color = models.CharField(
        '色',
        max_length=20,
        blank=True,
        help_text='UI表示用カラーコード (例: #FF5733)'
    )
    icon = models.CharField(
        'アイコン',
        max_length=50,
        blank=True,
        help_text='アイコン名 (例: CheckCircle)'
    )
    parent_code = models.CharField(
        '親コード',
        max_length=50,
        blank=True,
        help_text='階層構造の場合の親コード'
    )
    metadata = models.JSONField(
        'メタデータ',
        default=dict,
        blank=True,
        help_text='追加属性をJSON形式で保存'
    )
    created_at = models.DateTimeField('作成日時', auto_now_add=True)
    updated_at = models.DateTimeField('更新日時', auto_now=True)
    
    class Meta:
        db_table = 'code_masters'
        unique_together = ['category', 'code']
        ordering = ['category', 'sort_order', 'code']
        verbose_name = 'コードマスタ'
        verbose_name_plural = 'コードマスタ'
        indexes = [
            models.Index(fields=['category', 'is_active']),
            models.Index(fields=['category', 'sort_order']),
        ]
    
    def __str__(self):
        return f"{self.category.code}.{self.code}: {self.name}"
