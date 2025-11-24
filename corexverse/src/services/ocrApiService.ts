/**
 * OCR API Service
 * 
 * バックエンドのOCR API（生成AI使用）と連携するサービス
 * 
 * @module ocrApiService
 */

import { logger } from '@/lib/logger';

/**
 * OCR API レスポンス型
 */
interface OcrApiResponse {
  success: boolean;
  data?: {
    fields: Array<{
      id: string;
      label: string;
      value: string;
      confidence: number;
      boundingBox: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
    }>;
    overallConfidence: number;
  };
  message?: string;
  error?: string;
}

/**
 * OCR処理結果型（簡易版）
 */
interface OcrProcessResult {
  fields: Array<{
    id: string;
    label: string;
    value: string;
    confidence: number;
    boundingBox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    isEdited: boolean;
  }>;
  overallConfidence: number;
}

/**
 * OCR API設定
 */
const OCR_API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  endpoints: {
    process: '/api/ocr/process/',
    test: '/api/ocr/test/',
  },
};

/**
 * OCR API Service Class
 */
export class OcrApiService {
  /**
   * ローカルストレージからアクセストークンを取得
   * 
   * @private
   * @returns アクセストークン(存在しない場合はnull)
   */
  private getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  /**
   * 開発環境かどうかを判定
   * 
   * @private
   * @returns 開発環境ならtrue
   */
  private isDevelopment(): boolean {
    return import.meta.env.DEV || import.meta.env.MODE === 'development';
  }

  /**
   * 画像からOCR処理を実行
   * 
   * @param imageBase64 - Base64エンコードされた画像データ
   * @param documentType - ドキュメントタイプ (invoice, receipt, contract, form, other)
   * @param providerId - AIプロバイダーID（オプション）
   * @returns OCR処理結果
   */
  async processDocument(
    imageBase64: string,
    documentType: string = 'invoice',
    providerId?: number
  ): Promise<OcrProcessResult> {
    try {
      logger.info('OCR API呼び出し開始', {
        documentType,
        providerId,
        imageDataLength: imageBase64.length,
      });

      // Data URLプレフィックスを除去
      let base64Data = imageBase64;
      if (imageBase64.startsWith('data:')) {
        base64Data = imageBase64.split(',')[1];
      }

      // アクセストークンを取得
      const accessToken = this.getAccessToken();
      
      // 開発環境でトークンがない場合はテストエンドポイントを使用
      if (!accessToken && this.isDevelopment()) {
        logger.warn('認証トークンがないため、テストエンドポイントを使用します（開発環境のみ）');
        return await this.testOcr(imageBase64, documentType);
      }
      
      if (!accessToken) {
        throw new Error('認証トークンが見つかりません。ログインしてください。');
      }

      // APIリクエスト
      const response = await fetch(`${OCR_API_CONFIG.baseUrl}${OCR_API_CONFIG.endpoints.process}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          image_base64: base64Data,
          document_type: documentType,
          provider_id: providerId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('OCR API エラーレスポンス', {
          status: response.status,
          statusText: response.statusText,
          errorText,
        });
        
        // エラー詳細を含めたメッセージ
        let errorMessage = `OCR APIエラー: ${response.status} ${response.statusText}`;
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error) {
            errorMessage += `\n詳細: ${errorJson.error}`;
          }
        } catch {
          // JSON解析失敗時はそのまま
          if (errorText && errorText.length < 500) {
            errorMessage += `\n詳細: ${errorText}`;
          }
        }
        
        throw new Error(errorMessage);
      }

      const result: OcrApiResponse = await response.json();

      if (!result.success || !result.data) {
        const errorMsg = result.error || 'OCR処理に失敗しました';
        logger.error('OCR API処理失敗', { result });
        throw new Error(errorMsg);
      }

      logger.info('OCR API処理成功', {
        fieldCount: result.data.fields.length,
        overallConfidence: result.data.overallConfidence,
      });

      // OcrResult型に変換（isEditedプロパティを追加）
      return {
        fields: result.data.fields.map(field => ({
          ...field,
          isEdited: false
        })),
        overallConfidence: result.data.overallConfidence,
      };
    } catch (error) {
      logger.error('OCR API呼び出しエラー', error);
      throw error;
    }
  }

  /**
   * テスト用OCR処理（認証不要）
   * 
   * 開発環境専用。本番環境では使用しないこと。
   * 
   * @param imageBase64 - Base64エンコードされた画像データ
   * @param documentType - ドキュメントタイプ
   * @returns OCR処理結果
   */
  async testOcr(
    imageBase64: string,
    documentType: string = 'invoice'
  ): Promise<OcrProcessResult> {
    try {
      logger.info('テストOCR API呼び出し開始（認証不要）', {
        documentType,
        imageDataLength: imageBase64.length,
        isDev: this.isDevelopment()
      });

      // Data URLプレフィックスを除去
      let base64Data = imageBase64;
      if (imageBase64.startsWith('data:')) {
        base64Data = imageBase64.split(',')[1];
      }

      // APIリクエスト（認証ヘッダーなし）
      const response = await fetch(`${OCR_API_CONFIG.baseUrl}${OCR_API_CONFIG.endpoints.test}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_base64: base64Data,
          document_type: documentType,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('テストOCR API エラーレスポンス', {
          status: response.status,
          statusText: response.statusText,
          errorText,
        });
        
        // エラー詳細を含めたメッセージ
        let errorMessage = `テストOCR APIエラー: ${response.status} ${response.statusText}`;
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error) {
            errorMessage += `\n詳細: ${errorJson.error}`;
          }
        } catch {
          // JSON解析失敗時はそのまま
          if (errorText && errorText.length < 500) {
            errorMessage += `\n詳細: ${errorText}`;
          }
        }
        
        throw new Error(errorMessage);
      }

