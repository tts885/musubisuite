"""
AI Code Master Views

カテゴリの色とアイコンをAIで自動生成するAPIエンドポイント
"""

from django.http import StreamingHttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import api_view
from rest_framework import status
from ai_services.code_master_generator import ai_code_master_service
import json
import logging

logger = logging.getLogger(__name__)


@csrf_exempt
@require_http_methods(["POST"])
def generate_color_and_icon(request):
    """
    カテゴリの色とアイコンをAIで生成（ストリーミング）
    
    Request Body:
        {
            "category_name": "業種",
            "category_description": "クライアントの業種分類",
            "existing_codes": [
                {"name": "IT・情報", "color": "#3b82f6", "icon": "Laptop"},
                {"name": "製造業", "color": "#ef4444", "icon": "Factory"}
            ]
        }
    
    Response: Server-Sent Events (SSE)
        data: {"content": "テキストチャンク"}
        data: {"done": true}
        data: {"error": "エラーメッセージ"}
    """
    try:
        # リクエストボディをパース
        try:
            request_data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse(
                {'error': 'Invalid JSON'},
                status=400
            )
        
        # リクエストデータを取得
        category_name = request_data.get('category_name', '')
        
        if not category_name:
            return JsonResponse(
                {'error': 'category_nameは必須です'},
                status=400
            )
        
        logger.info(f"AI generation requested for category: {category_name}")
        
        # ストリーミングレスポンスを生成
        response = StreamingHttpResponse(
            ai_code_master_service.generate_color_and_icon_stream(request_data),
            content_type='text/event-stream'
        )
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'
        
        return response
        
    except Exception as e:
        logger.error(f"Error in generate_color_and_icon: {str(e)}", exc_info=True)
        return JsonResponse(
            {'error': str(e)},
            status=500
        )


@api_view(['POST'])
def generate_color_and_icon_sync(request):
    """
    カテゴリの色とアイコンをAIで生成（同期）
    
    Request Body:
        {
            "category_name": "業種",
            "category_description": "クライアントの業種分類",
            "existing_codes": [
                {"name": "IT・情報", "color": "#3b82f6", "icon": "Laptop"},
                {"name": "製造業", "color": "#ef4444", "icon": "Factory"}
            ]
        }
    
    Response:
        {
            "color": "#3b82f6",
            "icon": "Folder",
            "reasoning": "選択理由"
        }
    """
    try:
        # リクエストデータを取得
        category_name = request.data.get('category_name', '')
        
        if not category_name:
            return JsonResponse(
                {'error': 'category_nameは必須です'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        logger.info(f"AI generation (sync) requested for category: {category_name}")
        
        # 同期生成
        result = ai_code_master_service.generate_color_and_icon_sync(request.data)
        
        return JsonResponse(result)
        
    except Exception as e:
        logger.error(f"Error in generate_color_and_icon_sync: {str(e)}", exc_info=True)
        return JsonResponse(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
