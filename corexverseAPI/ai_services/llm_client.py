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
    
    def generate_with_image(
        self,
        text_prompt: str,
        image_base64: str,
        max_tokens: int = 2000,
        temperature: float = 0.1
    ) -> str:
        """
        画像とテキストプロンプトから応答を生成（マルチモーダル）
        
        Args:
            text_prompt: テキストプロンプト
            image_base64: Base64エンコードされた画像データ
            max_tokens: 最大トークン数
            temperature: 温度パラメータ
        
        Returns:
            生成されたテキスト
        
        Raises:
            APICallError: API呼び出しに失敗
        """
        try:
            logger.info(
                f"Generating with image using {self.provider.provider_type}: "
                f"model={self.provider.model_name}, "
                f"image_size={len(image_base64)} bytes"
            )
            
            # プロバイダータイプに応じて処理を分岐
            if self.provider.provider_type == 'google':
                return self._generate_with_image_google(
                    text_prompt, image_base64, max_tokens, temperature
                )
            elif self.provider.provider_type in ['azure_openai', 'openai']:
                return self._generate_with_image_openai(
                    text_prompt, image_base64, max_tokens, temperature
                )
            elif self.provider.provider_type == 'anthropic':
                return self._generate_with_image_anthropic(
                    text_prompt, image_base64, max_tokens, temperature
                )
            else:
                raise APICallError(
                    f"プロバイダー '{self.provider.provider_type}' は画像入力に対応していません"
                )
        
        except Exception as e:
            error_msg = f"画像付きテキスト生成エラー: {type(e).__name__}: {str(e)}"
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
            max_tokens = kwargs.pop('max_tokens', self.provider.max_tokens)
            temperature = kwargs.pop('temperature', self.provider.temperature)
            
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
    
    def _generate_with_image_google(
        self,
        text_prompt: str,
        image_base64: str,
        max_tokens: int,
        temperature: float
    ) -> str:
        """Google Gemini で画像付き生成"""
        try:
            import base64
            
            logger.debug(f"Google Gemini 画像生成開始: model={self.provider.model_name}")
            
            # Base64データをバイト列に変換
            image_bytes = base64.b64decode(image_base64)
            logger.debug(f"画像デコード成功: {len(image_bytes)} bytes")
            
            # 新しいSDKを試す
            try:
                from google import genai
                from google.genai import types
                
                client = genai.Client(api_key=self.api_key)
                
                # 画像パートを作成
                image_part = types.Part.from_bytes(
                    data=image_bytes,
                    mime_type="image/jpeg"
                )
                
                # コンテンツ生成
                logger.debug("Gemini API呼び出し中（新SDK）...")
                response = client.models.generate_content(
                    model=self.provider.model_name,
                    contents=[text_prompt, image_part],
                    config=types.GenerateContentConfig(
                        max_output_tokens=max_tokens,
                        temperature=temperature,
                    )
                )
                
            except ImportError:
                # 古いSDKにフォールバック
                logger.debug("新SDKが見つからないため、google-generativeai を使用")
                import google.generativeai as genai
                
                genai.configure(api_key=self.api_key)
                model = genai.GenerativeModel(self.provider.model_name)
                
                # 画像データを準備
                image_parts = [
                    {
                        "mime_type": "image/jpeg",
                        "data": image_bytes
                    }
                ]
                
                logger.debug("Gemini API呼び出し中（旧SDK）...")
                response = model.generate_content(
                    [text_prompt, image_parts[0]],
                    generation_config={
                        "max_output_tokens": max_tokens,
                        "temperature": temperature,
                    }
                )
            
            logger.debug(f"Gemini API応答受信: {type(response)}")
            
            # レスポンスからテキストを取得
            result_text = None
            
            # まず response.text を試す（最も一般的）
            try:
                if hasattr(response, 'text'):
                    result_text = response.text
                    if result_text:
                        logger.debug(f"response.text から取得: {len(result_text)} 文字")
            except Exception as e:
                logger.debug(f"response.text 取得エラー: {e}")
            
            # response.textが空の場合、candidatesから取得を試みる
            if not result_text and hasattr(response, 'candidates') and len(response.candidates) > 0:
                candidate = response.candidates[0]
                logger.debug(f"candidate.finish_reason: {getattr(candidate, 'finish_reason', 'N/A')}")
                
                if hasattr(candidate, 'content') and candidate.content:
                    if hasattr(candidate.content, 'parts') and candidate.content.parts:
                        if len(candidate.content.parts) > 0:
                            part = candidate.content.parts[0]
                            if hasattr(part, 'text'):
                                result_text = part.text
                                logger.debug(f"candidates から取得: {len(result_text)} 文字")
            
            if not result_text:
                # finish_reasonを確認
                finish_reason = None
                if hasattr(response, 'candidates') and len(response.candidates) > 0:
                    finish_reason = getattr(response.candidates[0], 'finish_reason', None)
                
                if finish_reason == 'MAX_TOKENS':
                    raise APICallError(
                        f"Gemini APIのトークン数制限に達しました。max_tokensを増やしてください（現在: {max_tokens}）"
                    )
                
                logger.error(f"予期しないレスポンス形式")
                logger.error(f"response.text: {getattr(response, 'text', 'N/A')}")
                logger.error(f"finish_reason: {finish_reason}")
                raise APICallError("Gemini APIから有効なテキストが返されませんでした")
            
            logger.info(f"Gemini 画像処理成功: {len(result_text)} 文字")
            return result_text
        
        except Exception as e:
            logger.error(f"Google Gemini 画像処理エラー: {str(e)}", exc_info=True)
            raise APICallError(f"Google Gemini 画像処理エラー: {str(e)}") from e
    
    def _generate_with_image_openai(
        self,
        text_prompt: str,
        image_base64: str,
        max_tokens: int,
        temperature: float
    ) -> str:
        """OpenAI GPT-4 Vision で画像付き生成"""
        try:
            from openai import OpenAI
            
            if self.provider.provider_type == 'azure_openai':
                from openai import AzureOpenAI
                client = AzureOpenAI(
                    api_key=self.api_key,
                    api_version=self.provider.api_version or "2024-02-15-preview",
                    azure_endpoint=self.provider.endpoint_url
                )
            else:
                client = OpenAI(api_key=self.api_key)
            
            # メッセージを構築
            messages = [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": text_prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_base64}"
                            }
                        }
                    ]
                }
            ]
            
            response = client.chat.completions.create(
                model=self.provider.model_name,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature
            )
            
            return response.choices[0].message.content
        
        except Exception as e:
            raise APICallError(f"OpenAI Vision 画像処理エラー: {str(e)}") from e
    
    def _generate_with_image_anthropic(
        self,
        text_prompt: str,
        image_base64: str,
        max_tokens: int,
        temperature: float
    ) -> str:
        """Anthropic Claude で画像付き生成"""
        try:
            import anthropic
            
            client = anthropic.Anthropic(api_key=self.api_key)
            
            message = client.messages.create(
                model=self.provider.model_name,
                max_tokens=max_tokens,
                temperature=temperature,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": "image/jpeg",
                                    "data": image_base64,
                                },
                            },
                            {
                                "type": "text",
                                "text": text_prompt
                            }
                        ],
                    }
                ],
            )
            
            return message.content[0].text
        
        except Exception as e:
            raise APICallError(f"Anthropic Claude 画像処理エラー: {str(e)}") from e
    
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

