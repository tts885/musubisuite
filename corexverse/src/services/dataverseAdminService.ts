/**
 * Dataverse管理サービスクラス
 * 
 * Power Apps SDK経由でDataverse環境に接続し、接続テストを実行します。
 * 
 * @class DataverseAdminService
 * 
 * @remarks
 * - Power Apps SDK (@microsoft/power-apps)を使用
 * - PAC CLIで環境に接続している必要があります
 * - `pac code add-data-source`でテーブルを追加することで、生成されたサービスを使用可能
 * 
 * @example
 * ```typescript
 * const connection = {
 *   environmentUrl: 'https://org.crm.dynamics.com'
 * };
 * 
 * const service = new DataverseAdminService(connection);
 * 
 * // 接続テスト
 * const result = await service.testConnection();
 * if (result.success) {
 *   console.log('接続成功:', result.details);
 * }
 * ```
 */

import type { DataverseConnection } from '@/types/dataverse';
import { testDataverseConnection, getPowerAppsContext } from './dataverseService';
import { logger } from '@/lib/logger';

export class DataverseAdminService {
  private environmentUrl: string;

  /**
   * DataverseAdminServiceのインスタンスを作成する
   * 
   * @param {DataverseConnection} connection - Dataverse接続情報
   * @param {string} connection.environmentUrl - DataverseのベースURL
   */
  constructor(connection: DataverseConnection) {
    this.environmentUrl = connection.baseUrl || connection.environmentUrl;
  }

  /**
   * Dataverse環境への接続をテストする
   * 
   * Power Apps SDKのコンテキストを使用して接続状態を確認します。
   * 
   * @returns {Promise<{ success: boolean; error?: string; details?: any }>} 接続テスト結果
   * @returns {boolean} success - 接続が成功した場合true
   * @returns {string} [error] - エラーメッセージ(失敗時)
   * @returns {any} [details] - 詳細情報
   * 
   * @example
   * ```typescript
   * const result = await service.testConnection();
   * 
   * if (result.success) {
   *   console.log('接続成功');
   *   console.log('環境ID:', result.details?.environmentId);
   *   console.log('組織名:', result.details?.organizationName);
   * } else {
   *   console.error('接続失敗:', result.error);
   * }
   * ```
   * 
   * @remarks
   * - Power Apps環境で実行される必要があります
   * - PAC CLIで環境に接続していることを確認してください
   * - `pac code run`でアプリを起動している必要があります
   */
  async testConnection(): Promise<{ success: boolean; error?: string; details?: any }> {
    try {
      logger.debug('🧪 Dataverse接続テストを開始:', this.environmentUrl);
      
      // Power Apps コンテキストを取得
      const contextResult = await getPowerAppsContext();
      
      if (!contextResult.success) {
        return {
          success: false,
          error: 'Power Apps環境に接続されていません。pac code runで起動してください。',
          details: contextResult
        };
      }
      
      logger.debug('🧪 Power Appsコンテキスト:', contextResult);
      
      // 接続テストを実行
      const result = await testDataverseConnection({
        environmentUrl: this.environmentUrl
      });
      
      logger.debug('🧪 接続テスト結果:', result);
      
      return {
        success: result.success,
        error: result.success ? undefined : result.message,
        details: result.details
      };
    } catch (error) {
      console.error('🧪 接続テストエラー:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error
      };
    }
  }

  /**
   * Dataverse環境内のテーブル一覧を取得する
   * 
   * @returns {Promise<any[]>} テーブル一覧
   * 
   * @remarks
   * この機能を使用するには、`pac code add-data-source`で
   * テーブルをデータソースとして追加する必要があります。
   * 追加されたテーブルは`/generated/services/`フォルダに
   * サービスファイルとして自動生成されます。
   * 
   * @example
   * ```bash
   * # テーブルをデータソースとして追加
   * pac code add-data-source -a dataverse -t account
   * 
   * # 生成されたサービスを使用
   * import { AccountsService } from './generated/services/AccountsService';
   * 
   * const accounts = await AccountsService.getAll();
   * ```
   */
  async getTables(): Promise<any[]> {
    logger.warn('⚠️ getTables: この機能を使用するには、pac code add-data-sourceでテーブルを追加してください');
    return [];
  }

  /**
   * テーブルスキーマを取得する
   * 
   * @param logicalName テーブルの論理名
   * @returns テーブルスキーマ
   * 
   * @remarks
   * Power Apps SDKを使用する場合、スキーマ情報は生成された
   * モデルファイル(`/generated/models/`)から取得できます。
   */
  async getTableSchema(logicalName: string): Promise<any> {
    logger.warn(`⚠️ getTableSchema(${logicalName}): この機能を使用するには、pac code add-data-sourceでテーブルを追加してください`);
    return null;
  }

  /**
   * レコードを取得する
   * 
   * @param entitySetName エンティティセット名
   * @param options クエリオプション
   * @returns レコード一覧
   * 
   * @remarks
   * Power Apps SDKを使用する場合、レコード取得は生成された
   * サービスファイルの`getAll()`メソッドを使用します。
   * 
   * @example
   * ```typescript
   * import { AccountsService } from './generated/services/AccountsService';
   * 
   * const accounts = await AccountsService.getAll({
   *   select: ['name', 'accountnumber'],
   *   filter: "address1_country eq 'USA'",
   *   orderBy: ['name asc'],
   *   top: 50
   * });
   * ```
   */
  async getRecords(entitySetName: string, _options?: any): Promise<any[]> {
    logger.warn(`⚠️ getRecords(${entitySetName}): この機能を使用するには、pac code add-data-sourceでテーブルを追加し、生成されたサービスを使用してください`);
    return [];
  }
}
