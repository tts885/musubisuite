"""
Prompt Templates

AI機能で使用するプロンプトテンプレートを管理します。

Author: 開発チーム
Created: 2025-11-16
"""

from typing import Dict, Any, List


class PromptTemplates:
    """プロンプトテンプレート集"""
    
    @staticmethod
    def client_info_extraction(company_name: str, search_results: List[Dict[str, Any]]) -> str:
        """
        クライアント情報抽出用プロンプト
        
        Args:
            company_name: 企業名
            search_results: 検索結果のリスト
            
        Returns:
            プロンプト文字列
        """
        # 検索結果を整形
        search_context = "\n\n".join([
            f"【情報源 {i+1}】\n"
            f"タイトル: {result.get('title', '')}\n"
            f"URL: {result.get('url', '')}\n"
            f"内容: {result.get('snippet', '')}"
            for i, result in enumerate(search_results)
        ])
        
        prompt = f"""あなたは企業情報の抽出と構造化を専門とするAIアシスタントです。

以下の検索結果から「{company_name}」の企業情報を抽出し、JSON形式で出力してください。

# 検索結果

{search_context}

# 抽出する情報

以下の項目について、検索結果から情報を抽出してください。情報が見つからない場合はnullを設定してください。

1. company_name: 会社名（通称）
2. legal_name: 正式名称（株式会社を含む完全な法人名）
3. representative: 代表者名（代表取締役など）
4. established_date: 設立年月日（YYYY-MM-DD形式）
5. capital: 資本金（数値のみ、単位は円）
6. employee_count: 従業員数（数値のみ）
7. industry: 業種（以下から最も適切なものを選択: it, manufacturing, finance, retail, service, construction, real_estate, transportation, education, healthcare, media, other）
8. website: 公式ウェブサイトURL
9. description: 事業内容（200文字程度の簡潔な説明）
10. postal_code: 郵便番号（ハイフン付き、例：100-0001）
11. prefecture: 都道府県
12. city: 市区町村
13. address: 番地・ビル名
14. phone: 代表電話番号
15. fax: FAX番号

# 出力形式

必ず以下のJSON形式で出力してください。他のテキストは含めないでください。

{{
  "company_name": "企業名",
  "legal_name": "正式名称",
  "representative": "代表者名",
  "established_date": "YYYY-MM-DD",
  "capital": 数値,
  "employee_count": 数値,
  "industry": "業種コード",
  "website": "https://...",
  "description": "事業内容",
  "postal_code": "郵便番号",
  "prefecture": "都道府県",
  "city": "市区町村",
  "address": "番地・ビル名",
  "phone": "電話番号",
  "fax": "FAX番号"
}}

# 注意事項

- 検索結果に基づいて正確に情報を抽出してください
- 推測や想像で情報を補完しないでください
- 情報が見つからない項目はnullを設定してください
- 数値項目（capital, employee_count）は数値型で出力してください
- 日付項目（established_date）はYYYY-MM-DD形式の文字列で出力してください
- 出力はJSON形式のみとし、説明文は含めないでください
"""
        return prompt
    
    @staticmethod
    def client_info_update(company_name: str, current_data: Dict[str, Any], search_results: List[Dict[str, Any]]) -> str:
        """
        クライアント情報更新用プロンプト
        
        Args:
            company_name: 企業名
            current_data: 現在のクライアント情報
            search_results: 検索結果のリスト
            
        Returns:
            プロンプト文字列
        """
        # 検索結果を整形
        search_context = "\n\n".join([
            f"【最新情報 {i+1}】\n"
            f"タイトル: {result.get('title', '')}\n"
            f"URL: {result.get('url', '')}\n"
            f"内容: {result.get('snippet', '')}"
            for i, result in enumerate(search_results)
        ])
        
        # 現在のデータを整形
        current_info = "\n".join([
            f"{key}: {value}" for key, value in current_data.items()
            if value is not None and key not in ['id', 'created_at', 'updated_at']
        ])
        
        prompt = f"""あなたは企業情報の更新と差分検出を専門とするAIアシスタントです。

「{company_name}」の情報を最新の検索結果と比較し、変更がある項目のみを抽出してください。

# 現在の情報

{current_info}

# 最新の検索結果

{search_context}

# タスク

1. 検索結果から最新の企業情報を抽出してください
2. 現在の情報と比較し、変更がある項目のみを特定してください
3. 変更項目について、旧値と新値を出力してください

# 出力形式

以下のJSON形式で、変更がある項目のみを出力してください。

{{
  "changes": [
    {{
      "field": "フィールド名",
      "old_value": "旧値",
      "new_value": "新値",
      "confidence": 信頼度（0-100の整数）
    }}
  ]
}}

# 注意事項

- 変更がない場合は空の配列を返してください
- 検索結果に基づいて正確に判定してください
- 信頼度は検索結果の信頼性に基づいて設定してください
- 些細な表記ゆれ（株式会社の位置など）は変更として扱わないでください
- 出力はJSON形式のみとし、説明文は含めないでください
"""
        return prompt
    
    @staticmethod
    def confidence_calculation(extracted_data: Dict[str, Any], search_results: List[Dict[str, Any]]) -> str:
        """
        信頼度スコア計算用プロンプト
        
        Args:
            extracted_data: 抽出したデータ
            search_results: 検索結果のリスト
            
        Returns:
            プロンプト文字列
        """
        prompt = f"""あなたは情報の信頼性を評価する専門家です。

抽出された企業情報の信頼度を0-100のスコアで評価してください。

# 抽出データ

{extracted_data}

# 検索結果の数

{len(search_results)}件

# 評価基準

以下の基準でスコアを算出してください：

1. 情報源の信頼性（40点）
   - 公式サイトから: 40点
   - Wikipedia/企業DB: 30点
   - ニュース記事: 25点
   - その他: 15点

2. 情報の完全性（30点）
   - 全項目埋まっている: 30点
   - 主要項目のみ: 20点
   - 一部のみ: 10点

3. 情報の一貫性（20点）
   - 複数ソースで一致: 20点
   - 一部一致: 10点
   - 矛盾あり: 0点

4. 情報の新鮮さ（10点）
   - 最新情報: 10点
   - やや古い: 5点
   - 不明: 0点

# 出力形式

{{
  "confidence_score": スコア（0-100の整数）,
  "reason": "評価理由（50文字程度）"
}}
"""
        return prompt
    
    @staticmethod
    def ocr_field_extraction(image_base64: str, document_type: str = "invoice") -> dict:
        """
        OCRフィールド抽出用プロンプト（マルチモーダル対応）
        
        Args:
            image_base64: Base64エンコードされた画像データ
            document_type: ドキュメントタイプ (invoice, receipt, contract等)
            
        Returns:
            プロンプト辞書（textとimageを含む）
        """
        document_types_ja = {
            "invoice": "請求書",
            "receipt": "領収書",
            "contract": "契約書",
            "form": "申込書",
            "other": "その他の文書"
        }
        
        doc_type_name = document_types_ja.get(document_type, "文書")
        
        text_prompt = f"""あなたはOCR(光学文字認識)の専門家です。提供された画像から{doc_type_name}の重要なフィールドを抽出し、構造化されたJSON形式で出力してください。

# タスク

1. 画像内のテキストを正確に認識してください
2. 重要なフィールド(項目名と値のペア)を特定してください
3. 各フィールドの画像内の位置座標(x, y, width, height)をピクセル単位で検出してください
4. 各フィールドの認識信頼度を評価してください

# 出力形式

以下のJSON形式で出力してください。他のテキストや説明は含めないでください。

{{
  "fields": [
    {{
      "label": "フィールド名(日本語)",
      "value": "認識したテキスト",
      "confidence": 信頼度(0.0-1.0の小数),
      "boundingBox": {{
        "x": X座標(ピクセル、画像左上が原点),
        "y": Y座標(ピクセル、画像左上が原点),
        "width": 幅(ピクセル),
        "height": 高さ(ピクセル)
      }}
    }}
  ],
  "overallConfidence": 全体の信頼度(0.0-1.0の小数)
}}

# 注意事項

- label: 「請求書番号」「発行日」「宛先会社名」「発行元会社名」「合計金額」「請求金額」「小計」など、わかりやすい日本語のフィールド名を使用
- value: 画像内で認識したテキストを正確に記録（スペースや改行も保持）
- confidence: テキストの明瞭さ、フォントの判読性、コントラストなどから総合的に判断
- boundingBox: 実際のテキスト位置を正確に検出（画像の左上を(0,0)とするピクセル座標系）
- overallConfidence: 全フィールドの平均信頼度
- 金額フィールドは数値と通貨記号(¥、円など)を含めて抽出
- 日付フィールドは元の表記形式を保持(例: 2024年7月15日、2024-07-15など)
- 表形式のデータも正確に抽出してください
- 出力は必ずJSON形式のみとし、```json```などのマークダウン記法や説明文は含めないでください
"""
        
        return {
            "text": text_prompt,
            "image_base64": image_base64
        }
