import type { DataverseConnection, TableSchema } from '@/types/dataverse';

/**
 * Power Apps環境でのDataverse操作サービスクラス
 * 
 * Power Apps Code Apps環境で動作し、Power Appsのコンテキスト認証を使用して
 * Dataverse APIを呼び出すサービスです。テーブル作成やカラム追加などの
 * メタデータ操作を提供します。
 * 
 * @class PowerAppsDataverseService
 * 
 * @remarks
 * - このクラスはPower Apps Code Apps環境での使用を想定しています
 * - 認証はPower Appsのコンテキストから自動的に取得されます
 * - 本番環境ではCORS設定とOAuth認証が必要です
 * 
 * @example
 * ```typescript
 * const connection = {
 *   baseUrl: 'https://org.crm.dynamics.com',
 *   apiVersion: '9.2'
 * };
 * 
 * const service = new PowerAppsDataverseService(connection);
 * 
 * // テーブル作成
 * const tableId = await service.createTable(tableSchema);
 * ```
 */
export class PowerAppsDataverseService {
  private connection: DataverseConnection;

  /**
   * PowerAppsDataverseServiceのインスタンスを作成する
   * 
   * @param {DataverseConnection} connection - Dataverse接続情報
   * @param {string} connection.baseUrl - DataverseのベースURL
   * @param {string} connection.apiVersion - APIバージョン(例: '9.2')
   */
  constructor(connection: DataverseConnection) {
    this.connection = connection;
  }

