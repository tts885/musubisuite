"""
OCR Processor - 生成AIを使用したOCR処理

画像からテキストとフィールドを抽出し、座標情報と共に構造化されたデータを返します。

使用例:
    from ai_services import process_ocr
    
    # Base64画像からOCR処理
    result = process_ocr(base64_image, document_type="invoice")
    
    # 結果の取得
    fields = result["fields"]
    for field in fields:
        print(f"{field['label']}: {field['value']}")
        print(f"  位置: ({field['boundingBox']['x']}, {field['boundingBox']['y']})")
        print(f"  信頼度: {field['confidence']}")

Author: 開発チーム
Created: 2025-11-24
"""

import logging
import json
from typing import Dict, Any, Optional
from .llm_client import get_default_ai_client
from .prompts import PromptTemplates
from .exceptions import APICallError

logger = logging.getLogger(__name__)


def process_ocr(
    image_base64: str,
    document_type: str = "invoice",
    provider_id: Optional[int] = None
) -> Dict[str, Any]:
    """
    画像からOCR処理を実行し、フィールドと座標を抽出
    
    Args:
        image_base64: Base64エンコードされた画像データ
        document_type: ドキュメントタイプ (invoice, receipt, contract, form, other)
        provider_id: 使用するAIプロバイダーID（Noneの場合はデフォルト）
    
    Returns:
        OCR処理結果の辞書
        {
            "fields": [
                {
                    "id": "field-1",
                    "label": "請求書番号",
                    "value": "INV-123456",
                    "confidence": 0.95,
                    "boundingBox": {"x": 100, "y": 50, "width": 150, "height": 30}
                },
                ...
            ],
            "overallConfidence": 0.92
        }
    
    Raises:
        APICallError: AI API呼び出しに失敗
        ValueError: 不正なパラメータ
    
    Example:
        from ai_services import process_ocr
        
        result = process_ocr(base64_image, document_type="invoice")
        print(f"検出フィールド数: {len(result['fields'])}")
        print(f"全体信頼度: {result['overallConfidence']}")
    """
    try:
        # パラメータ検証
        if not image_base64:
            raise ValueError("image_base64 は必須です")
        
        valid_types = ["invoice", "receipt", "contract", "form", "other"]
        if document_type not in valid_types:
            raise ValueError(
                f"document_type は {valid_types} のいずれかを指定してください"
            )
        
        logger.info(f"OCR処理開始: document_type={document_type}, image_size={len(image_base64)} bytes")
        
        # AIクライアントを取得
        if provider_id:
            from .llm_client import get_ai_client
            client = get_ai_client(provider_id=provider_id)
        else:
            client = get_default_ai_client()
        
        # プロンプト生成（マルチモーダル対応）
        prompt_data = PromptTemplates.ocr_field_extraction(
            image_base64=image_base64,
            document_type=document_type
        )
        
        # AI呼び出し（画像付き）
        logger.debug("AI生成開始（画像を含む）")
        response = client.generate_with_image(
            text_prompt=prompt_data["text"],
            image_base64=prompt_data["image_base64"],
            max_tokens=8000,  # OCRの場合は多くのフィールドがあるため増やす(Gemini 1.5 Proは最大8192)
            temperature=0.1
        )
        
        if response is None:
            raise APICallError("AI応答がNullです。プロバイダーの設定を確認してください。")
        
        logger.debug(f"AI応答受信: {len(response)} 文字")
        
        # JSON解析
        try:
            # JSONコードブロックを抽出（```json ... ``` で囲まれている場合）
            if "```json" in response:
                json_start = response.find("```json") + 7
                json_end = response.find("```", json_start)
                json_str = response[json_start:json_end].strip()
            elif "```" in response:
                json_start = response.find("```") + 3
                json_end = response.find("```", json_start)
                json_str = response[json_start:json_end].strip()
            else:
                json_str = response.strip()
            
            result = json.loads(json_str)
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON解析エラー: {str(e)}")
            logger.error(f"AI応答: {response[:500]}")
            raise APICallError(f"AIの応答をJSON形式で解析できませんでした: {str(e)}")
        
        # 結果の検証と整形
        if "fields" not in result:
            raise APICallError("AI応答に 'fields' フィールドがありません")
        
        # 各フィールドにIDを追加
        for i, field in enumerate(result["fields"], 1):
            if "id" not in field:
                field["id"] = f"field-{i}"
            
            # 必須フィールドの検証
            required_fields = ["label", "value", "confidence", "boundingBox"]
            for req_field in required_fields:
                if req_field not in field:
                    logger.warning(
                        f"フィールド {field.get('id', i)} に {req_field} がありません"
                    )
            
            # boundingBoxの検証
            if "boundingBox" in field:
                bbox = field["boundingBox"]
                required_bbox = ["x", "y", "width", "height"]
                for bbox_field in required_bbox:
                    if bbox_field not in bbox:
                        logger.warning(
                            f"フィールド {field['id']} の boundingBox に "
                            f"{bbox_field} がありません"
                        )
        
        # overallConfidenceがない場合は計算
        if "overallConfidence" not in result:
            if result["fields"]:
                avg_confidence = sum(
                    f.get("confidence", 0) for f in result["fields"]
                ) / len(result["fields"])
                result["overallConfidence"] = round(avg_confidence, 2)
            else:
                result["overallConfidence"] = 0.0
        
        logger.info(
            f"OCR処理完了: {len(result['fields'])} フィールド検出, "
            f"全体信頼度={result['overallConfidence']}"
        )
        
        return result
    
    except Exception as e:
        if isinstance(e, (APICallError, ValueError)):
            raise
        error_msg = f"OCR処理エラー: {type(e).__name__}: {str(e)}"
        logger.error(error_msg, exc_info=True)
        raise APICallError(error_msg) from e


def validate_ocr_result(result: Dict[str, Any]) -> bool:
    """
    OCR結果の妥当性を検証
    
    Args:
        result: OCR処理結果
    
    Returns:
        妥当性判定結果
    """
    try:
        # 必須フィールドの存在チェック
        if "fields" not in result:
            logger.warning("OCR結果に 'fields' がありません")
            return False
        
        if not isinstance(result["fields"], list):
            logger.warning("'fields' がリスト形式ではありません")
            return False
        
        # フィールド数チェック
        if len(result["fields"]) == 0:
            logger.warning("フィールドが1つも検出されませんでした")
            return False
        
        # 各フィールドの検証
        for field in result["fields"]:
            # 信頼度チェック
            confidence = field.get("confidence", 0)
            if not isinstance(confidence, (int, float)) or confidence < 0 or confidence > 1:
                logger.warning(f"不正な信頼度: {confidence}")
                return False
            
            # 座標チェック
            if "boundingBox" in field:
                bbox = field["boundingBox"]
                for key in ["x", "y", "width", "height"]:
                    if key not in bbox:
                        logger.warning(f"boundingBox に {key} がありません")
                        return False
                    if not isinstance(bbox[key], (int, float)) or bbox[key] < 0:
                        logger.warning(f"不正な座標値: {key}={bbox[key]}")
                        return False
        
        logger.info("OCR結果の検証に成功")
        return True
    
    except Exception as e:
        logger.error(f"OCR結果の検証中にエラー: {str(e)}")
        return False
