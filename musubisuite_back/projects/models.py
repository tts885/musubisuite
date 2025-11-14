"""
プロジェクト管理モデル

企業のプロジェクト(案件)情報を管理します。
各プロジェクトはクライアント、メンバー、タスクと関連付けられます。

Author: 開発チーム
Created: 2025-11-14
"""

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import date
from typing import Optional
from clients.models import Client
from members.models import Member


class Project(models.Model):
    """
    プロジェクト(案件)モデル
    
    企業のプロジェクト情報を管理します。
    各プロジェクトはクライアント、オーナー、メンバーと関連付けられ、
    進捗状況、予算、タスクを追跡できます。
    
    Attributes:
        name (str): プロジェクト名(最大200文字)
        description (str): プロジェクトの詳細説明
        status (str): プロジェクトのステータス
            - 'planning': 計画中
            - 'active': 進行中
            - 'on-hold': 保留
            - 'completed': 完了
            - 'cancelled': 中止
        priority (str): プロジェクトの優先度
            - 'low': 低
            - 'medium': 中
            - 'high': 高
            - 'urgent': 緊急
        client (Client): 関連クライアント(外部キー)
        start_date (date): プロジェクト開始日
        end_date (date): プロジェクト終了日
        budget (Decimal): 予算(円単位、任意)
        progress (int): 進捗率(0-100)
        owner (Member): プロジェクトオーナー(任意)
        members (QuerySet[Member]): プロジェクトメンバー(多対多)
        tags (list): タグの配列
        created_at (datetime): 作成日時
        updated_at (datetime): 最終更新日時
    
    Meta:
        db_table (str): データベースのテーブル名
        ordering (list): デフォルトの並び順(作成日時の降順)
        verbose_name (str): 管理画面での表示名
        indexes (list): パフォーマンス向上のためのインデックス
    
    Examples:
        >>> # プロジェクト作成
        >>> project = Project.objects.create(
        ...     name="新規プロジェクト",
        ...     client=client,
        ...     start_date=date.today(),
        ...     end_date=date(2025, 12, 31),
        ...     status='planning'
        ... )
        >>> 
        >>> # ステータス変更
        >>> project.status = 'active'
        >>> project.save()
        >>> 
        >>> # 進捗更新
        >>> project.progress = 50
        >>> project.save()
    
    Note:
        - end_dateはstart_date以降である必要があります
        - progressは0-100の範囲内である必要があります
        - 削除時はクライアントとの関連が考慮されます
    
    See Also:
        - Client: プロジェクトのクライアント
        - Member: プロジェクトメンバー
        - Task: プロジェクトに紐づくタスク
    """
    
    STATUS_CHOICES = [
        ('planning', '計画中'),
        ('active', '進行中'),
        ('on-hold', '保留'),
        ('completed', '完了'),
        ('cancelled', '中止'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', '低'),
        ('medium', '中'),
        ('high', '高'),
        ('urgent', '緊急'),
    ]
    
    name = models.CharField(
        'プロジェクト名', 
        max_length=200,
        help_text='プロジェクトの識別名(最大200文字)'
    )
    
    description = models.TextField(
        '説明', 
        blank=True, 
        default='',
        help_text='プロジェクトの詳細説明'
    )
    
    status = models.CharField(
        'ステータス', 
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='planning',
        db_index=True,  # 検索パフォーマンス向上
        help_text='プロジェクトの現在のステータス'
    )
    
    priority = models.CharField(
        '優先度', 
        max_length=20, 
        choices=PRIORITY_CHOICES, 
        default='medium',
        db_index=True,  # 検索パフォーマンス向上
        help_text='プロジェクトの優先度'
    )
    
    client = models.ForeignKey(
        Client, 
        on_delete=models.CASCADE, 
        related_name='projects', 
        verbose_name='クライアント',
        help_text='プロジェクトのクライアント'
    )
    
    start_date = models.DateField(
        '開始日',
        help_text='プロジェクト開始予定日'
    )
    
    end_date = models.DateField(
        '終了日',
        help_text='プロジェクト終了予定日'
    )
    
    budget = models.DecimalField(
        '予算', 
        max_digits=12, 
        decimal_places=2, 
        blank=True, 
        null=True,
        validators=[MinValueValidator(0)],
        help_text='プロジェクト予算(円)'
    )
    
    progress = models.IntegerField(
        '進捗率', 
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text='プロジェクト進捗率(0-100)'
    )
    
    owner = models.ForeignKey(
        Member, 
        on_delete=models.SET_NULL, 
        null=True,
        blank=True,
        related_name='owned_projects', 
        verbose_name='オーナー',
        help_text='プロジェクトオーナー'
    )
    
    members = models.ManyToManyField(
        Member, 
        related_name='projects', 
        verbose_name='メンバー', 
        blank=True,
        help_text='プロジェクトメンバー'
    )
    
    tags = models.JSONField(
        'タグ', 
        default=list, 
        blank=True,
        help_text='プロジェクトタグ'
    )
    
    created_at = models.DateTimeField(
        '作成日時', 
        default=timezone.now,
        help_text='プロジェクト作成日時'
    )
    
    updated_at = models.DateTimeField(
        '更新日時', 
        auto_now=True,
        help_text='最終更新日時'
    )
    
    class Meta:
        db_table = 'projects'
        verbose_name = 'プロジェクト'
        verbose_name_plural = 'プロジェクト'
        ordering = ['-created_at']
        indexes = [
            # ステータス別の新着順検索を高速化
            models.Index(fields=['status', '-created_at']),
            # 優先度別の検索を高速化
            models.Index(fields=['priority', '-created_at']),
            # 日付範囲検索を高速化
            models.Index(fields=['start_date', 'end_date']),
        ]
    
    def __str__(self) -> str:
        """文字列表現"""
        return self.name
    
    @property
    def is_overdue(self) -> bool:
        """
        プロジェクトが期限切れかどうかを判定する
        
        終了日が現在日時より前で、かつ完了していない場合に
        期限切れと判断します。
        
        Returns:
            bool: 期限切れの場合True、それ以外はFalse
        
        Examples:
            >>> project.end_date = date(2024, 12, 31)
            >>> project.status = 'active'
            >>> project.is_overdue  # 2025年の場合
            True
        
        Note:
            完了済み・中止済みプロジェクトは期限切れとみなしません
        """
        if self.status in ('completed', 'cancelled'):
            return False
        return timezone.now().date() > self.end_date
    
    @property
    def duration_days(self) -> int:
        """
        プロジェクト期間を日数で取得する
        
        開始日から終了日までの日数を計算します。
        
        Returns:
            int: プロジェクト期間(日数)
        
        Examples:
            >>> project.start_date = date(2025, 1, 1)
            >>> project.end_date = date(2025, 1, 31)
            >>> project.duration_days
            30
        """
        return (self.end_date - self.start_date).days
    
    def clean(self) -> None:
        """
        モデルレベルのバリデーション
        
        save()実行前に呼び出され、データの整合性をチェックします。
        
        Raises:
            ValidationError: バリデーションエラーがある場合
        
        Note:
            - 終了日が開始日より前の場合はエラー
            - 進捗率が0-100の範囲外の場合はエラー
        """
        errors = {}
        
        # 日付の整合性チェック
        if self.end_date < self.start_date:
            errors['end_date'] = '終了日は開始日以降の日付を指定してください'
        
        # 進捗率のチェック
        if self.progress < 0 or self.progress > 100:
            errors['progress'] = '進捗率は0-100の範囲で指定してください'
        
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


class Attachment(models.Model):
    """
    ファイル添付モデル
    
    プロジェクトまたはタスクに関連付けられた添付ファイルを管理します。
    ファイルのメタデータ(名前、サイズ、タイプ)とURL情報を保存します。
    
    Attributes:
        project (Project): 関連プロジェクト(外部キー)
        file_name (str): ファイル名(最大255文字)
        file_size (int): ファイルサイズ(バイト単位)
        file_type (str): ファイルのMIMEタイプ
        uploaded_by (Member): アップロードしたメンバー
        uploaded_at (datetime): アップロード日時
        url (str): ファイルのURL(最大500文字)
    
    Examples:
        >>> attachment = Attachment.objects.create(
        ...     project=project,
        ...     file_name='仕様書.pdf',
        ...     file_size=1024000,
        ...     file_type='application/pdf',
        ...     uploaded_by=member,
        ...     url='https://storage.example.com/files/spec.pdf'
        ... )
    
    Note:
        - 実際のファイルストレージは外部サービス(Azure Blob Storage等)を使用
        - URLは署名付きURLを使用することを推奨
    """
    
    project = models.ForeignKey(
        Project, 
        on_delete=models.CASCADE, 
        related_name='attachments', 
        verbose_name='プロジェクト',
        help_text='添付ファイルが属するプロジェクト'
    )
    
    file_name = models.CharField(
        'ファイル名', 
        max_length=255,
        help_text='アップロードされたファイルの名前'
    )
    
    file_size = models.BigIntegerField(
        'ファイルサイズ',
        help_text='ファイルサイズ(バイト単位)'
    )
    
    file_type = models.CharField(
        'ファイルタイプ', 
        max_length=100,
        help_text='ファイルのMIMEタイプ(例: application/pdf)'
    )
    
    uploaded_by = models.ForeignKey(
        Member, 
        on_delete=models.SET_NULL, 
        null=True,
        verbose_name='アップロード者',
        help_text='ファイルをアップロードしたメンバー'
    )
    
    uploaded_at = models.DateTimeField(
        'アップロード日時', 
        default=timezone.now,
        help_text='ファイルがアップロードされた日時'
    )
    
    url = models.URLField(
        'URL', 
        max_length=500,
        help_text='ファイルのアクセスURL'
    )
    
    class Meta:
        db_table = 'attachments'
        verbose_name = '添付ファイル'
        verbose_name_plural = '添付ファイル'
        ordering = ['-uploaded_at']
        indexes = [
            # プロジェクト別の添付ファイル検索を高速化
            models.Index(fields=['project', '-uploaded_at']),
        ]
    
    def __str__(self) -> str:
        """文字列表現"""
        return self.file_name
    
    @property
    def file_size_mb(self) -> float:
        """
        ファイルサイズをMB単位で取得する
        
        Returns:
            float: ファイルサイズ(MB単位、小数点第2位まで)
        
        Examples:
            >>> attachment.file_size = 1024000
            >>> attachment.file_size_mb
            0.98
        """
        return round(self.file_size / (1024 * 1024), 2)


class Comment(models.Model):
    """
    コメントモデル
    
    プロジェクトまたはタスクに対するコメントを管理します。
    メンバー間のコミュニケーションやフィードバックを記録します。
    
    Attributes:
        project (Project): 関連プロジェクト(外部キー)
        task (Task): 関連タスク(外部キー、任意)
        content (str): コメント内容
        author (Member): コメント投稿者
        created_at (datetime): 作成日時
        updated_at (datetime): 最終更新日時
    
    Examples:
        >>> # プロジェクトへのコメント
        >>> comment = Comment.objects.create(
        ...     project=project,
        ...     content='進捗確認をお願いします',
        ...     author=member
        ... )
        >>> 
        >>> # タスクへのコメント
        >>> comment = Comment.objects.create(
        ...     project=project,
        ...     task=task,
        ...     content='実装完了しました',
        ...     author=member
        ... )
    
    Note:
        - プロジェクトは必須ですが、タスクは任意です
        - コメントは編集可能です(updated_atが自動更新されます)
    """
    
    project = models.ForeignKey(
        Project, 
        on_delete=models.CASCADE, 
        related_name='comments', 
        verbose_name='プロジェクト',
        help_text='コメントが属するプロジェクト'
    )
    
    task = models.ForeignKey(
        'tasks.Task', 
        on_delete=models.CASCADE, 
        related_name='comments', 
        verbose_name='タスク', 
        blank=True, 
        null=True,
        help_text='コメントが属するタスク(任意)'
    )
    
    content = models.TextField(
        '内容',
        help_text='コメントの内容'
    )
    
    author = models.ForeignKey(
        Member, 
        on_delete=models.CASCADE, 
        verbose_name='投稿者',
        help_text='コメントを投稿したメンバー'
    )
    
    created_at = models.DateTimeField(
        '作成日時', 
        default=timezone.now,
        help_text='コメント作成日時'
    )
    
    updated_at = models.DateTimeField(
        '更新日時', 
        auto_now=True,
        help_text='コメント最終更新日時'
    )
    
    class Meta:
        db_table = 'comments'
        verbose_name = 'コメント'
        verbose_name_plural = 'コメント'
        ordering = ['created_at']
        indexes = [
            # プロジェクト別のコメント取得を高速化
            models.Index(fields=['project', 'created_at']),
            # タスク別のコメント取得を高速化
            models.Index(fields=['task', 'created_at']),
        ]
    
    def __str__(self) -> str:
        """文字列表現"""
        return f"{self.author.name}: {self.content[:50]}"
    
    @property
    def is_edited(self) -> bool:
        """
        コメントが編集されているかどうかを判定する
        
        Returns:
            bool: 編集されている場合True、それ以外はFalse
        
        Note:
            作成時刻と更新時刻の差が1秒以上ある場合、編集されたと判断します
        """
        time_diff = (self.updated_at - self.created_at).total_seconds()
        return time_diff > 1
