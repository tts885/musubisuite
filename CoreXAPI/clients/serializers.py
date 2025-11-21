from rest_framework import serializers
from .models import Client


class ClientSerializer(serializers.ModelSerializer):
    """クライアントシリアライザー"""
    
    class Meta:
        model = Client
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class ClientListSerializer(serializers.ModelSerializer):
    """クライアント一覧用シリアライザー（軽量版）"""
    
    class Meta:
        model = Client
        fields = [
            'id', 'company_name', 'legal_name', 'email', 'industry',
            'contact_name', 'website', 'phone', 'prefecture', 'city'
        ]
