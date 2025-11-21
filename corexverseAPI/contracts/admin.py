"""
契約管理 Django Admin設定

Author: 開発チーム
Created: 2025-11-16
"""

from django.contrib import admin
from .models import Contract


@admin.register(Contract)
class ContractAdmin(admin.ModelAdmin):
    """契約管理の管理画面設定"""
    
    list_display = [
        'contract_number', 
        'contract_name', 
        'client', 
        'contract_type', 
        'status', 
        'start_date', 
        'end_date',
        'contract_amount',
        'created_at'
    ]
    
    list_filter = [
        'status',
        'contract_type',
        'billing_cycle',
        'auto_renewal',
        'created_at',
    ]
    
    search_fields = [
        'contract_number',
        'contract_name',
        'client__company_name',
        'billing_contact',
    ]
    
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('基本情報', {
            'fields': (
                'client',
                'contract_number',
                'contract_name',
                'contract_type',
                'status',
            )
        }),
        ('契約期間', {
            'fields': (
                'start_date',
                'end_date',
                'renewal_date',
                'auto_renewal',
            )
        }),
        ('金額・請求情報', {
            'fields': (
                'contract_amount',
                'billing_cycle',
                'payment_terms',
                'payment_method',
                'billing_address',
                'billing_contact',
            )
        }),
        ('サービスレベル', {
            'fields': (
                'sla_level',
            )
        }),
        ('その他', {
            'fields': (
                'note',
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
    
    date_hierarchy = 'start_date'
    
    ordering = ['-created_at']
