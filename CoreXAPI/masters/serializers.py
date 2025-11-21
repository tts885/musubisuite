"""
コードマスタ管理のシリアライザ
"""

from rest_framework import serializers
from .models import CodeCategory, CodeMaster


class CodeMasterSerializer(serializers.ModelSerializer):
    """コードマスタシリアライザ"""
    category_code = serializers.CharField(source='category.code', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = CodeMaster
        fields = [
            'id', 'category', 'category_code', 'category_name',
            'code', 'name', 'name_en', 'description',
            'sort_order', 'is_active', 'color', 'icon',
            'parent_code', 'metadata',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CodeCategorySerializer(serializers.ModelSerializer):
    """コードカテゴリシリアライザ"""
    codes = CodeMasterSerializer(many=True, read_only=True)
    codes_count = serializers.SerializerMethodField()
    
    class Meta:
        model = CodeCategory
        fields = [
            'code', 'name', 'description',
            'is_system', 'sort_order', 'is_active',
            'codes_count', 'codes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_codes_count(self, obj):
        """有効なコード数を取得"""
        return obj.codes.filter(is_active=True).count()


class CodeCategoryListSerializer(serializers.ModelSerializer):
    """コードカテゴリ一覧用シリアライザ（軽量版）"""
    codes_count = serializers.SerializerMethodField()
    
    class Meta:
        model = CodeCategory
        fields = [
            'code', 'name', 'description',
            'is_system', 'sort_order', 'is_active',
            'codes_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_codes_count(self, obj):
        """有効なコード数を取得"""
        return obj.codes.filter(is_active=True).count()
