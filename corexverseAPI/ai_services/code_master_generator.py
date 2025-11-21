"""
AI Code Master Service

カテゴリに適した色とアイコンをAIで自動生成するサービス
"""

from typing import Dict, Any, Generator
import json
import logging
from ai_services import get_default_ai_client
from ai_services.exceptions import ProviderNotFoundError, APIKeyNotConfiguredError

logger = logging.getLogger(__name__)


class AICodeMasterService:
    """
    AIを活用してコードマスターのカテゴリ色とアイコンを生成
    """
    
    # 利用可能なlucide-reactアイコン（20個）
    AVAILABLE_ICONS = [
        'Laptop', 'Building2', 'Users', 'ShoppingCart', 'Heart',
        'Factory', 'GraduationCap', 'Truck', 'CheckCircle', 'Clock',
        'AlertCircle', 'FileText', 'Mail', 'Calendar', 'Settings',
        'Database', 'BarChart3', 'Star', 'Tag', 'Folder'
    ]
    
    # カラーパレット（18色）
    COLOR_PALETTE = [
        '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
        '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
        '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#64748b'
    ]
    
    def generate_prompt(self, request_data: Dict[str, Any]) -> str:
        """
        AIプロンプトを生成
        
        Args:
            request_data: リクエストデータ
                - category_name: カテゴリ名（必須）
                - category_description: カテゴリ説明（オプション）
                - existing_codes: 既存コード一覧（オプション）
        
        Returns:
            生成されたプロンプト
        """
        category_name = request_data.get('category_name', '')
        category_description = request_data.get('category_description', '')
        existing_codes = request_data.get('existing_codes', [])
        
        prompt = f"""あなたはUIデザインのエキスパートです。以下のカテゴリに最適な色とアイコンを提案してください。

# カテゴリ情報
カテゴリ名: {category_name}
"""
        
        if category_description:
            prompt += f"説明: {category_description}\n"
        
        if existing_codes:
            prompt += f"\n# 既存のコード一覧（{len(existing_codes)}件）\n"
            for idx, code in enumerate(existing_codes[:5], 1):  # 最大5件まで表示
                code_info = f"{idx}. {code.get('name', '不明')}"
                if code.get('color'):
                    code_info += f" (色: {code['color']})"
                if code.get('icon'):
                    code_info += f" (アイコン: {code['icon']})"
                prompt += code_info + "\n"
            
            if len(existing_codes) > 5:
                prompt += f"...他 {len(existing_codes) - 5} 件\n"
        
        prompt += f"""
# 利用可能なアイコン
{', '.join(self.AVAILABLE_ICONS)}

# 利用可能な色（16進数カラーコード）
{', '.join(self.COLOR_PALETTE)}

# 指示
1. カテゴリの性質を理解し、最も適切な色を選択してください
2. カテゴリを象徴するアイコンを選択してください
3. 既存コードと重複しない色を優先してください
4. 結果はJSON形式で出力してください

# 出力形式
{{
  "color": "#3b82f6",
  "icon": "Folder",
  "reasoning": "選択理由を簡潔に説明"
}}

必ずJSON形式で回答してください。"""
        
        return prompt
    
    def generate_color_and_icon_stream(
        self,
        request_data: Dict[str, Any]
    ) -> Generator[str, None, None]:
        """
        AIを使用して色とアイコンを生成（ストリーミング）
        
        Args:
            request_data: リクエストデータ
        
        Yields:
            SSE形式のレスポンス
        """
        try:
            # AIクライアントを取得
            client = get_default_ai_client()
            
            # プロンプトを生成
            prompt = self.generate_prompt(request_data)
            logger.info(f"Generating color and icon for category: {request_data.get('category_name')}")
            
            # AIからストリーミングレスポンスを取得
            for chunk in client.generate_stream(prompt, max_tokens=500, temperature=0.7):
                if chunk:
                    yield f'data: {json.dumps({"content": chunk}, ensure_ascii=False)}\n\n'
            
            # 完了シグナル
            yield f'data: {json.dumps({"done": True})}\n\n'
            logger.info("Color and icon generation completed")
            
        except (ProviderNotFoundError, APIKeyNotConfiguredError) as e:
            error_msg = str(e)
            logger.error(f"AI configuration error: {error_msg}")
            yield f'data: {json.dumps({"error": error_msg})}\n\n'
            
        except Exception as e:
            error_msg = f"{type(e).__name__}: {str(e)}"
            logger.error(f"AI generation error: {error_msg}", exc_info=True)
            yield f'data: {json.dumps({"error": error_msg})}\n\n'
    
    def generate_color_and_icon_sync(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        AIを使用して色とアイコンを生成（同期）
        
        Args:
            request_data: リクエストデータ
        
        Returns:
            生成結果
        """
        try:
            # AIクライアントを取得
            client = get_default_ai_client()
            
            # プロンプトを生成
            prompt = self.generate_prompt(request_data)
            logger.info(f"Generating color and icon for category: {request_data.get('category_name')}")
            
            # AIから完全なレスポンスを取得
            response = client.generate(prompt, max_tokens=500, temperature=0.7)
            
            # レスポンスをパース
            result = self._parse_ai_response(response)
            logger.info(f"Generation completed: {result}")
            
            return result
            
        except (ProviderNotFoundError, APIKeyNotConfiguredError) as e:
            logger.error(f"AI configuration error: {str(e)}")
            raise
            
        except Exception as e:
            logger.error(f"AI generation error: {str(e)}", exc_info=True)
            raise
    
    def _parse_ai_response(self, response: str) -> Dict[str, Any]:
        """
        AIレスポンスをパースして色とアイコンを抽出
        
        Args:
            response: AIからのレスポンステキスト
        
        Returns:
            パース結果
        """
        try:
            # JSON形式を抽出
            import re
            json_match = re.search(r'\{[\s\S]*?"color"[\s\S]*?"icon"[\s\S]*?\}', response)
            
            if json_match:
                result = json.loads(json_match.group(0))
                
                # バリデーション
                color = result.get('color', '#3b82f6')
                icon = result.get('icon', 'Folder')
                
                # アイコンの検証
                if icon not in self.AVAILABLE_ICONS:
                    logger.warning(f"Invalid icon '{icon}', using default 'Folder'")
                    icon = 'Folder'
                
                # 色の検証（16進数カラーコード）
                if not re.match(r'^#[0-9a-fA-F]{6}$', color):
                    logger.warning(f"Invalid color '{color}', using default '#3b82f6'")
                    color = '#3b82f6'
                
                return {
                    'color': color,
                    'icon': icon,
                    'reasoning': result.get('reasoning', '')
                }
            
            # JSON形式でない場合はデフォルト値を返す
            logger.warning("Could not parse JSON from AI response, using defaults")
            return {
                'color': '#3b82f6',
                'icon': 'Folder',
                'reasoning': response
            }
            
        except Exception as e:
            logger.error(f"Error parsing AI response: {str(e)}")
            return {
                'color': '#3b82f6',
                'icon': 'Folder',
                'reasoning': ''
            }


# シングルトンインスタンス
ai_code_master_service = AICodeMasterService()
