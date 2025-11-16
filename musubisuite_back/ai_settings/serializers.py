"""
AI設定 Serializers

Author: 開発チーム
Created: 2025-11-16
"""

from rest_framework import serializers
from .models import AIProvider, SearchEngineConfig, AISettings


class AIProviderSerializer(serializers.ModelSerializer):
    """AIプロバイダーのシリアライザー"""
    
    api_key = serializers.CharField(
        write_only=True,
        required=False,
        help_text='APIキー（書き込み専用、暗号化保存）'
    )
    
    api_key_masked = serializers.SerializerMethodField(
        read_only=True,
        help_text='マスクされたAPIキー'
    )
    
    class Meta:
        model = AIProvider
        fields = [
            'id',
            'name',
            'provider_type',
            'endpoint',
            'api_key',
            'api_key_masked',
            'api_version',
            'deployment_name',
            'organization_id',
            'model_name',
            'max_tokens',
            'temperature',
            'is_active',
            'is_default',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'api_key_masked']
    
    def validate(self, attrs):
        """プロバイダータイプ別のバリデーション"""
        provider_type = attrs.get('provider_type')
        
        # Azure OpenAIの必須フィールド検証
        if provider_type == 'azure_openai':
            if not attrs.get('endpoint'):
                raise serializers.ValidationError({
                    'endpoint': 'Azure OpenAIの場合、エンドポイントは必須です'
                })
            if not attrs.get('api_version'):
                raise serializers.ValidationError({
                    'api_version': 'Azure OpenAIの場合、APIバージョンは必須です'
                })
        
        # 設定名の必須チェック
        if not attrs.get('name'):
            raise serializers.ValidationError({
                'name': '設定名は必須です'
            })
        
        # モデル名の必須チェック
        if not attrs.get('model_name'):
            raise serializers.ValidationError({
                'model_name': 'モデル名は必須です'
            })
        
        return attrs
    
    def get_api_key_masked(self, obj):
        """APIキーをマスクして返す"""
        api_key = obj.get_api_key()
        if not api_key:
            return ""
        if len(api_key) <= 8:
            return "*" * len(api_key)
        return api_key[:4] + "*" * (len(api_key) - 8) + api_key[-4:]
    
    def create(self, validated_data):
        """作成時にAPIキーを暗号化"""
        api_key = validated_data.pop('api_key', None)
        instance = super().create(validated_data)
        if api_key:
            instance.set_api_key(api_key)
            instance.save()
        return instance
    
    def update(self, instance, validated_data):
        """更新時にAPIキーを暗号化"""
        api_key = validated_data.pop('api_key', None)
        instance = super().update(instance, validated_data)
        if api_key:
            instance.set_api_key(api_key)
            instance.save()
        return instance


class SearchEngineConfigSerializer(serializers.ModelSerializer):
    """検索エンジン設定のシリアライザー"""
    
    api_key = serializers.CharField(
        write_only=True,
        required=False,
        help_text='APIキー（書き込み専用、暗号化保存）'
    )
    
    api_key_masked = serializers.SerializerMethodField(
        read_only=True,
        help_text='マスクされたAPIキー'
    )
    
    class Meta:
        model = SearchEngineConfig
        fields = [
            'id',
            'name',
            'engine_type',
            'api_key',
            'api_key_masked',
            'search_engine_id',
            'max_results',
            'is_active',
            'is_default',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'api_key_masked']
    
    def get_api_key_masked(self, obj):
        """APIキーをマスクして返す"""
        api_key = obj.get_api_key()
        if not api_key:
            return ""
        if len(api_key) <= 8:
            return "*" * len(api_key)
        return api_key[:4] + "*" * (len(api_key) - 8) + api_key[-4:]
    
    def create(self, validated_data):
        """作成時にAPIキーを暗号化"""
        api_key = validated_data.pop('api_key', None)
        instance = super().create(validated_data)
        if api_key:
            instance.set_api_key(api_key)
            instance.save()
        return instance
    
    def update(self, instance, validated_data):
        """更新時にAPIキーを暗号化"""
        api_key = validated_data.pop('api_key', None)
        instance = super().update(instance, validated_data)
        if api_key:
            instance.set_api_key(api_key)
            instance.save()
        return instance


class AISettingsSerializer(serializers.ModelSerializer):
    """AI設定のシリアライザー"""
    
    class Meta:
        model = AISettings
        fields = [
            'ai_enabled',
            'require_confirmation',
            'allow_overwrite',
            'confidence_threshold',
            'auto_save_on_high_confidence',
            'updated_at',
        ]
        read_only_fields = ['updated_at']
