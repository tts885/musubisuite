from rest_framework import serializers
from .models import Client


class ClientSerializer(serializers.ModelSerializer):
    """クライアントシリアライザー"""
    
    class Meta:
        model = Client
        fields = [
            'id', 'name', 'company_name', 'email', 'phone',
            'address', 'industry', 'note', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ClientListSerializer(serializers.ModelSerializer):
    """クライアント一覧用シリアライザー（軽量版）"""
    
    class Meta:
        model = Client
        fields = ['id', 'name', 'company_name', 'email', 'industry']
