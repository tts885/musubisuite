"""
クライアント管理モデル

企業のクライアント(顧客)情報を管理します。

Author: 開発チーム
Created: 2025-11-14
Updated: 2025-11-15 - AI機能拡張対応
"""

from django.db import models
from django.core.validators import EmailValidator, MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from django.utils import timezone
from typing import Optional


class Client(models.Model):
    """
    クライアント(顧客)モデル
    
    企業のクライアント情報を管理します。
    各クライアントは複数の契約と関連付けることができます。
    AI機能により、企業名から自動的に企業情報を取得できます。
    
    Attributes:
        company_name (str): 会社名(通称、最大200文字)
        legal_name (str): 正式名称(最大300文字)
        email (str): 代表メールアドレス
        representative (str): 代表者名
        established_date (date): 設立年月日
        capital (int): 資本金(円)
        employee_count (int): 従業員数
        industry (str): 業種
        website (str): 公式ウェブサイト
        description (str): 事業内容
        postal_code (str): 郵便番号
        prefecture (str): 都道府県
        city (str): 市区町村
        address (str): 番地・ビル名
        phone (str): 代表電話番号
        fax (str): FAX番号
        contact_* : 担当者情報フィールド
        priority (str): 優先度(A/B/C)
        lead_source (str): リード元
        assigned_sales (FK): 営業担当者
        tags (JSONField): タグ配列
        note (str): 備考
        ai_generated (bool): AI生成データフラグ
        ai_generated_at (datetime): AI生成日時
        ai_confidence_score (int): AI信頼度スコア(0-100)
        created_at (datetime): 作成日時
        updated_at (datetime): 最終更新日時
    """
    
    INDUSTRY_CHOICES = [
        ('it', 'IT・通信'),
        ('manufacturing', '製造'),
        ('finance', '金融'),
        ('retail', '小売'),
        ('service', 'サービス'),
        ('construction', '建設'),
        ('real_estate', '不動産'),
        ('transportation', '運輸'),
        ('education', '教育'),
        ('healthcare', '医療・福祉'),
        ('media', 'メディア'),
        ('other', 'その他'),
    ]
    
    PRIORITY_CHOICES = [
        ('A', 'A'),
        ('B', 'B'),
        ('C', 'C'),
    ]
    
    # ========== 基本情報 ==========
    company_name = models.CharField(
        '会社名', 
        max_length=200,
        db_index=True,
        help_text='会社名（通称）'
    )
    
    legal_name = models.CharField(
        '正式名称',
        max_length=300,
        blank=True,
        null=True,
        help_text='法人の正式名称'
    )
    
    email = models.EmailField(
        'メールアドレス',
        blank=True,
        null=True,
        validators=[EmailValidator()],
        help_text='代表メールアドレス'
    )
    
    # ========== 企業基本情報（AI取得対象） ==========
    representative = models.CharField(
        '代表者名',
        max_length=100,
        blank=True,
        null=True,
        help_text='代表取締役名など'
    )
    
    established_date = models.DateField(
        '設立年月日',
        null=True,
        blank=True,
        help_text='会社設立日'
    )
    
    capital = models.BigIntegerField(
        '資本金',
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        help_text='資本金（円）'
    )
    
    employee_count = models.IntegerField(
        '従業員数',
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        help_text='従業員数（人）'
    )
    
    industry = models.CharField(
        '業種', 
        max_length=50, 
        choices=INDUSTRY_CHOICES, 
        blank=True,
        null=True,
        db_index=True,
        help_text='業種カテゴリ'
    )
    
    website = models.URLField(
        'ウェブサイト',
        blank=True,
        null=True,
        max_length=500,
        help_text='公式ウェブサイトURL'
    )
    
    description = models.TextField(
        '事業内容',
        blank=True,
        null=True,
        help_text='主な事業内容'
    )
    
    # ========== 所在地情報（AI取得対象） ==========
    postal_code = models.CharField(
        '郵便番号',
        max_length=10,
        blank=True,
        null=True,
        help_text='郵便番号（例：123-4567）'
    )
    
    prefecture = models.CharField(
        '都道府県',
        max_length=20,
        blank=True,
        null=True,
        help_text='都道府県名'
    )
    
    city = models.CharField(
        '市区町村',
        max_length=100,
        blank=True,
        null=True,
        help_text='市区町村名'
    )
    
    address = models.CharField(
        '番地・ビル名',
        max_length=300,
        blank=True,
        null=True,
        help_text='番地、ビル名、階数など'
    )
    
    phone = models.CharField(
        '電話番号', 
        max_length=50, 
        blank=True,
        null=True,
        help_text='代表電話番号'
    )
    
    fax = models.CharField(
        'FAX番号',
        max_length=50,
        blank=True,
        null=True,
        help_text='FAX番号'
    )
    
    # ========== 担当者情報 ==========
    contact_name = models.CharField(
        '担当者名',
        max_length=100,
        blank=True,
        null=True,
        help_text='先方担当者名'
    )
    
    contact_department = models.CharField(
        '部署',
        max_length=100,
        blank=True,
        null=True,
        help_text='担当者の部署'
    )
    
    contact_position = models.CharField(
        '役職',
        max_length=100,
        blank=True,
        null=True,
        help_text='担当者の役職'
    )
    
    contact_email = models.EmailField(
        '担当者メール',
        blank=True,
        null=True,
        help_text='担当者のメールアドレス'
    )
    
    contact_phone = models.CharField(
        '担当者電話',
        max_length=50,
        blank=True,
        null=True,
        help_text='担当者の直通電話'
    )
    
    contact_mobile = models.CharField(
        '担当者携帯',
        max_length=50,
        blank=True,
        null=True,
        help_text='担当者の携帯電話'
    )
    
    # ========== ビジネス情報 ==========
    priority = models.CharField(
        '優先度',
        max_length=1,
        choices=PRIORITY_CHOICES,
        blank=True,
        null=True,
        help_text='取引優先度（A：高、B：中、C：低）'
    )
    
    lead_source = models.CharField(
        'リード元',
        max_length=50,
        blank=True,
        null=True,
        help_text='リード獲得元（例：Web、紹介、展示会）'
    )
    
    assigned_sales = models.ForeignKey(
        'members.Member',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_clients',
        verbose_name='営業担当者',
        help_text='担当営業メンバー'
    )
    
    tags = models.JSONField(
        'タグ',
        default=list,
        blank=True,
        help_text='タグ配列（例：["大手", "継続取引"]）'
    )
    
    note = models.TextField(
        '備考', 
        blank=True,
        null=True,
        help_text='その他備考'
    )
    
    # ========== AI関連 ==========
    ai_generated = models.BooleanField(
        'AI生成',
        default=False,
        help_text='AIで生成されたデータかどうか'
    )
    
    ai_generated_at = models.DateTimeField(
        'AI生成日時',
        null=True,
        blank=True,
        help_text='AI生成実行日時'
    )
    
    ai_confidence_score = models.IntegerField(
        'AI信頼度',
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text='AI生成データの信頼度スコア（0-100）'
    )
    
    # ========== システム ==========
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
            models.Index(fields=['company_name']),
            models.Index(fields=['industry', '-created_at']),
            models.Index(fields=['priority', '-created_at']),
        ]
    
    def __str__(self) -> str:
        """文字列表現"""
        return self.company_name
    
    @property
    def full_address(self) -> str:
        """完全な住所を返す"""
        parts = [
            self.postal_code and f"〒{self.postal_code}",
            self.prefecture,
            self.city,
            self.address
        ]
        return " ".join(filter(None, parts))
    
    @property
    def contract_count(self) -> int:
        """クライアントに紐づく契約数"""
        return self.contracts.count()
    
    def clean(self) -> None:
        """モデルレベルのバリデーション"""
        errors = {}
        
        if self.company_name and not self.company_name.strip():
            errors['company_name'] = '会社名は空白のみにできません'
        
        if self.capital is not None and self.capital < 0:
            errors['capital'] = '資本金は0以上である必要があります'
        
        if self.employee_count is not None and self.employee_count < 0:
            errors['employee_count'] = '従業員数は0以上である必要があります'
        
        if self.ai_confidence_score is not None:
            if not (0 <= self.ai_confidence_score <= 100):
                errors['ai_confidence_score'] = 'AI信頼度スコアは0-100の範囲である必要があります'
        
        if errors:
            raise ValidationError(errors)
    
    def save(self, *args, **kwargs) -> None:
        """保存処理"""
        self.full_clean()
        super().save(*args, **kwargs)
