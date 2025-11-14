"""
クライアント管理モデル

企業のクライアント(顧客)情報を管理します。

Author: 開発チーム
Created: 2025-11-14
"""

from django.db import models
from django.core.validators import EmailValidator
from django.core.exceptions import ValidationError
from django.utils import timezone
from typing import Optional


class Client(models.Model):
    """
    クライアント(顧客)モデル
    
    企業のクライアント情報を管理します。
    各クライアントは複数のプロジェクトと関連付けることができます。
    
    Attributes:
        name (str): 担当者名(最大100文字)
        company_name (str): 会社名(最大200文字)
        email (str): メールアドレス
        phone (str): 電話番号(任意、最大50文字)
        address (str): 住所(任意)
        industry (str): 業種
            - 'it': IT・通信
            - 'manufacturing': 製造
            - 'finance': 金融
            - 'retail': 小売
            - 'service': サービス
            - 'other': その他
        note (str): 備考(任意)
        created_at (datetime): 作成日時
        updated_at (datetime): 最終更新日時
    
    Meta:
        db_table (str): データベースのテーブル名
        ordering (list): デフォルトの並び順(作成日時の降順)
        verbose_name (str): 管理画面での表示名
        indexes (list): パフォーマンス向上のためのインデックス
    
    Examples:
        >>> # クライアント作成
        >>> client = Client.objects.create(
        ...     name="田中太郎",
        ...     company_name="株式会社Example",
        ...     email="tanaka@example.com",
        ...     phone="03-1234-5678",
        ...     industry='it'
        ... )
        >>> 
        >>> # 文字列表現
        >>> print(client)
        '株式会社Example - 田中太郎'
        >>> 
        >>> # 関連プロジェクト取得
        >>> projects = client.projects.all()
    
    Note:
        - emailは有効な形式である必要があります
        - 同じメールアドレスで複数のクライアントを登録できます
        - 削除時は関連プロジェクトへの影響を考慮してください
    
    See Also:
        - Project: クライアントに紐づくプロジェクト
    """
    
    INDUSTRY_CHOICES = [
        ('it', 'IT・通信'),
        ('manufacturing', '製造'),
        ('finance', '金融'),
        ('retail', '小売'),
        ('service', 'サービス'),
        ('other', 'その他'),
    ]
    
    name = models.CharField(
        '担当者名', 
        max_length=100,
        help_text='クライアントの担当者名'
    )
    
    company_name = models.CharField(
        '会社名', 
        max_length=200,
        db_index=True,  # 会社名での検索を高速化
        help_text='クライアントの会社名'
    )
    
    email = models.EmailField(
        'メールアドレス',
        validators=[EmailValidator()],
        help_text='クライアントのメールアドレス'
    )
    
    phone = models.CharField(
        '電話番号', 
        max_length=50, 
        blank=True, 
        null=True,
        help_text='クライアントの電話番号'
    )
    
    address = models.TextField(
        '住所', 
        blank=True, 
        null=True,
        help_text='クライアントの住所'
    )
    
    industry = models.CharField(
        '業種', 
        max_length=20, 
        choices=INDUSTRY_CHOICES, 
        blank=True, 
        null=True,
        db_index=True,  # 業種別の検索を高速化
        help_text='クライアントの業種'
    )
    
    note = models.TextField(
        '備考', 
        blank=True, 
        null=True,
        help_text='クライアントに関する備考'
    )
    
    created_at = models.DateTimeField(
        '作成日時', 
        default=timezone.now,
        help_text='クライアント登録日時'
    )
    
    updated_at = models.DateTimeField(
        '更新日時', 
        auto_now=True,
        help_text='最終更新日時'
    )
    
    class Meta:
        db_table = 'clients'
        verbose_name = 'クライアント'
        verbose_name_plural = 'クライアント'
        ordering = ['-created_at']
        indexes = [
            # 会社名での検索を高速化
            models.Index(fields=['company_name']),
            # 業種別の検索を高速化
            models.Index(fields=['industry', '-created_at']),
        ]
    
    def __str__(self) -> str:
        """
        文字列表現
        
        Returns:
            str: "会社名 - 担当者名" の形式
        """
        return f"{self.company_name} - {self.name}"
    
    @property
    def project_count(self) -> int:
        """
        クライアントに紐づくプロジェクト数を取得する
        
        Returns:
            int: プロジェクト数
        
        Examples:
            >>> client.project_count
            15
        
        Note:
            N+1問題を避けるため、ViewSetでannotateを使用することを推奨
        """
        return self.projects.count()
    
    def clean(self) -> None:
        """
        モデルレベルのバリデーション
        
        save()実行前に呼び出され、データの整合性をチェックします。
        
        Raises:
            ValidationError: バリデーションエラーがある場合
        
        Note:
            - 担当者名と会社名は空白のみの値は不可
        """
        errors = {}
        
        # 担当者名のチェック
        if self.name and not self.name.strip():
            errors['name'] = '担当者名は空白のみにできません'
        
        # 会社名のチェック
        if self.company_name and not self.company_name.strip():
            errors['company_name'] = '会社名は空白のみにできません'
        
        if errors:
            raise ValidationError(errors)
    
    def save(self, *args, **kwargs) -> None:
        """
        保存処理
        
        保存前にバリデーションを実行します。
        
        Note:
            full_clean()を呼び出すことで、cleanメソッドと
            フィールドレベルのバリデーションが実行されます
        """
        self.full_clean()
        super().save(*args, **kwargs)
