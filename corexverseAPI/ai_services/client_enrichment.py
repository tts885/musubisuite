"""
Client Enrichment Service

クライアント情報のAI自動取得・更新サービスを提供します。

Author: 開発チーム
Created: 2025-11-16
"""

import json
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime

from .llm_client import get_default_ai_client
from .search_client import SearchClient
from .prompts import PromptTemplates


logger = logging.getLogger(__name__)


class ClientEnrichmentService:
    """クライアント情報充実化サービス"""
    
    def __init__(self):
        """初期化"""
        self.ai_client = get_default_ai_client()
        self.search_client = SearchClient()
        self.prompts = PromptTemplates()
    
    def fetch_company_info(self, company_name: str, use_web_search: bool = True) -> Dict[str, Any]:
        """
        企業名から企業情報を取得
        
        Args:
            company_name: 企業名
            use_web_search: Web検索を使用するか（Googleの場合のみ有効、デフォルト: True）
            
        Returns:
            企業情報の辞書（ai_generated=True, ai_confidence_scoreを含む）
            
        Raises:
            Exception: 情報取得に失敗した場合
        """
        try:
            logger.info(f"企業情報取得開始: {company_name}, Web検索={use_web_search}")
            
            # プロンプト構築（Web検索対応版）
            prompt = self._build_company_info_prompt(company_name, use_web_search)
            
            # プロバイダー別の生成処理
            provider_type = getattr(self.ai_client.provider, 'provider_type', 'unknown')
            if provider_type == 'google' and use_web_search:
                response_text = self._generate_with_google_grounding(prompt)
            else:
                response_text = self.ai_client.generate(prompt)
            
            logger.debug(f"AI生成結果: {response_text[:200]}...")
            
            # JSONパース
            structured_data = self._parse_json_response(response_text)
            
            # 信頼度スコア計算
            confidence_score = self._calculate_confidence_score(structured_data)
            
            # メタデータ追加
            result = {
                **structured_data,
                'ai_generated': True,
                'ai_generated_at': datetime.now().isoformat(),
                'ai_confidence_score': confidence_score,
                'ai_provider': self.ai_client.info['name'],
                'web_search_used': provider_type == 'google' and use_web_search,
            }
            
            logger.info(
                f"企業情報取得完了: {company_name}, "
                f"信頼度={confidence_score}%, "
                f"プロバイダー={self.ai_client.info['name']}, "
                f"Web検索={result['web_search_used']}"
            )
            
            return result
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON解析エラー: {str(e)}, レスポンス: {response_text[:500]}")
            raise Exception(f"AI応答の解析に失敗しました: {str(e)}")
        except Exception as e:
            logger.error(f"企業情報取得エラー: {company_name} - {str(e)}", exc_info=True)
            raise Exception(f"企業情報の取得に失敗しました: {str(e)}")
    
    def refresh_company_info(self, client_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        既存のクライアント情報を最新情報で更新
        
        Args:
            client_data: 既存のクライアント情報（idとcompany_nameは必須）
            
        Returns:
            更新情報の辞書（changes, new_data, confidence_scoreを含む）
            
        Raises:
            Exception: 情報取得に失敗した場合
        """
        try:
            client_id = client_data.get('id')
            company_name = client_data.get('company_name')
            
            if not company_name:
                raise ValueError("company_nameは必須です")
            
            logger.info(f"企業情報更新開始: ID={client_id}, {company_name}")
            
            # 最新情報を取得
            new_data = self.fetch_company_info(company_name)
            
            # 差分を計算
            changes = self._calculate_changes(client_data, new_data)
            
            result = {
                'changes': changes,
                'new_data': new_data,
                'confidence_score': new_data.get('ai_confidence_score', 0),
            }
            
            logger.info(f"企業情報更新完了: {company_name}, 変更 {len(changes)} 件")
            return result
            
        except Exception as e:
            logger.error(f"企業情報更新エラー: {str(e)}", exc_info=True)
            raise Exception(f"企業情報の更新に失敗しました: {str(e)}")
    
    def _generate_with_google_grounding(self, prompt: str) -> str:
        """
        Google Search Groundingを使用してテキスト生成
        
        Gemini 2.0の場合、リアルタイムWeb検索を行って最新情報を取得します。
        公式サイトから直接情報を収集し、高精度な企業情報を返します。
        
        Args:
            prompt: 生成プロンプト
            
        Returns:
            生成されたテキスト
        """
        try:
            from google import genai
            from google.genai import types
            
            logger.info("Google Search Grounding を使用して生成開始")
            
            # Gemini クライアント初期化
            client = genai.Client(api_key=self.ai_client.api_key)
            
            # Google Search Groundingを有効化して生成
            response = client.models.generate_content(
                model=self.ai_client.provider.model_name,
                contents=[prompt],
                config=types.GenerateContentConfig(
                    max_output_tokens=self.ai_client.provider.max_tokens,
                    temperature=self.ai_client.provider.temperature,
                    # Google Search Groundingを有効化
                    tools=[types.Tool(google_search=types.GoogleSearch())],
                )
            )
            
            # レスポンステキストを取得
            response_text = response.text
            
            # Grounding メタデータのログ出力（検索したURLなど）
            if hasattr(response, 'grounding_metadata') and response.grounding_metadata:
                chunks = response.grounding_metadata.grounding_chunks or []
                logger.info(f"Grounding使用: {len(chunks)} 件の検索結果を参照")
                
                # 参照したURLをログ出力
                if chunks:
                    urls = [chunk.web.uri for chunk in chunks if hasattr(chunk, 'web') and hasattr(chunk.web, 'uri')]
                    if urls:
                        logger.info(f"参照URL: {', '.join(urls[:5])}...")  # 最初の5件のみ
                
                # 検索クエリをログ出力
                if hasattr(response.grounding_metadata, 'web_search_queries') and response.grounding_metadata.web_search_queries:
                    logger.debug(f"検索クエリ: {response.grounding_metadata.web_search_queries}")
            
            logger.info("Google Search Grounding 生成完了")
            return response_text
            
        except ImportError as e:
            logger.error(f"Google Generative AI SDKがインストールされていません: {str(e)}")
            logger.warning("通常生成にフォールバック")
            return self.ai_client.generate(prompt)
        except Exception as e:
            logger.error(f"Google Search Grounding エラー: {str(e)}", exc_info=True)
            logger.warning("通常生成にフォールバック")
            return self.ai_client.generate(prompt)
    
    def _build_company_info_prompt(self, company_name: str, use_web_search: bool = False) -> str:
        """企業情報取得用のプロンプトを構築"""
        
        # Web検索を使用する場合は詳細な指示を追加
        if use_web_search:
            search_instruction = f"""【重要】公式サイトを最優先で参照してください:
1. まず「{company_name} 公式サイト」「{company_name} 会社概要」で検索
2. 公式サイトのIR情報、会社概要、採用ページから正確な情報を取得
3. 公式サイトが見つからない場合は、Wikipedia等の信頼できる情報源を参照
4. 古い情報ではなく、最新の情報を優先してください

"""
        else:
            search_instruction = ""
        
        return f"""以下の企業の最新情報を調査し、JSON形式で返してください。

企業名: {company_name}

{search_instruction}必須フィールド:
- company_name: 会社名（正式な表記）
- legal_name: 正式名称（登記上の名称）
- representative: 代表者名（代表取締役社長等のフルネーム）
- established_date: 設立年月日（YYYY-MM-DD形式、不明な場合はYYYY-MM-01やYYYY-01-01）
- capital: 資本金(数値、単位は円。万円や億円で表記されている場合は円に換算してください)
- employee_count: 従業員数（数値、連結・単体のうち取得できる方）
- industry: 業種（IT・通信、製造、金融、小売、サービス、建設、不動産、運輸、教育、医療・福祉、メディア、その他のいずれか）
- website: 公式ウェブサイトURL（必須）
- description: 事業内容の説明（100-200文字程度で要約）
- postal_code: 本社郵便番号（ハイフン付き7桁、例：100-0001）
- prefecture: 本社都道府県
- city: 本社市区町村
- address: 本社番地・ビル名
- phone: 代表電話番号（ハイフン付き、例：03-1234-5678）
- fax: FAX番号（ハイフン付き、不明ならnull）

出力形式の注意:
1. 必ず有効なJSON形式のみを返してください（```json ... ```のMarkdown形式でも可）
2. 説明文や追加のテキストは不要です
3. 情報が見つからないフィールドはnullを設定してください
4. 日付は必ずYYYY-MM-DD形式にしてください
5. 数値フィールド（capital, employee_count）は数値型で返してください（文字列不可）
6. 業種は上記のカテゴリから最も近いものを選択してください
7. **重要**: capitalは必ず円単位で返してください(例: 1億円 → 100000000、1000万円 → 10000000)

JSON形式例:
{{
  "company_name": "株式会社サンプル",
  "legal_name": "株式会社サンプル",
  "representative": "山田太郎",
  "established_date": "2000-04-01",
  "capital": 100000000,
  "employee_count": 500,
  "industry": "IT・通信",
  "website": "https://www.sample.co.jp",
  "description": "クラウドサービスとAIソリューションを提供する企業。主にエンタープライズ向けSaaSプロダクトを開発・販売している。",
  "postal_code": "100-0001",
  "prefecture": "東京都",
  "city": "千代田区",
  "address": "千代田1-1-1 サンプルビル",
  "phone": "03-1234-5678",
  "fax": "03-1234-5679"
}}"""
    
    def _parse_json_response(self, response_text: str) -> Dict[str, Any]:
        """AI応答からJSON部分を抽出してパース"""
        import re
        
        # ```json ... ``` パターン
        json_match = re.search(r'```json\s*\n(.*?)\n```', response_text, re.DOTALL)
        if json_match:
            json_str = json_match.group(1)
        else:
            # { ... } パターン
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
            else:
                json_str = response_text
        
        # JSONパース
        data = json.loads(json_str.strip())
        
        # データクリーニング
        return self._clean_data(data)
    
    def _clean_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """データをクリーニング(型変換、空文字列処理など)"""
        cleaned = {}
        
        for key, value in data.items():
            # 空文字列またはNoneの場合
            if value in ('', None, 'null', 'NULL', 'None'):
                cleaned[key] = None
            # 資本金の場合: 単位を判定して円に統一
            elif key == 'capital':
                cleaned[key] = self._normalize_capital(value)
            # 従業員数の場合: 数値変換
            elif key == 'employee_count' and isinstance(value, str):
                try:
                    cleaned[key] = int(value.replace(',', ''))
                except (ValueError, AttributeError):
                    cleaned[key] = None
            else:
                cleaned[key] = value
        
        return cleaned
    
    def _normalize_capital(self, value: Any) -> Optional[int]:
        """資本金の単位を判定して円に統一する
        
        AIが返す値の範囲から単位を推測:
        - 1億円以上(100,000,000以上): 既に円単位 → そのまま
        - 1万円以上1億円未満(10,000～99,999,999): 曖昧だが、一般的な企業の資本金を考慮して判定
        - 10,000未満: 万円単位と判断 → 10,000倍して円に変換
        
        Args:
            value: 資本金の値(int, float, str)
        
        Returns:
            円単位の資本金(int) または None
        """
        if value in ('', None, 'null', 'NULL', 'None'):
            return None
        
        # 数値に変換
        try:
            if isinstance(value, str):
                # カンマを除去して数値化
                capital = float(value.replace(',', ''))
            else:
                capital = float(value)
        except (ValueError, AttributeError, TypeError):
            logger.warning(f"資本金の値を数値に変換できません: {value}")
            return None
        
        # 単位を判定して円に統一
        # 10,000未満の場合は万円単位と判断(例: 1000万円 = 1000)
        if capital < 10000:
            result = int(capital * 10000)
            logger.info(f"資本金を万円単位と判定して円に変換: {capital}万円 → {result}円")
            return result
        # 10,000以上100,000未満の場合も万円単位の可能性が高い
        # (例: 5万円の企業は少ないが、5000万円の企業は多い)
        elif 10000 <= capital < 100000:
            result = int(capital * 10000)
            logger.info(f"資本金を万円単位と判定して円に変換: {capital}万円 → {result}円")
            return result
        # 100,000以上の場合は円単位と判断
        else:
            result = int(capital)
            logger.info(f"資本金を円単位と判定: {result}円")
            return result
    
    def _calculate_confidence_score(self, data: Dict[str, Any]) -> int:
        """データの信頼度スコアを計算（0-100）"""
        # 重要フィールドの定義と重み
        important_fields = {
            'company_name': 10,
            'legal_name': 8,
            'representative': 7,
            'established_date': 6,
            'capital': 5,
            'employee_count': 5,
            'industry': 6,
            'website': 7,
            'description': 5,
            'postal_code': 4,
            'prefecture': 4,
            'city': 4,
            'address': 3,
            'phone': 5,
            'fax': 2,
        }
        
        total_weight = sum(important_fields.values())
        achieved_weight = 0
        
        for field, weight in important_fields.items():
            value = data.get(field)
            if value and value not in ('', None, 'null', 'NULL', 'None'):
                achieved_weight += weight
        
        # パーセンテージ計算
        confidence = int((achieved_weight / total_weight) * 100)
        
        return confidence
    
    def _calculate_changes(self, old_data: Dict[str, Any], new_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """2つのデータセット間の変更を計算"""
        changes = []
        
        # 比較対象フィールド
        compare_fields = [
            'legal_name', 'representative', 'established_date',
            'capital', 'employee_count', 'industry', 'website',
            'description', 'postal_code', 'prefecture', 'city',
            'address', 'phone', 'fax'
        ]
        
        for field in compare_fields:
            old_value = old_data.get(field)
            new_value = new_data.get(field)
            
            # 値が異なる場合のみ変更として記録
            if old_value != new_value and new_value:
                changes.append({
                    'field': field,
                    'old_value': old_value,
                    'new_value': new_value,
                    'confidence': self._calculate_field_confidence(new_value)
                })
        
        return changes
    
    def _calculate_field_confidence(self, value: Any) -> int:
        """個別フィールドの信頼度を計算"""
        if not value:
            return 0
        
        # 文字列の長さベース（長いほど信頼度高い）
        if isinstance(value, str):
            length = len(value)
            if length > 50:
                return 95
            elif length > 20:
                return 85
            elif length > 10:
                return 75
            else:
                return 65
        
        # 数値は常に高信頼度
        elif isinstance(value, (int, float)):
            return 90
        
        return 70


# シングルトンインスタンス
_enrichment_service = None


def get_enrichment_service() -> ClientEnrichmentService:
    """
    ClientEnrichmentServiceのシングルトンインスタンスを取得
    
    Returns:
        ClientEnrichmentServiceインスタンス
    """
    global _enrichment_service
    if _enrichment_service is None:
        _enrichment_service = ClientEnrichmentService()
    return _enrichment_service
