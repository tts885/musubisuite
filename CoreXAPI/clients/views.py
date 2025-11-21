from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import Client
from .serializers import ClientSerializer, ClientListSerializer
from ai_services.client_enrichment import get_enrichment_service
import logging


logger = logging.getLogger(__name__)


class ClientViewSet(viewsets.ModelViewSet):
    """クライアントのCRUD API"""
    
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    permission_classes = []  # 開発環境では認証不要
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['industry']
    search_fields = ['name', 'company_name', 'email']
    ordering_fields = ['created_at', 'company_name']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """アクションに応じてシリアライザーを切り替え"""
        if self.action == 'list':
            return ClientListSerializer
        return ClientSerializer
    
    def create(self, request, *args, **kwargs):
        """クライアント作成（詳細ログ付き）"""
        logger.info(f"クライアント作成リクエスト: {request.data}")
        
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            logger.error(f"バリデーションエラー: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        logger.info(f"クライアント作成成功: ID={serializer.data.get('id')}")
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    @action(detail=False, methods=['post'], url_path='ai-fetch')
    def ai_fetch(self, request):
        """
        AIで企業情報を取得
        
        POST /api/clients/ai-fetch/
        Body: {"company_name": "企業名"}
        
        Returns:
            企業情報（ai_generated=True, ai_confidence_scoreを含む）
        """
        try:
            company_name = request.data.get('company_name')
            
            if not company_name:
                return Response(
                    {'error': 'company_nameは必須です'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            logger.info(f"AI企業情報取得リクエスト: {company_name}")
            
            # AI Enrichment Serviceで情報を取得
            enrichment_service = get_enrichment_service()
            result = enrichment_service.fetch_company_info(company_name)
            
            # エラーチェック
            if 'error' in result:
                return Response(
                    result,
                    status=status.HTTP_404_NOT_FOUND
                )
            
            logger.info(
                f"AI企業情報取得成功: {company_name}, "
                f"信頼度={result.get('ai_confidence_score')}"
            )
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"AI企業情報取得エラー: {str(e)}", exc_info=True)
            return Response(
                {'error': f'企業情報の取得に失敗しました: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'], url_path='ai-refresh')
    def ai_refresh(self, request, pk=None):
        """
        既存クライアントの情報をAIで更新
        
        POST /api/clients/{id}/ai-refresh/
        
        Returns:
            更新情報（changes, new_data, confidence_scoreを含む）
        """
        try:
            client = self.get_object()
            
            logger.info(f"AI企業情報更新リクエスト: ID={client.id}, {client.company_name}")
            
            # 現在のクライアント情報をシリアライズ
            serializer = self.get_serializer(client)
            current_data = serializer.data
            
            # AI Enrichment Serviceで情報を更新
            enrichment_service = get_enrichment_service()
            result = enrichment_service.refresh_company_info(current_data)
            
            # エラーチェック
            if 'error' in result:
                return Response(
                    result,
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # 変更がない場合
            if not result.get('changes'):
                logger.info(f"変更なし: ID={client.id}")
                return Response(
                    {
                        'message': '変更はありませんでした',
                        'changes': []
                    },
                    status=status.HTTP_200_OK
                )
            
            logger.info(
                f"AI企業情報更新成功: ID={client.id}, "
                f"変更={len(result['changes'])}件, "
                f"信頼度={result.get('confidence_score')}"
            )
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"AI企業情報更新エラー: {str(e)}", exc_info=True)
            return Response(
                {'error': f'企業情報の更新に失敗しました: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