      const result: OcrApiResponse = await response.json();

      if (!result.success || !result.data) {
        const errorMsg = result.error || 'テストOCR処理に失敗しました';
        logger.error('テストOCR API処理失敗', { result });
        throw new Error(errorMsg);
      }

      logger.info('テストOCR API処理成功', {
        fieldCount: result.data.fields.length,
        overallConfidence: result.data.overallConfidence,
      });

      // OcrProcessResult型に変換（isEditedプロパティを追加）
      return {
        fields: result.data.fields.map(field => ({
          ...field,
          isEdited: false
        })),
        overallConfidence: result.data.overallConfidence,
      };
    } catch (error) {
      logger.error('テストOCR API呼び出しエラー', error);
      throw error;
    }
  }

  /**
   * ファイルをBase64に変換してOCR処理
   * 
   * @param file - 処理する画像ファイル
   * @param documentType - ドキュメントタイプ
   * @param providerId - AIプロバイダーID（オプション）
   * @returns OCR処理結果
   */
  async processFile(
    file: File,
    documentType: string = 'invoice',
    providerId?: number
  ): Promise<OcrProcessResult> {
    try {
      // ファイルをBase64に変換
      const base64 = await this.fileToBase64(file);
      
      // OCR処理を実行
      return await this.processDocument(base64, documentType, providerId);
    } catch (error) {
      logger.error('ファイルOCR処理エラー', error);
      throw error;
    }
  }

  /**
   * ファイルをBase64文字列に変換
   * 
   * @param file - 変換するファイル
   * @returns Base64文字列（Data URLプレフィックス付き）
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        try {
          const result = reader.result as string;
          
          if (!result) {
            throw new Error('ファイルの読み込みに失敗しました');
          }
          
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = (error) => {
        logger.error('FileReader エラー', error);
        reject(new Error('ファイルの読み込み中にエラーが発生しました'));
      };
      
      reader.readAsDataURL(file);
    });
  }
}

/**
 * シングルトンインスタンス
 */
const ocrApiService = new OcrApiService();

export default ocrApiService;
