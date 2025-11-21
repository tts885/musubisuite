"""
AI Services Exceptions

AI機能で使用する例外クラスを定義します。

Author: 開発チーム
Created: 2025-11-16
"""


class AIServiceError(Exception):
    """AI サービスの基底例外クラス"""
    pass


class ProviderNotFoundError(AIServiceError):
    """AI プロバイダーが見つからない"""
    pass


class APIKeyNotConfiguredError(AIServiceError):
    """API キーが設定されていない"""
    pass


class APICallError(AIServiceError):
    """API 呼び出しエラー"""
    pass


class StreamingError(AIServiceError):
    """ストリーミングエラー"""
    pass
