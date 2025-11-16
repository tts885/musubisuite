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
    
    def fetch_company_info(self, company_name: str) -> Dict[str, Any]:
        """
        企業名から企業情報を取得
        
        Args:
            company_name: 企業名
            
        Returns:
            企業情報の辞書（ai_generated=True, ai_confidence_scoreを含む）
            
        Raises:
            Exception: 情報取得に失敗した場合
        """
        try:
            logger.info(f"企業情報取得開始: {company_name}")
            
            # TODO: 実際のAI実装に置き換える
            # 現在はダミーデータを返す
            result = {
                'company_name': company_name,
                'legal_name': f"{company_name}株式会社",
                'representative': '山田太郎',
                'established_date': '2000-01-01',
                'capital': 10000000,
                'employee_count': 50,
                'industry': 'it',
                'website': f'https://{company_name.lower()}.example.com',
                'description': f'{company_name}は、IT関連サービスを提供する企業です。',
                'postal_code': '100-0001',
                'prefecture': '東京都',
                'city': '千代田区',
                'address': '千代田1-1-1',
                'phone': '03-1234-5678',
                'fax': '03-1234-5679',
                'ai_generated': True,
                'ai_confidence_score': 85,
                'ai_generated_at': datetime.now().isoformat(),
                '_search_results_count': 5,
                '_search_urls': [
                    f'https://{company_name.lower()}.example.com',
                    f'https://ja.wikipedia.org/wiki/{company_name}',
                    f'https://www.bloomberg.com/{company_name}'
                ]
            }
            
            logger.info(f"企業情報取得完了: {company_name}")
            return result
            
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
            
            # TODO: 実際のAI実装に置き換える
            # 現在はダミーの変更データを返す
            changes = [
                {
                    'field': 'representative',
                    'old_value': client_data.get('representative', ''),
                    'new_value': '新代表者名',
                    'confidence': 90
                },
                {
                    'field': 'employee_count',
                    'old_value': client_data.get('employee_count', 0),
                    'new_value': 100,
                    'confidence': 85
                }
            ]
            
            # 新しいデータを構築
            new_data = client_data.copy()
            for change in changes:
                field = change.get('field')
                new_value = change.get('new_value')
                if field and new_value is not None:
                    new_data[field] = new_value
            
            new_data.update({
                'ai_generated': True,
                'ai_confidence_score': 88,
                'ai_generated_at': datetime.now().isoformat(),
            })
            
            result = {
                'changes': changes,
                'new_data': new_data,
                'confidence_score': 88,
                '_search_results_count': 5,
                '_search_urls': [
                    f'https://{company_name.lower()}.example.com',
                    f'https://ja.wikipedia.org/wiki/{company_name}'
                ]
            }
            
            logger.info(f"企業情報更新完了: {company_name}, 変更 {len(changes)} 件")
            return result
            
        except Exception as e:
            logger.error(f"企業情報更新エラー: {str(e)}", exc_info=True)
            raise Exception(f"企業情報の更新に失敗しました: {str(e)}")
    
    def _calculate_confidence(
        self,
        extracted_data: Dict[str, Any],
        search_results: List[Any]
    ) -> int:
        """
        信頼度スコアを計算
        
        Args:
            extracted_data: 抽出データ
            search_results: 検索結果のリスト
            
        Returns:
            信頼度スコア（0-100）
        """
        try:
            score = 0
            
            # 1. 情報源の信頼性（最大40点）
            source_score = 0
            for result in search_results[:3]:  # 上位3件を評価
                url = result.url.lower() if hasattr(result, 'url') else ''
                
                # 公式サイト判定（co.jp, com, jp等のドメイン）
                if any(domain in url for domain in ['.co.jp', '.com', '.jp']):
                    # Wikipedia以外の企業ドメイン
                    if 'wikipedia' not in url:
                        source_score = max(source_score, 40)
                    else:
                        source_score = max(source_score, 30)
                elif any(domain in url for domain in ['bloomberg', 'reuters', 'nikkei']):
                    source_score = max(source_score, 25)
                else:
                    source_score = max(source_score, 15)
            
            score += source_score
            
            # 2. 情報の完全性（最大30点）
            required_fields = [
                'company_name', 'legal_name', 'industry', 'website',
                'description', 'prefecture', 'city'
            ]
            important_fields = [
                'representative', 'established_date', 'capital',
                'employee_count', 'postal_code', 'address', 'phone'
            ]
            
            # 必須項目の充足率
            required_filled = sum(
                1 for field in required_fields
                if extracted_data.get(field) not in [None, '', 'null']
            )
            required_rate = required_filled / len(required_fields)
            
            # 重要項目の充足率
            important_filled = sum(
                1 for field in important_fields
                if extracted_data.get(field) not in [None, '', 'null']
            )
            important_rate = important_filled / len(important_fields)
            
            # 完全性スコア
            completeness_score = int(
                (required_rate * 20) +  # 必須項目: 最大20点
                (important_rate * 10)   # 重要項目: 最大10点
            )
            score += completeness_score
            
            # 3. 情報の一貫性（最大20点）
            # 検索結果が複数ある場合は一貫性があると判断
            if len(search_results) >= 3:
                score += 20
            elif len(search_results) >= 2:
                score += 10
            
            # 4. 情報の新鮮さ（最大10点）
            # 検索結果が取得できた時点で新鮮と判断
            if search_results:
                score += 10
            
            # スコアを0-100に正規化
            score = max(0, min(100, score))
            
            logger.debug(
                f"信頼度計算詳細: "
                f"情報源={source_score}, "
                f"完全性={completeness_score}, "
                f"合計={score}"
            )
            
            return score
            
        except Exception as e:
            logger.error(f"信頼度計算エラー: {str(e)}", exc_info=True)
            # エラー時は低めのスコアを返す
            return 30


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
