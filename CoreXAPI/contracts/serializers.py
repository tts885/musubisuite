"""
契約管理 Serializers

Author: 開発チーム
Created: 2025-11-16
"""

from rest_framework import serializers
from .models import Contract
from clients.models import Client


class ContractSerializer(serializers.ModelSerializer):
    """契約のシリアライザー"""
    
    client_name = serializers.CharField(source='client.company_name', read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    days_until_renewal = serializers.IntegerField(read_only=True)
    needs_renewal_soon = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Contract
        fields = [
            'id',
            'client',
            'client_name',
            'contract_number',
            'contract_name',
            'contract_type',
            'status',
            'start_date',
            'end_date',
            'renewal_date',
            'contract_amount',
            'billing_cycle',
            'payment_terms',
            'payment_method',
            'billing_address',
            'billing_contact',
            'sla_level',
            'auto_renewal',
            'note',
            'is_active',
            'is_expired',
            'days_until_renewal',
            'needs_renewal_soon',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_contract_number(self, value):
        """契約番号の重複チェック"""
        instance = self.instance
        if Contract.objects.filter(contract_number=value).exclude(pk=instance.pk if instance else None).exists():
            raise serializers.ValidationError("この契約番号は既に使用されています。")
        return value
    
    def validate(self, data):
        """全体バリデーション"""
        # 開始日と終了日の整合性チェック
        start_date = data.get('start_date', self.instance.start_date if self.instance else None)
        end_date = data.get('end_date', self.instance.end_date if self.instance else None)
        
        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError({
                'end_date': '契約終了日は開始日以降である必要があります。'
            })
        
        return data


class ContractListSerializer(serializers.ModelSerializer):
    """契約一覧用の軽量シリアライザー"""
    
    client_name = serializers.CharField(source='client.company_name', read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    needs_renewal_soon = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Contract
        fields = [
            'id',
            'contract_number',
            'contract_name',
            'client',
            'client_name',
            'contract_type',
            'status',
            'start_date',
            'end_date',
            'contract_amount',
            'is_active',
            'needs_renewal_soon',
        ]
