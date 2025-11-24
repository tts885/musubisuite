"""
OCR API Views

生成AIを使用したOCR処理のAPIエンドポイント

Author: 開発チーム
Created: 2025-11-24
"""

import logging
import json
import base64
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes

from ai_services import process_ocr, validate_ocr_result
from ai_services.exceptions import APICallError

logger = logging.getLogger(__name__)


@extend_schema(
    summary="OCR処理実行",
    description="""
    画像からOCR処理を実行し、テキストフィールドと座標情報を抽出します。
    
    生成AIを使用して画像内のテキストを認識し、フィールド名、値、位置座標、信頼度を返します。
    """,
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "image_base64": {
                    "type": "string",
                    "description": "Base64エンコードされた画像データ（data:image/...プレフィックスなし）"
                },
                "document_type": {
                    "type": "string",
                    "enum": ["invoice", "receipt", "contract", "form", "other"],
                    "default": "invoice",
                    "description": "ドキュメントタイプ"
                },
                "provider_id": {
                    "type": "integer",
                    "nullable": True,
                    "description": "使用するAIプロバイダーID（省略時はデフォルト）"
                }
            },
            "required": ["image_base64"]
        }
    },
    responses={
        200: {
            "description": "OCR処理成功",
            "content": {
                "application/json": {
                    "example": {
                        "success": True,
                        "data": {
                            "fields": [
                                {
                                    "id": "field-1",
                                    "label": "請求書番号",
                                    "value": "INV-123456",
                                    "confidence": 0.95,
                                    "boundingBox": {
                                        "x": 450,
                                        "y": 150,
                                        "width": 150,
                                        "height": 25
                                    }
                                },
                                {
                                    "id": "field-2",
                                    "label": "発行日",
                                    "value": "2024年11月24日",
                                    "confidence": 0.92,
                                    "boundingBox": {
                                        "x": 450,
                                        "y": 185,
                                        "width": 120,
                                        "height": 20
                                    }
                                }
                            ],
                            "overallConfidence": 0.93
                        },
                        "message": "OCR処理が完了しました"
                    }
                }
            }
        },
        400: {
            "description": "リクエストエラー",
            "content": {
                "application/json": {
                    "example": {
                        "success": False,
                        "error": "image_base64 は必須です"
                    }
                }
            }
        },
        500: {
            "description": "サーバーエラー",
            "content": {
                "application/json": {
                    "example": {
                        "success": False,
                        "error": "OCR処理中にエラーが発生しました"
                    }
                }
            }
        }
    },
    tags=["OCR"]
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_document_ocr(request):
    """
    ドキュメントのOCR処理を実行
    
    Args:
        request: HTTPリクエスト
            - image_base64: Base64エンコードされた画像データ
            - document_type: ドキュメントタイプ (invoice, receipt, etc.)
            - provider_id: AIプロバイダーID（オプション）
    
    Returns:
        Response: OCR処理結果
    """
    try:
        # リクエストデータ取得
        image_base64 = request.data.get('image_base64')
        document_type = request.data.get('document_type', 'invoice')
        provider_id = request.data.get('provider_id')
        
        # パラメータ検証
        if not image_base64:
            return Response(
                {
                    'success': False,
                    'error': 'image_base64 は必須です'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Data URLプレフィックスを削除
        if image_base64.startswith('data:'):
            image_base64 = image_base64.split(',', 1)[1]
        
        # Base64検証
        try:
            base64.b64decode(image_base64)
        except Exception as e:
            return Response(
                {
                    'success': False,
                    'error': f'不正なBase64データです: {str(e)}'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        logger.info(
            f"OCR処理リクエスト受信: "
            f"document_type={document_type}, "
            f"provider_id={provider_id}, "
            f"user={request.user}"
        )
        
        # OCR処理実行
        result = process_ocr(
            image_base64=image_base64,
            document_type=document_type,
            provider_id=provider_id
        )
        
        # 結果検証
        if not validate_ocr_result(result):
            logger.warning("OCR結果の検証に失敗")
            return Response(
                {
                    'success': False,
                    'error': 'OCR結果の妥当性検証に失敗しました'
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        logger.info(
            f"OCR処理成功: {len(result['fields'])} フィールド検出, "
            f"全体信頼度={result['overallConfidence']}"
        )
        
        return Response(
            {
                'success': True,
                'data': result,
                'message': 'OCR処理が完了しました'
            },
            status=status.HTTP_200_OK
        )
    
    except APICallError as e:
        logger.error(f"AI APIエラー: {str(e)}")
        return Response(
            {
                'success': False,
                'error': f'AI処理エラー: {str(e)}'
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    except ValueError as e:
        logger.error(f"パラメータエラー: {str(e)}")
        return Response(
            {
                'success': False,
                'error': str(e)
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    except Exception as e:
        logger.error(f"OCR処理エラー: {str(e)}", exc_info=True)
        return Response(
            {
                'success': False,
                'error': 'OCR処理中にエラーが発生しました'
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@extend_schema(
    summary="OCR処理テスト",
    description="認証不要のテスト用OCRエンドポイント（開発環境専用）",
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "image_base64": {
                    "type": "string",
                    "description": "Base64エンコードされた画像データ"
                },
                "document_type": {
                    "type": "string",
                    "enum": ["invoice", "receipt", "contract", "form", "other"],
                    "default": "invoice"
                }
            },
            "required": ["image_base64"]
        }
    },
    tags=["OCR"]
)
@api_view(['POST'])
def test_ocr(request):
    """
    OCR処理のテスト用エンドポイント（認証不要）
    
    開発・デバッグ用。本番環境では無効化すること。
    """
    try:
        image_base64 = request.data.get('image_base64')
        document_type = request.data.get('document_type', 'invoice')
        
        if not image_base64:
            return Response(
                {'success': False, 'error': 'image_base64 は必須です'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Data URLプレフィックスを削除
        if image_base64.startswith('data:'):
            image_base64 = image_base64.split(',', 1)[1]
        
        result = process_ocr(
            image_base64=image_base64,
            document_type=document_type
        )
        
        return Response(
            {
                'success': True,
                'data': result,
                'message': 'テストOCR処理完了'
            },
            status=status.HTTP_200_OK
        )
    
    except Exception as e:
        logger.error(f"テストOCRエラー: {str(e)}", exc_info=True)
        return Response(
            {
                'success': False,
                'error': str(e)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
