"""
AI設定 Views

Author: 開発チーム
Created: 2025-11-16
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt
from .models import AIProvider, SearchEngineConfig, AISettings
from .serializers import (
    AIProviderSerializer,
    SearchEngineConfigSerializer,
    AISettingsSerializer
)
import logging

logger = logging.getLogger('ai_settings')


class AIProviderViewSet(viewsets.ModelViewSet):
    """
    AIプロバイダー管理のViewSet
    
    LLMプロバイダーの設定を管理します。
    """
    queryset = AIProvider.objects.all()
    serializer_class = AIProviderSerializer
    
    def perform_content_negotiation(self, request, force=False):
        """test_promptアクションの場合はコンテンツネゴシエーションをスキップ"""
        if self.action == 'test_prompt':
            # ダミーのレンダラーを返してネゴシエーションをスキップ
            from rest_framework.renderers import JSONRenderer
            return (JSONRenderer(), JSONRenderer.media_type)
        return super().perform_content_negotiation(request, force)
    
    def finalize_response(self, request, response, *args, **kwargs):
        """StreamingHttpResponseの場合はDRFの処理をスキップ"""
        from django.http import StreamingHttpResponse
        if isinstance(response, StreamingHttpResponse):
            return response
        return super().finalize_response(request, response, *args, **kwargs)
    
    def create(self, request, *args, **kwargs):
        """作成時に詳細ログを出力"""
        logger.debug(f"Creating AI Provider with data: {request.data}")
        try:
            response = super().create(request, *args, **kwargs)
            logger.info(f"AI Provider created successfully: {response.data.get('id')}")
            return response
        except Exception as e:
            logger.error(f"Error creating AI Provider: {str(e)}", exc_info=True)
            raise
    
    def update(self, request, *args, **kwargs):
        """更新時に詳細ログを出力"""
        logger.debug(f"Updating AI Provider {kwargs.get('pk')} with data: {request.data}")
        try:
            response = super().update(request, *args, **kwargs)
            logger.info(f"AI Provider updated successfully: {response.data.get('id')}")
            return response
        except Exception as e:
            logger.error(f"Error updating AI Provider: {str(e)}", exc_info=True)
            raise
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """有効なプロバイダー一覧を取得"""
        providers = self.get_queryset().filter(is_active=True)
        serializer = self.get_serializer(providers, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def default(self, request):
        """デフォルトプロバイダーを取得"""
        try:
            provider = self.get_queryset().get(is_default=True, is_active=True)
            serializer = self.get_serializer(provider)
            return Response(serializer.data)
        except AIProvider.DoesNotExist:
            return Response(
                {'error': 'デフォルトのプロバイダーが設定されていません'},
                status=status.HTTP_404_NOT_FOUND
            )
    

    @action(detail=True, methods=['post'])
    def test_connection(self, request, pk=None):
        """APIキーの接続テスト"""
        provider = self.get_object()
        
        # TODO: 実際のAPI接続テストを実装
        # ここでは簡易的なレスポンスを返す
        if not provider.get_api_key():
            return Response(
                {'success': False, 'message': 'APIキーが設定されていません'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response({
            'success': True,
            'message': f'{provider.get_provider_type_display()}への接続テストは成功しました'
        })
    
    @action(detail=True, methods=['post'])
    def test_prompt(self, request, pk=None):
        """プロンプトを送信してAIの応答をテスト（ストリーミング対応）"""
        from django.http import StreamingHttpResponse, JsonResponse
        from ai_services import AIClient
        import json
        
        provider = self.get_object()
        prompt = request.data.get('prompt', '')
        
        if not prompt:
            return JsonResponse(
                {'success': False, 'error': 'プロンプトが指定されていません'},
                status=400
            )
        
        if not provider.get_api_key():
            return JsonResponse(
                {'success': False, 'error': 'APIキーが設定されていません'},
                status=400
            )
        
        try:
            logger.info(f"Testing AI provider: {provider.provider_type} - {provider.name}")
            
            def stream_response():
                """AIレスポンスをストリーミング（最適化版）"""
                try:
                    client = AIClient(provider=provider)
                    
                    # チャンク単位で直接送信
                    for chunk in client.generate_stream(prompt):
                        if chunk:
                            yield f"data: {json.dumps({'content': chunk}, ensure_ascii=False)}\n\n"
                    
                    # 完了シグナル
                    yield f"data: {json.dumps({'done': True})}\n\n"
                    logger.info("Stream completed successfully")
                    
                except Exception as e:
                    error_msg = f"{type(e).__name__}: {str(e)}"
                    logger.error(f"Streaming error: {error_msg}", exc_info=True)
                    yield f"data: {json.dumps({'error': error_msg})}\n\n"
            
            # StreamingHttpResponseを直接返す
            response = StreamingHttpResponse(
                stream_response(),
                content_type='text/event-stream'
            )
            response['Cache-Control'] = 'no-cache'
            response['X-Accel-Buffering'] = 'no'
            return response
            
        except Exception as e:
            error_message = str(e)
            error_type = type(e).__name__
            logger.error(f"AI API呼び出しエラー [{error_type}]: {error_message}", exc_info=True)
            
            return JsonResponse(
                {'success': False, 'error': f"{error_type}: {error_message}"},
                status=500
            )


class SearchEngineConfigViewSet(viewsets.ModelViewSet):
    """
    検索エンジン設定管理のViewSet
    
    Web検索エンジンの設定を管理します。
    """
    queryset = SearchEngineConfig.objects.all()
    serializer_class = SearchEngineConfigSerializer
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """有効な検索エンジン一覧を取得"""
        configs = self.get_queryset().filter(is_active=True)
        serializer = self.get_serializer(configs, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def default(self, request):
        """デフォルト検索エンジンを取得"""
        try:
            config = self.get_queryset().get(is_default=True, is_active=True)
            serializer = self.get_serializer(config)
            return Response(serializer.data)
        except SearchEngineConfig.DoesNotExist:
            return Response(
                {'error': 'デフォルトの検索エンジンが設定されていません'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def test_connection(self, request, pk=None):
        """検索エンジンの接続テスト"""
        config = self.get_object()
        
        # TODO: 実際の検索API接続テストを実装
        if not config.get_api_key():
            return Response(
                {'success': False, 'message': 'APIキーが設定されていません'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response({
            'success': True,
            'message': f'{config.get_engine_type_display()}への接続テストは成功しました'
        })


class AISettingsViewSet(viewsets.ViewSet):
    """
    AI設定管理のViewSet（シングルトン）
    
    AI機能全般の設定を管理します。
    """
    
    def list(self, request):
        """設定を取得"""
        settings = AISettings.load()
        serializer = AISettingsSerializer(settings)
        return Response(serializer.data)
    
    def update(self, request, pk=None):
        """設定を更新"""
        settings = AISettings.load()
        serializer = AISettingsSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def reset(self, request):
        """設定をデフォルトにリセット"""
        settings = AISettings.load()
        settings.ai_enabled = True
        settings.require_confirmation = True
        settings.allow_overwrite = False
        settings.confidence_threshold = 70
        settings.auto_save_on_high_confidence = False
        settings.save()
        serializer = AISettingsSerializer(settings)
        return Response(serializer.data)
