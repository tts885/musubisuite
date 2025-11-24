"""
AI Services Package

全システムで共通利用するAI機能を提供します。

簡単な使い方:
    from ai_services import get_default_ai_client, AIClient
    
    # デフォルトAIプロバイダーを使用
    client = get_default_ai_client()
    response = client.generate("こんにちは")
    
    # ストリーミング生成
    for chunk in client.generate_stream("長い文章を生成"):
        print(chunk, end='')
    
    # 特定のプロバイダーを指定
    client = get_ai_client(provider_id=2)
    response = client.generate("プロンプト")
    
    # OCR処理
    from ai_services import process_ocr
    result = process_ocr(base64_image, document_type="invoice")

Author: 開発チーム
Created: 2025-11-16
"""

__version__ = '1.0.0'

from .llm_client import AIClient, get_default_ai_client, get_ai_client
from .ocr_processor import process_ocr, validate_ocr_result
from .exceptions import (
    AIServiceError,
    ProviderNotFoundError,
    APIKeyNotConfiguredError,
    APICallError,
    StreamingError
)

__all__ = [
    'AIClient',
    'get_default_ai_client',
    'get_ai_client',
    'process_ocr',
    'validate_ocr_result',
    'AIServiceError',
    'ProviderNotFoundError',
    'APIKeyNotConfiguredError',
    'APICallError',
    'StreamingError',
]
