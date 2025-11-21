"""
メンバー管理モジュール

このモジュールは、社内のプロジェクトメンバー情報を管理するためのモデルを提供します。

Classes:
    Member: メンバー情報を格納するモデルクラス
"""

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class Member(models.Model):
    """
    メンバー(社内ユーザー)モデル
    
    社内のプロジェクトメンバーの情報を管理します。
    Djangoの標準Userモデルと1対1の関係を持ちます。
    
    Attributes:
        user (User): Django標準認証ユーザー(1対1)
        name (str): メンバーの氏名(最大100文字)
        email (EmailField): メールアドレス(ユニークキー)
        avatar (ImageField): プロフィール画像(任意)
        role (str): システム上の役割(owner/admin/member/viewer)
        department (str): 所属部署(任意、最大100文字)
        position (str): 役職(任意、最大100文字)
        skills (list): スキルセット(JSON配列)
        joined_at (datetime): 入社日時
    
    Examples:
        >>> member = Member.objects.create(
        ...     name="佐藤一郎",
        ...     email="sato@company.com",
        ...     role="admin",
        ...     department="開発部",
        ...     position="部長",
        ...     skills=["Python", "Django", "React"]
        ... )
        >>> print(member)
        佐藤一郎 (admin)
        
    Note:
        - emailは一意である必要があります
        - skillsはJSON形式で複数の技術スタックを保持できます
        - roleはプロジェクトへのアクセス権限を決定します
    """
    
    ROLE_CHOICES = [
        ('owner', 'オーナー'),
        ('admin', '管理者'),
        ('member', 'メンバー'),
        ('viewer', '閲覧者'),
    ]
    
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='member_profile',
        help_text='Django標準認証ユーザー(1対1関係)'
    )
    name = models.CharField(
        '名前', 
        max_length=100,
        help_text='メンバーの氏名'
    )
    email = models.EmailField(
        'メールアドレス', 
        unique=True,
        help_text='メンバーのメールアドレス(ユニークキー)'
    )
    avatar = models.ImageField(
        'アバター', 
        upload_to='avatars/', 
        blank=True, 
        null=True,
        help_text='プロフィール画像(任意)'
    )
    role = models.CharField(
        '役割', 
        max_length=20, 
        choices=ROLE_CHOICES, 
        default='member',
        help_text='システム上の役割(owner/admin/member/viewer)'
    )
    department = models.CharField(
        '部署', 
        max_length=100, 
        blank=True, 
        null=True,
        help_text='所属部署(任意)'
    )
    position = models.CharField(
        '役職', 
        max_length=100, 
        blank=True, 
        null=True,
        help_text='役職(任意)'
    )
    skills = models.JSONField(
        'スキル', 
        default=list, 
        blank=True,
        help_text='スキルセット(JSON配列形式)'
    )
    joined_at = models.DateTimeField(
        '参加日時', 
        default=timezone.now,
        help_text='入社日時'
    )
    
    class Meta:
        db_table = 'members'
        verbose_name = 'メンバー'
        verbose_name_plural = 'メンバー'
        ordering = ['name']
    
    def __str__(self):
        """
        メンバーの文字列表現を返します
        
        Returns:
            str: "名前 (役割)" 形式の文字列
        """
        return f"{self.name} ({self.role})"
    
    @property
    def is_admin_or_owner(self):
        """
        管理者権限を持つかどうかを判定します
        
        Returns:
            bool: owner または admin の場合True
        """
        return self.role in ['owner', 'admin']
    
    @property
    def can_edit_projects(self):
        """
        プロジェクトの編集権限を持つかどうかを判定します
        
        Returns:
            bool: viewerでない場合True
        """
        return self.role != 'viewer'