  /**
   * Power Apps Code環境でDataverseテーブルを作成する
   * 
   * テーブル定義スキーマに基づいて新しいカスタムテーブルを作成し、
   * 定義されたカラムを順次追加します。
   * 
   * @param {TableSchema} schema - テーブル定義スキーマ
   * @param {string} schema.logicalName - テーブルの論理名
   * @param {string} schema.displayName - テーブルの表示名
   * @param {string} schema.pluralName - テーブルの複数形表示名
   * @param {string} [schema.description] - テーブルの説明
   * @param {ColumnSchema[]} schema.columns - カラム定義の配列
   * 
   * @returns {Promise<string>} 作成されたテーブルのエンティティID
   * 
   * @throws {Error} 認証エラー(401)の場合
   * @throws {Error} 権限エラー(403)の場合
   * @throws {Error} リクエストエラー(400)の場合
   * @throws {Error} その他のAPIエラーの場合
   * 
   * @example
   * ```typescript
   * try {
   *   const tableId = await service.createTable({
   *     logicalName: 'cr123_project',
   *     displayName: 'プロジェクト',
   *     pluralName: 'プロジェクト',
   *     description: '案件管理用テーブル',
   *     columns: [
   *       {
   *         logicalName: 'cr123_name',
   *         displayName: 'プロジェクト名',
   *         type: 'string',
   *         required: true
   *       }
   *     ]
   *   });
   *   console.log('テーブル作成完了:', tableId);
   * } catch (error) {
   *   console.error('テーブル作成失敗:', error);
   * }
   * ```
   * 
   * @remarks
   * - 本番環境では適切な認証が必要です
   * - カラムは順次作成されるため、多数のカラムがある場合は時間がかかります
   * - エラー発生時、テーブルは作成されていますが一部カラムが欠落する可能性があります
   */
  async createTable(schema: TableSchema): Promise<string> {
    try {
      // Power Apps環境での認証付きリクエスト
      const response = await this.makeAuthenticatedRequest(
        'POST',
        'EntityDefinitions',
        this.buildEntityDefinition(schema)
      );

      if (!response.ok) {
        const errorText = await response.text();

        
        // よくあるエラーのハンドリング
        if (response.status === 401) {
          throw new Error('認証エラー: Dataverseにアクセスする権限がありません');
        } else if (response.status === 403) {
          throw new Error('権限エラー: テーブルを作成する権限がありません');
        } else if (response.status === 400) {
          throw new Error('リクエストエラー: スキーマの形式が正しくありません');
        } else {
          throw new Error(`APIエラー (${response.status}): ${errorText}`);
        }
      }

      const entityUrl = response.headers.get('OData-EntityId');
      const entityId = entityUrl?.match(/\(([^)]+)\)/)?.[1] || '';

      // カラムを順次作成
      for (const column of schema.columns) {
        await this.createColumn(schema.logicalName, column);
      }

      return entityId;
    } catch (error) {

      throw error;
    }
  }

  /**
   * 認証付きDataverse APIリクエストを送信する
   * 
   * Power Appsのコンテキスト認証を使用してDataverse Web APIにリクエストを送信します。
   * CORS対応のヘッダーを自動的に設定します。
   * 
   * @private
   * @param {string} method - HTTPメソッド('GET', 'POST', 'PATCH', 'DELETE'等)
   * @param {string} endpoint - APIエンドポイント(例: 'EntityDefinitions')
   * @param {any} [body] - リクエストボディ(GETメソッドでは不要)
   * 
   * @returns {Promise<Response>} Fetchレスポンスオブジェクト
   * 
   * @example
   * ```typescript
   * // 内部使用例
   * const response = await this.makeAuthenticatedRequest(
   *   'POST',
   *   'EntityDefinitions',
   *   entityDefinitionObject
   * );
   * ```
   * 
   * @remarks
   * - 本番環境では適切な認証トークン(Bearer token等)を使用する必要があります
   * - Power Apps環境外では認証が機能しない可能性があります
   * - CORS設定は開発環境用であり、本番環境では適切に設定してください
   */
  private async makeAuthenticatedRequest(
    method: string,
    endpoint: string,
    body?: any
  ): Promise<Response> {
    const url = `${this.connection.baseUrl}/api/data/v${this.connection.apiVersion}/${endpoint}`;
    
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'OData-MaxVersion': '4.0',
      'OData-Version': '4.0',
      // CORS対応
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, OData-MaxVersion, OData-Version'
    };

    if (method !== 'GET') {
      headers['Content-Type'] = 'application/json';
    }

    // Power Apps環境での認証
    // 注意: 実際の環境では適切な認証方法を使用する必要があります
    // 例: Bearer token, OAuth, またはPower Appsのコンテキスト認証

    const options: RequestInit = {
      method,
      headers,
      mode: 'cors',
      credentials: 'include'
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    return fetch(url, options);
  }

  /**
   * 既存のテーブルに新しいカラムを追加する
   * 
   * 指定されたテーブルにカラム定義に基づいて新しいカラムを作成します。
   * 
   * @private
   * @param {string} entityLogicalName - カラムを追加するテーブルの論理名
   * @param {any} column - カラム定義オブジェクト
   * 
   * @returns {Promise<void>}
   * 
   * @throws {Error} APIリクエストが失敗した場合
   * 
   * @remarks
   * - このメソッドはcreateTable内部で使用されます
   * - カラム作成には管理者権限が必要です
   */
  private async createColumn(entityLogicalName: string, column: any): Promise<void> {
    const attributeDefinition = this.createAttributeDefinition(column);
    
    const response = await this.makeAuthenticatedRequest(
      'POST',
      `EntityDefinitions(LogicalName='${entityLogicalName}')/Attributes`,
      attributeDefinition
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`カラム作成エラー: ${errorText}`);
    }
  }

  /**
   * テーブルスキーマからDataverseエンティティ定義オブジェクトを構築する
   * 
   * テーブルスキーマからDataverse Web APIで要求される
   * エンティティメタデータオブジェクトを構築します。
   * 
   * @private
   * @param {TableSchema} schema - テーブル定義スキーマ
   * @returns {any} Dataverseエンティティ定義オブジェクト
   * 
   * @remarks
   * - 表示名は日本語(言語コード: 1041)で設定されます
   * - テーブルはユーザー所有(UserOwned)として作成されます
   * - 活動追跡とノート機能が有効化されます
   */
  private buildEntityDefinition(schema: TableSchema) {
    return {
      "@odata.type": "Microsoft.Dynamics.CRM.EntityMetadata",
      "SchemaName": schema.logicalName,
      "DisplayName": {
        "@odata.type": "Microsoft.Dynamics.CRM.Label",
        "LocalizedLabels": [
          {
            "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
            "Label": schema.displayName,
            "LanguageCode": 1041
          }
        ]
      },
      "DisplayCollectionName": {
        "@odata.type": "Microsoft.Dynamics.CRM.Label",
        "LocalizedLabels": [
          {
            "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
            "Label": schema.pluralName,
            "LanguageCode": 1041
          }
        ]
      },
      "Description": {
        "@odata.type": "Microsoft.Dynamics.CRM.Label",
        "LocalizedLabels": [
          {
            "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
            "Label": schema.description || "",
            "LanguageCode": 1041
          }
        ]
      },
      "HasActivities": false,
      "HasNotes": true,
      "IsActivity": false,
      "OwnershipType": "UserOwned"
    };
  }

  /**
   * カラム定義からDataverse属性定義オブジェクトを作成する
   * 
   * カラムタイプに応じて、Dataverse Web APIで要求される
   * 適切な属性メタデータオブジェクトを構築します。
   * 
   * @private
   * @param {any} column - カラム定義オブジェクト
   * @param {string} column.logicalName - カラムの論理名
   * @param {string} column.displayName - カラムの表示名
   * @param {string} column.type - カラムのタイプ('string', 'number', 'date'等)
   * @param {boolean} [column.required] - 必須フィールドかどうか
   * @param {number} [column.maxLength] - 文字列型の最大長(デフォルト: 100)
   * 
   * @returns {any} Dataverse属性定義オブジェクト
   * 
   * @remarks
   * - 現在は'string'タイプのみ実装されています(簡略化版)
   * - 完全版ではすべてのデータ型をサポートする必要があります
   * - 表示名は日本語(言語コード: 1041)で設定されます
   */
  private createAttributeDefinition(column: any): any {
    const baseAttribute = {
      "SchemaName": column.logicalName,
      "DisplayName": {
        "@odata.type": "Microsoft.Dynamics.CRM.Label",
        "LocalizedLabels": [
          {
            "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
            "Label": column.displayName,
            "LanguageCode": 1041
          }
        ]
      },
      "RequiredLevel": {
        "Value": column.required ? "ApplicationRequired" : "None"
      }
    };

    // 型別の定義を返す（簡略化）
    switch (column.type) {
      case 'string':
        return {
          ...baseAttribute,
          "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
          "AttributeType": "String",
          "MaxLength": column.maxLength || 100
        };
      default:
        return baseAttribute;
    }
  }
}
