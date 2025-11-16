"""
契約管理モデル

クライアントとの契約情報を管理します。

Author: 開発チーム
Created: 2025-11-15
"""

from django.db import models
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from django.utils import timezone
from decimal import Decimal


class Contract(models.Model):
    """
    契約モデル
    
    クライアントとの契約情報を管理します。
    1クライアントに対して複数の契約を持つことができます（1対多）。
    
    Attributes:
        client (FK): クライアント（外部キー）
        contract_number (str): 契約番号（ユニーク）
        contract_name (str): 契約名
        contract_type (str): 契約タイプ（月額/年額/プロジェクトベース/保守）
        status (str): ステータス（見積中/契約中/休止中/終了）
        start_date (date): 契約開始日
        end_date (date): 契約終了日
        renewal_date (date): 次回更新日
        contract_amount (Decimal): 契約金額
        billing_cycle (str): 請求サイクル（月次/四半期/年次）
        payment_terms (str): 支払条件
        payment_method (str): 支払方法
        billing_address (str): 請求先住所
        billing_contact (str): 請求先担当者
        sla_level (str): SLAレベル
        auto_renewal (bool): 自動更新フラグ
        note (str): 備考
        created_at (datetime): 作成日時
        updated_at (datetime): 最終更新日時
    """
    
    CONTRACT_TYPE_CHOICES = [
        ('monthly', '月額契約'),
        ('annual', '年額契約'),
        ('project', 'プロジェクトベース'),
        ('maintenance', '保守契約'),
        ('other', 'その他'),
    ]
    
    STATUS_CHOICES = [
        ('quote', '見積中'),
        ('active', '契約中'),
        ('suspended', '休止中'),
        ('terminated', '終了'),
        ('cancelled', 'キャンセル'),
    ]
    
    BILLING_CYCLE_CHOICES = [
        ('monthly', '月次'),
        ('quarterly', '四半期'),
        ('semi_annual', '半期'),
        ('annual', '年次'),
        ('one_time', '一回払い'),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('bank_transfer', '銀行振込'),
        ('credit_card', 'クレジットカード'),
        ('invoice', '請求書払い'),
        ('direct_debit', '口座振替'),
        ('other', 'その他'),
    ]
    
    SLA_LEVEL_CHOICES = [
        ('standard', 'スタンダード'),
        ('business', 'ビジネス'),
        ('premium', 'プレミアム'),
        ('enterprise', 'エンタープライズ'),
    ]
    
    # ========== 基本情報 ==========
    client = models.ForeignKey(
        'clients.Client',
        on_delete=models.CASCADE,
        related_name='contracts',
        verbose_name='クライアント',
        help_text='契約先クライアント'
    )
    
    contract_number = models.CharField(
        '契約番号',
        max_length=50,
        unique=True,
        db_index=True,
        help_text='契約番号（ユニーク）'
    )
    
    contract_name = models.CharField(
        '契約名',
        max_length=200,
        help_text='契約名称'
    )
    
    contract_type = models.CharField(
        '契約タイプ',
        max_length=20,
        choices=CONTRACT_TYPE_CHOICES,
        help_text='契約の種類'
    )
    
    status = models.CharField(
        'ステータス',
        max_length=20,
        choices=STATUS_CHOICES,
        default='quote',
        db_index=True,
        help_text='契約ステータス'
    )
    
    # ========== 契約期間 ==========
    start_date = models.DateField(
        '契約開始日',
        help_text='契約の開始日'
    )
    
    end_date = models.DateField(
        '契約終了日',
        null=True,
        blank=True,
        help_text='契約の終了日（未定の場合は空）'
    )
    
    renewal_date = models.DateField(
        '次回更新日',
        null=True,
        blank=True,
        help_text='契約更新予定日'
    )
    
    # ========== 契約金額 ==========
    contract_amount = models.DecimalField(
        '契約金額',
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text='契約金額（税込）'
    )
    
    billing_cycle = models.CharField(
        '請求サイクル',
        max_length=20,
        choices=BILLING_CYCLE_CHOICES,
        blank=True,
        help_text='請求頻度'
    )
    
    # ========== 請求情報 ==========
    payment_terms = models.CharField(
        '支払条件',
        max_length=100,
        blank=True,
        help_text='支払条件（例：月末締め翌月末払い）'
    )
    
    payment_method = models.CharField(
        '支払方法',
        max_length=50,
        choices=PAYMENT_METHOD_CHOICES,
        blank=True,
        help_text='支払方法'
    )
    
    billing_address = models.TextField(
        '請求先住所',
        blank=True,
        help_text='請求書送付先住所'
    )
    
    billing_contact = models.CharField(
        '請求先担当者',
        max_length=100,
        blank=True,
        help_text='請求書宛名・担当者'
    )
    
    # ========== その他 ==========
    sla_level = models.CharField(
        'SLAレベル',
        max_length=20,
        choices=SLA_LEVEL_CHOICES,
        blank=True,
        null=True,
        help_text='サービスレベル合意レベル'
    )
    
    auto_renewal = models.BooleanField(
        '自動更新',
        default=False,
        help_text='契約期間満了時に自動更新するか'
    )
    
    note = models.TextField(
        '備考',
        blank=True,
        null=True,
        help_text='契約に関する備考'
    )
    
    # ========== システム ==========
    created_at = models.DateTimeField(
        '作成日時',
        default=timezone.now,
        help_text='契約登録日時'
    )
    
    updated_at = models.DateTimeField(
        '更新日時',
        auto_now=True,
        help_text='最終更新日時'
    )
    
    class Meta:
        db_table = 'contracts'
        verbose_name = '契約'
        verbose_name_plural = '契約'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['contract_number']),
            models.Index(fields=['client', 'status']),
            models.Index(fields=['status', '-start_date']),
        ]
    
    def __str__(self) -> str:
        """文字列表現"""
        return f"{self.contract_number} - {self.contract_name}"
    
    @property
    def is_active(self) -> bool:
        """契約が有効かどうか"""
        return self.status == 'active'
    
    @property
    def is_expired(self) -> bool:
        """契約が期限切れかどうか"""
        if not self.end_date:
            return False
        return self.end_date < timezone.now().date()
    
    @property
    def days_until_renewal(self) -> int:
        """更新日までの日数"""
        if not self.renewal_date:
            return None
        delta = self.renewal_date - timezone.now().date()
        return delta.days
    
    @property
    def needs_renewal_soon(self) -> bool:
        """30日以内に更新が必要か"""
        days = self.days_until_renewal
        return days is not None and 0 <= days <= 30
    
    def clean(self) -> None:
        """モデルレベルのバリデーション"""
        errors = {}
        
        if self.contract_number and not self.contract_number.strip():
            errors['contract_number'] = '契約番号は空白のみにできません'
        
        if self.contract_name and not self.contract_name.strip():
            errors['contract_name'] = '契約名は空白のみにできません'
        
        if self.end_date and self.start_date:
            if self.end_date < self.start_date:
                errors['end_date'] = '契約終了日は契約開始日より後である必要があります'
        
        if self.contract_amount < 0:
            errors['contract_amount'] = '契約金額は0以上である必要があります'
        
        if errors:
            raise ValidationError(errors)
    
    def save(self, *args, **kwargs) -> None:
        """保存処理"""
        self.full_clean()
        super().save(*args, **kwargs)
