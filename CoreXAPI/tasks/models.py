"""
タスク管理モジュール

このモジュールは、プロジェクト内の個別タスク情報を管理するためのモデルを提供します。

Classes:
    Task: タスク情報を格納するモデルクラス
"""

from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
from projects.models import Project
from members.models import Member


class Task(models.Model):
    """
    タスクモデル
    
    プロジェクト内の個別タスクを管理します。
    各タスクはプロジェクトに紐付き、担当者、期限、優先度などを持ちます。
    
    Attributes:
        project (Project): 関連プロジェクト
        title (str): タスク名(最大200文字)
        description (str): タスクの詳細説明
        status (str): タスクのステータス(todo/in-progress/review/done/blocked)
        priority (str): タスクの優先度(low/medium/high/urgent)
        assignee (Member): 担当者(任意)
        due_date (date): 期限(任意)
        estimated_hours (Decimal): 見積もり時間(任意)
        actual_hours (Decimal): 実績時間(任意)
        created_by (Member): 作成者
        created_at (datetime): 作成日時
        updated_at (datetime): 最終更新日時
    
    Examples:
        >>> task = Task.objects.create(
        ...     project=project,
        ...     title="実装タスク",
        ...     description="タスクの説明",
        ...     status="in-progress",
        ...     priority="high",
        ...     created_by=member
        ... )
        >>> print(task.is_overdue())
        False
        
    Note:
        - assigneeが未設定の場合は未割り当てタスクです
        - due_dateが未設定の場合は期限なしタスクです
        - estimated_hoursとactual_hoursは工数管理に使用します
    """
    
    STATUS_CHOICES = [
        ('todo', '未着手'),
        ('in-progress', '進行中'),
        ('review', 'レビュー中'),
        ('done', '完了'),
        ('blocked', 'ブロック'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', '低'),
        ('medium', '中'),
        ('high', '高'),
        ('urgent', '緊急'),
    ]
    
    project = models.ForeignKey(
        Project, 
        on_delete=models.CASCADE, 
        related_name='tasks', 
        verbose_name='案件',
        help_text='関連するプロジェクト'
    )
    title = models.CharField(
        'タイトル', 
        max_length=200,
        help_text='タスク名(最大200文字)'
    )
    description = models.TextField(
        '説明',
        help_text='タスクの詳細説明'
    )
    status = models.CharField(
        'ステータス', 
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='todo',
        help_text='タスクのステータス'
    )
    priority = models.CharField(
        '優先度', 
        max_length=20, 
        choices=PRIORITY_CHOICES, 
        default='medium',
        help_text='タスクの優先度'
    )
    assignee = models.ForeignKey(
        Member, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='assigned_tasks', 
        verbose_name='担当者',
        help_text='タスクの担当者(任意)'
    )
    due_date = models.DateField(
        '期限', 
        blank=True, 
        null=True,
        help_text='タスクの期限(任意)'
    )
    estimated_hours = models.DecimalField(
        '見積時間', 
        max_digits=6, 
        decimal_places=2, 
        blank=True, 
        null=True,
        help_text='見積もり時間(任意)'
    )
    actual_hours = models.DecimalField(
        '実績時間', 
        max_digits=6, 
        decimal_places=2, 
        blank=True, 
        null=True,
        help_text='実績時間(任意)'
    )
    created_by = models.ForeignKey(
        Member, 
        on_delete=models.CASCADE, 
        related_name='created_tasks', 
        verbose_name='作成者',
        help_text='タスク作成者'
    )
    created_at = models.DateTimeField(
        '作成日時', 
        default=timezone.now,
        help_text='作成日時'
    )
    updated_at = models.DateTimeField(
        '更新日時', 
        auto_now=True,
        help_text='最終更新日時'
    )
    
    class Meta:
        db_table = 'tasks'
        verbose_name = 'タスク'
        verbose_name_plural = 'タスク'
        ordering = ['-created_at']
    
    def __str__(self):
        """
        タスクの文字列表現を返します
        
        Returns:
            str: "プロジェクト名 - タスク名" 形式の文字列
        """
        return f"{self.project.name} - {self.title}"
    
    @property
    def is_overdue(self):
        """
        タスクが期限切れかどうかを判定します
        
        Returns:
            bool: 期限切れの場合True、期限未設定または完了済みの場合False
        """
        if not self.due_date or self.status == 'done':
            return False
        from datetime import date
        return self.due_date < date.today()
    
    @property
    def hours_variance(self):
        """
        工数の差異を計算します
        
        Returns:
            Decimal | None: 実績時間 - 見積時間、どちらかが未設定の場合None
        """
        if self.estimated_hours and self.actual_hours:
            return self.actual_hours - self.estimated_hours
        return None
    
    def clean(self):
        """
        モデルのバリデーションを実行します
        
        Raises:
            ValidationError: バリデーションエラー発生時
        """
        super().clean()
        
        # 実績時間が見積時間を大幅に超過している場合の警告
        if self.estimated_hours and self.actual_hours:
            if self.actual_hours > self.estimated_hours * 2:
                raise ValidationError({
                    'actual_hours': '実績時間が見積時間の2倍を超えています'
                })
