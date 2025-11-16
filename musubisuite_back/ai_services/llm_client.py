"""
LLM Client - 統一されたAIクライアント

全システムで共通利用可能なAIクライアントを提供します。
AI設定で管理されているプロバイダー情報を自動的に読み込んで使用します。

使用例:
    # 基本的な使い方
    from ai_services import get_default_ai_client
    
    client = get_default_ai_client()
    response = client.generate("東京の天気を教えて")
    print(response)
    
    # ストリーミング生成
    for chunk in client.generate_stream("長文を生成してください"):
        print(chunk, end='', flush=True)
    
    # 特定のプロバイダーを使用
    from ai_services import get_ai_client
    
    client = get_ai_client(provider_id=2)  # ID指定
    client = get_ai_client(provider_name="GPT-4")  # 名前指定

Author: 開発チーム
Created: 2025-11-16
"""

import logging
from typing import Generator, Optional, Dict, Any
from .exceptions import (
    ProviderNotFoundError,
    APIKeyNotConfiguredError,
    APICallError,
    StreamingError
)

logger = logging.getLogger(__name__)


class AIClient:
    """
    統一されたAIクライアント
    
    AI設定で管理されているプロバイダー情報を使用して、
    各種LLM APIへの統一インターフェースを提供します。
    """
    
    def __init__(self, provider=None):
        """
        Args:
            provider: AIProviderインスタンス（Noneの場合はデフォルト設定を使用）
        
        Raises:
            ProviderNotFoundError: プロバイダーが見つからない
            APIKeyNotConfiguredError: APIキーが設定されていない
        """
        if provider is None:
            from ai_settings.models import AIProvider
            provider = AIProvider.objects.filter(
                is_active=True,
                is_default=True
            ).first()
            
            if not provider:
                raise ProviderNotFoundError(
                    "デフォルトのAIプロバイダーが設定されていません。"
                    "AI設定画面でプロバイダーを登録してください。"
                )
        
        self.provider = provider
        self.api_key = provider.get_api_key()
        
        if not self.api_key:
            raise APIKeyNotConfiguredError(
                f"プロバイダー '{provider.name}' のAPIキーが設定されていません"
            )
        
        logger.info(
            f"AIClient initialized: {provider.name} "
            f"({provider.get_provider_type_display()}, {provider.model_name})"
        )
    
    def generate(self, prompt: str, **kwargs) -> str:
        """
        テキストを生成（同期処理）
        
        Args:
            prompt: 入力プロンプト
            **kwargs: 追加パラメータ（max_tokens, temperatureなど）
        
        Returns:
            生成されたテキスト
        
        Raises:
            APICallError: API呼び出しに失敗
        
        Example:
            client = get_default_ai_client()
            response = client.generate("こんにちは")
            print(response)
        """
        try:
            logger.debug(f"Generating text with {self.provider.provider_type}: {prompt[:50]}...")
            
            full_response = ""
            for chunk in self.generate_stream(prompt, **kwargs):
                full_response += chunk
            
            logger.info(f"Generated {len(full_response)} characters")
            return full_response
            
        except Exception as e:
            error_msg = f"テキスト生成エラー: {type(e).__name__}: {str(e)}"
            logger.error(error_msg, exc_info=True)
            raise APICallError(error_msg) from e
    
    def generate_stream(self, prompt: str, **kwargs) -> Generator[str, None, None]:
        """
        テキストをストリーミング生成
        
        Args:
            prompt: 入力プロンプト
            **kwargs: 追加パラメータ
        
        Yields:
            生成されたテキストのチャンク
        
        Raises:
            APICallError: API呼び出しに失敗
            StreamingError: ストリーミング中にエラー
        
        Example:
            client = get_default_ai_client()
            for chunk in client.generate_stream("長い文章を生成"):
                print(chunk, end='', flush=True)
        """
        try:
            # パラメータのマージ（デフォルト + 引数）
            max_tokens = kwargs.get('max_tokens', self.provider.max_tokens)
            temperature = kwargs.get('temperature', self.provider.temperature)
            
            logger.debug(
                f"Streaming with {self.provider.provider_type}: "
                f"model={self.provider.model_name}, "
                f"max_tokens={max_tokens}, "
                f"temperature={temperature}"
            )
            
            # プロバイダータイプに応じて処理を分岐
            if self.provider.provider_type == 'azure_openai':
                yield from self._stream_azure_openai(prompt, max_tokens, temperature, **kwargs)
            
            elif self.provider.provider_type == 'openai':
                yield from self._stream_openai(prompt, max_tokens, temperature, **kwargs)
            
            elif self.provider.provider_type == 'anthropic':
                yield from self._stream_anthropic(prompt, max_tokens, temperature, **kwargs)
            
            elif self.provider.provider_type == 'google':
                yield from self._stream_google(prompt, max_tokens, temperature, **kwargs)
            
            else:
                raise APICallError(
                    f"サポートされていないプロバイダータイプ: {self.provider.provider_type}"
                )
        
        except Exception as e:
            if isinstance(e, (APICallError, StreamingError)):
                raise
            error_msg = f"ストリーミングエラー: {type(e).__name__}: {str(e)}"
            logger.error(error_msg, exc_info=True)
            raise StreamingError(error_msg) from e

    
    def _stream_azure_openai(
        self,
        prompt: str,
        max_tokens: int,
        temperature: float,
        **kwargs
    ) -> Generator[str, None, None]:
        """Azure OpenAI でストリーミング生成"""
        try:
            from openai import AzureOpenAI
            
            client = AzureOpenAI(
                api_key=self.api_key,
                api_version=self.provider.api_version or "2024-02-01",
                azure_endpoint=self.provider.endpoint
            )
            
            stream = client.chat.completions.create(
                model=self.provider.deployment_name or self.provider.model_name,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=max_tokens,
                temperature=temperature,
                timeout=kwargs.get('timeout', 50.0),
                stream=True
            )
            
            for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        
        except Exception as e:
            raise APICallError(f"Azure OpenAI API エラー: {str(e)}") from e
    
    def _stream_openai(
        self,
        prompt: str,
        max_tokens: int,
        temperature: float,
        **kwargs
    ) -> Generator[str, None, None]:
        """OpenAI でストリーミング生成"""
        try:
            from openai import OpenAI
            
            client_kwargs = {'api_key': self.api_key}
            if self.provider.organization_id:
                client_kwargs['organization'] = self.provider.organization_id
            
            client = OpenAI(**client_kwargs)
            
            stream = client.chat.completions.create(
                model=self.provider.model_name,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=max_tokens,
                temperature=temperature,
                timeout=kwargs.get('timeout', 50.0),
                stream=True
            )
            
            for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        
        except Exception as e:
            raise APICallError(f"OpenAI API エラー: {str(e)}") from e
    
    def _stream_anthropic(
        self,
        prompt: str,
        max_tokens: int,
        temperature: float,
        **kwargs
    ) -> Generator[str, None, None]:
        """Anthropic Claude でストリーミング生成"""
        try:
            import anthropic
            
            client = anthropic.Anthropic(api_key=self.api_key)
            
            with client.messages.stream(
                model=self.provider.model_name,
                max_tokens=max_tokens,
                temperature=temperature,
                timeout=kwargs.get('timeout', 50.0),
                messages=[{"role": "user", "content": prompt}]
            ) as stream:
                for text in stream.text_stream:
                    yield text
        
        except Exception as e:
            raise APICallError(f"Anthropic API エラー: {str(e)}") from e
    
    def _stream_google(
        self,
        prompt: str,
        max_tokens: int,
        temperature: float,
        **kwargs
    ) -> Generator[str, None, None]:
        """Google Gemini でストリーミング生成（公式SDK使用）"""
        try:
            from google import genai
            
            # 公式SDKのClientを使用
            client = genai.Client(api_key=self.api_key)
            
            # generate_content_streamでストリーミング生成
            response = client.models.generate_content_stream(
                model=self.provider.model_name,
                contents=[prompt],
                config={
                    'max_output_tokens': max_tokens,
                    'temperature': temperature,
                }
            )
            
            # 公式形式でチャンクを取得
            for chunk in response:
                if chunk.text:
                    yield chunk.text
        
        except Exception as e:
            raise APICallError(f"Google Gemini API エラー: {str(e)}") from e
    
    @property
    def info(self) -> Dict[str, Any]:
        """プロバイダー情報を取得"""
        return {
            'id': self.provider.id,
            'name': self.provider.name,
            'provider_type': self.provider.provider_type,
            'provider_type_display': self.provider.get_provider_type_display(),
            'model_name': self.provider.model_name,
            'max_tokens': self.provider.max_tokens,
            'temperature': self.provider.temperature,
        }


# グローバルヘルパー関数

def get_default_ai_client() -> AIClient:
    """
    デフォルトのAIクライアントを取得
    
    Returns:
        AIClientインスタンス
    
    Raises:
        ProviderNotFoundError: デフォルトプロバイダーが設定されていない
        APIKeyNotConfiguredError: APIキーが設定されていない
    
    Example:
        from ai_services import get_default_ai_client
        
        client = get_default_ai_client()
        response = client.generate("こんにちは")
    """
    return AIClient(provider=None)


def get_ai_client(
    provider_id: Optional[int] = None,
    provider_name: Optional[str] = None
) -> AIClient:
    """
    指定されたAIクライアントを取得
    
    Args:
        provider_id: プロバイダーID
        provider_name: プロバイダー名
    
    Returns:
        AIClientインスタンス
    
    Raises:
        ProviderNotFoundError: プロバイダーが見つからない
        ValueError: IDも名前も指定されていない
    
    Example:
        from ai_services import get_ai_client
        
        # ID指定
        client = get_ai_client(provider_id=2)
        
        # 名前指定
        client = get_ai_client(provider_name="GPT-4")
    """
    from ai_settings.models import AIProvider
    
    if provider_id is None and provider_name is None:
        raise ValueError("provider_id または provider_name を指定してください")
    
    try:
        if provider_id is not None:
            provider = AIProvider.objects.get(id=provider_id, is_active=True)
        else:
            provider = AIProvider.objects.get(name=provider_name, is_active=True)
        
        return AIClient(provider=provider)
    
    except AIProvider.DoesNotExist:
        if provider_id is not None:
            raise ProviderNotFoundError(f"プロバイダーID {provider_id} が見つかりません")
        else:
            raise ProviderNotFoundError(f"プロバイダー '{provider_name}' が見つかりません")

