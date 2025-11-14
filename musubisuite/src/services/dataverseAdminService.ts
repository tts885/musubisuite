import type { DataverseConnection, TableSchema, ColumnSchema } from '@/types/dataverse';

/**
 * Dataverse管理サービスクラス
 * 
 * Dataverse環境への管理操作(テーブル作成、カラム追加、レコード操作等)を提供します。
 * Web API経由でDataverseのメタデータおよびデータにアクセスします。
 * 
 * @class DataverseAdminService
 * 
 * @remarks
 * - このクラスはDataverse Web API v9.2以降をサポートします
 * - 認証はPower Apps環境のコンテキストから自動取得されます
 * - CORSエラーが発生する場合、Dataverse環境のCORS設定を確認してください
 * 
 * @example
 * ```typescript
 * const connection = {
 *   baseUrl: 'https://org.crm.dynamics.com',
 *   apiVersion: '9.2'
 * };
 * 
 * const service = new DataverseAdminService(connection);
 * 
 * // 接続テスト
 * const result = await service.testConnection();
 * if (result.success) {
 *   console.log('接続成功');
 * }
 * 
 * // テーブル作成
 * const tableId = await service.createTable(tableSchema);
 * ```
 */
export class DataverseAdminService {
  private baseUrl: string;
  private apiVersion: string;

  /**
   * DataverseAdminServiceのインスタンスを作成する
   * 
   * @param {DataverseConnection} connection - Dataverse接続情報
   * @param {string} connection.baseUrl - DataverseのベースURL
   * @param {string} connection.apiVersion - APIバージョン(例: '9.2')
   */
  constructor(connection: DataverseConnection) {
    this.baseUrl = connection.baseUrl;
    this.apiVersion = connection.apiVersion;
  }

  /**
   * Dataverse環境への接続をテストする
   * 
   * $metadataエンドポイントにアクセスして接続可能かどうかを確認します。
   * 接続に成功した場合はsuccess: trueを返し、失敗した場合はエラー情報を返します。
   * 
   * @returns {Promise<{ success: boolean; error?: string; details?: any }>} 接続テスト結果
   * @returns {boolean} success - 接続が成功した場合true
   * @returns {string} [error] - エラーメッセージ(失敗時)
   * @returns {any} [details] - エラー詳細情報(失敗時)
   * 
   * @example
   * ```typescript
   * const result = await service.testConnection();
   * 
   * if (result.success) {
   *   console.log('接続成功');
   * } else {
   *   console.error('接続失敗:', result.error);
   *   console.error('詳細:', result.details);
   * }
   * ```
   * 
   * @remarks
   * - CORSエラーが発生する場合、Dataverse環境のCORS設定を確認してください
   * - 認証エラーの場合、Power Apps環境で実行していることを確認してください
   */
  async testConnection(): Promise<{ success: boolean; error?: string; details?: any }> {
    try {
      console.log('🧪 接続テストを開始:', this.baseUrl);
      
      const headers = await this.getAuthHeaders();
      const testUrl = `${this.baseUrl}/api/data/v${this.apiVersion}/$metadata`;
      
      console.log('🧪 テストURL:', testUrl);
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: headers,
        credentials: 'include',
        mode: 'cors',
      });
      
      console.log('🧪 接続テスト結果:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (response.ok) {
        return { success: true };
      } else {
        return { 
          success: false, 
          error: `HTTP ${response.status}: ${response.statusText}`,
          details: { status: response.status, statusText: response.statusText }
        };
      }
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
   * API呼び出し用の認証ヘッダーを取得する
   * 
   * Dataverse Web API呼び出しに必要なヘッダーを構築します。
   * Power Apps環境で実行されている場合、認証トークンは自動的に処理されます。
   * 
   * @private
   * @returns {Promise<HeadersInit>} 認証ヘッダーオブジェクト
   * 
   * @remarks
   * - Power Apps環境外で実行する場合、認証は機能しない可能性があります
   * - ODataバージョンヘッダーは常に含まれます
   */
  private async getAuthHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'OData-MaxVersion': '4.0',
      'OData-Version': '4.0'
    };

    // Power Apps環境の場合、認証トークンを取得を試行
    try {
      // Power Apps Code Apps での認証
      // @ts-ignore - Power Apps固有のAPIの可能性
      if (typeof window !== 'undefined' && window.parent && window.parent.Xrm) {
        console.log('🔐 Power Apps環境でXrmコンテキストを検出しました');
        // Power Apps環境では認証が自動で処理される場合があります
      } else if (typeof window !== 'undefined' && (window as any).powerApps) {
        console.log('🔐 Power Apps Code Apps環境を検出しました');
        // Power Apps Code Apps環境での認証処理
      } else {
        console.log('⚠️ Power Apps環境外での実行を検出 - 認証なしで試行します');
        console.log('💡 Power Apps環境で実行することを推奨します');
      }
    } catch (authError) {
      console.warn('⚠️ 認証情報の取得に失敗:', authError);
    }

    return headers;
  }

  /**
   * Dataverseに新しいカスタムテーブルを作成する
   * 
   * テーブル定義に基づいて、カスタムテーブルとそのカラムをDataverseに作成します。
   * テーブル作成後、指定された全てのカラムを順次作成します。
   * 
   * @param {TableSchema} schema - テーブル定義スキーマ
   * @param {string} schema.logicalName - テーブルの論理名(例: 'cr123_project')
   * @param {string} schema.displayName - テーブルの表示名
   * @param {string} schema.pluralName - テーブルの複数形表示名
   * @param {string} [schema.description] - テーブルの説明
   * @param {ColumnSchema[]} schema.columns - カラム定義の配列
   * 
   * @returns {Promise<string>} 作成されたテーブルのエンティティID
   * 
   * @throws {Error} ネットワークエラーまたはCORSエラーの場合
   * @throws {Error} Dataverse APIがエラーを返した場合
   * 
   * @example
   * ```typescript
   * const tableId = await service.createTable({
   *   logicalName: 'cr123_project',
   *   displayName: 'プロジェクト',
   *   pluralName: 'プロジェクト',
   *   description: '案件管理用テーブル',
   *   columns: [
   *     {
   *       logicalName: 'cr123_name',
   *       displayName: 'プロジェクト名',
   *       type: 'string',
   *       required: true,
   *       maxLength: 200
   *     }
   *   ]
   * });
   * console.log('テーブルID:', tableId);
   * ```
   * 
   * @remarks
   * - テーブル作成には管理者権限が必要です
   * - 論理名はソリューション発行者のプレフィックスを含む必要があります
   * - カラム作成中にエラーが発生した場合、テーブルは作成されていますが一部のカラムが欠落します
   */
  async createTable(schema: TableSchema): Promise<string> {
    const entityDefinition = {
      "@odata.type": "Microsoft.Dynamics.CRM.EntityMetadata",
      "SchemaName": schema.logicalName,
      "DisplayName": {
        "@odata.type": "Microsoft.Dynamics.CRM.Label",
        "LocalizedLabels": [
          {
            "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
            "Label": schema.displayName,
            "LanguageCode": 1041 // 日本語
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
      "OwnershipType": "UserOwned",
      "PrimaryNameAttribute": `${schema.logicalName}_name`
    };

    const apiUrl = `${this.baseUrl}/api/data/v${this.apiVersion}/EntityDefinitions`;
    console.log('📡 Dataverse API呼び出し:', {
      baseUrl: this.baseUrl,
      apiVersion: this.apiVersion,
      fullUrl: apiUrl,
      method: 'POST',
      body: entityDefinition
    });
    
    // CORS問題の可能性をチェック
    if (!this.baseUrl || this.baseUrl === 'undefined') {
      throw new Error('ベースURLが設定されていません');
    }
    
    if (!apiUrl.startsWith('http')) {
      throw new Error(`不正なURL形式: ${apiUrl}`);
    }

    let response: Response;
    try {
      const headers = await this.getAuthHeaders();
      console.log('🔧 送信ヘッダー:', headers);
      
      response = await fetch(
        apiUrl,
        {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(entityDefinition),
          credentials: 'include', // クッキーベースの認証を含める
          mode: 'cors', // CORS を明示的に指定
        }
      );
    } catch (fetchError) {
      console.error('❌ Fetch エラー詳細:', {
        error: fetchError,
        message: fetchError instanceof Error ? fetchError.message : 'Unknown error',
        stack: fetchError instanceof Error ? fetchError.stack : undefined,
        url: apiUrl,
        baseUrl: this.baseUrl
      });
      
      // エラータイプによる詳細メッセージ
      if (fetchError instanceof TypeError && fetchError.message.includes('Failed to fetch')) {
        throw new Error(`CORSエラーまたはネットワークエラー: ${apiUrl} への接続に失敗しました。Dataverse環境のCORS設定を確認してください。`);
      } else if (fetchError instanceof Error && fetchError.message.includes('NetworkError')) {
        throw new Error(`ネットワークエラー: インターネット接続またはDataverse環境への接続を確認してください。`);
      } else {
        throw new Error(`ネットワークエラー: ${fetchError instanceof Error ? fetchError.message : 'APIへの接続に失敗しました'}`);
      }
    }

    console.log('📥 レスポンス受信:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorDetails = null;
      
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          errorDetails = await response.json();
          errorMessage = errorDetails.error?.message || errorMessage;
        } else {
          const textBody = await response.text();
          console.log('📄 非JSON レスポンス:', textBody);
          errorMessage = textBody || errorMessage;
        }
      } catch (parseError) {
        console.error('❌ レスポンス解析エラー:', parseError);
        errorMessage = `${errorMessage} (レスポンス解析失敗)`;
      }
      
      console.error('❌ API エラー詳細:', { status: response.status, errorMessage, errorDetails });
      throw new Error(`テーブル作成エラー: ${errorMessage}`);
    }

    // 204 No Contentまたは201 Createdの場合、レスポンスボディがない可能性がある
    const entityUrl = response.headers.get('OData-EntityId');
    const entityId = entityUrl?.match(/\(([^)]+)\)/)?.[1] || '';

    // カラムを追加
    for (const column of schema.columns) {
      await this.createColumn(schema.logicalName, column);
    }

    return entityId;
  }

  /**
   * 既存のテーブルに新しいカラムを追加する
   * 
   * 指定されたテーブルにカラム定義に基づいて新しいカラムを作成します。
   * カラムタイプに応じた適切な属性定義が自動的に構築されます。
   * 
   * @param {string} entityLogicalName - カラムを追加するテーブルの論理名
   * @param {ColumnSchema} column - カラム定義スキーマ
   * @param {string} column.logicalName - カラムの論理名
   * @param {string} column.displayName - カラムの表示名
   * @param {string} column.type - カラムのタイプ('string', 'number', 'date'等)
   * @param {boolean} [column.required] - 必須フィールドかどうか
   * 
   * @returns {Promise<void>}
   * 
   * @throws {Error} ネットワークエラーまたはCORSエラーの場合
   * @throws {Error} Dataverse APIがエラーを返した場合
   * 
   * @example
   * ```typescript
   * await service.createColumn('cr123_project', {
   *   logicalName: 'cr123_budget',
   *   displayName: '予算',
   *   type: 'currency',
   *   required: false
   * });
   * console.log('カラム作成完了');
   * ```
   * 
   * @remarks
   * - カラム追加には管理者権限が必要です
   * - 論理名はソリューション発行者のプレフィックスを含む必要があります
   */
  async createColumn(entityLogicalName: string, column: ColumnSchema): Promise<void> {
    const attributeDefinition = this.createAttributeDefinition(column);

    console.log(`🔧 カラム作成中: ${column.displayName} (${column.logicalName})`, attributeDefinition);

    let response: Response;
    try {
      const headers = await this.getAuthHeaders();
      response = await fetch(
        `${this.baseUrl}/api/data/v${this.apiVersion}/EntityDefinitions(LogicalName='${entityLogicalName}')/Attributes`,
        {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(attributeDefinition),
          credentials: 'include',
        }
      );
    } catch (fetchError) {
      console.error(`❌ カラム作成 Fetch エラー (${column.displayName}):`, fetchError);
      throw new Error(`カラム作成ネットワークエラー: ${fetchError instanceof Error ? fetchError.message : 'APIへの接続に失敗しました'}`);
    }

    console.log(`📥 カラム作成レスポンス (${column.displayName}):`, {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const error = await response.json();
        errorMessage = error.error?.message || errorMessage;
        console.error(`❌ カラム作成APIエラー (${column.displayName}):`, error);
      } catch {
        // JSONパース失敗時はstatusTextを使用
      }
      throw new Error(`カラム作成エラー: ${errorMessage}`);
    }
  }

  /**
   * カラム定義からDataverse属性定義オブジェクトを作成する
   * 
   * カラムタイプに応じて、Dataverse Web APIで要求される
   * 適切な属性メタデータオブジェクトを構築します。
   * 
   * @private
   * @param {ColumnSchema} column - カラム定義スキーマ
   * @returns {any} Dataverse属性定義オブジェクト
   * 
   * @remarks
   * サポートされるカラムタイプ:
   * - string: 文字列型(最大長指定可能)
   * - number: 整数型
   * - currency: 通貨型
   * - date: 日付型
   * - datetime: 日時型
   * - boolean: 真偽値型
   * - choice: 選択肢型(OptionSet)
   * - lookup: 参照型(他のテーブルへの参照)
   */
  private createAttributeDefinition(column: ColumnSchema): any {
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
      },
      "Description": {
        "@odata.type": "Microsoft.Dynamics.CRM.Label",
        "LocalizedLabels": [
          {
            "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
            "Label": "",
            "LanguageCode": 1041
          }
        ]
      }
    };

    switch (column.type) {
      case 'string':
        return {
          ...baseAttribute,
          "@odata.type": "Microsoft.Dynamics.CRM.StringAttributeMetadata",
          "AttributeType": "String",
          "AttributeTypeName": { "Value": "StringType" },
          "Format": "Text",
          "MaxLength": column.maxLength || 100
        };
      
      case 'number':
        return {
          ...baseAttribute,
          "@odata.type": "Microsoft.Dynamics.CRM.IntegerAttributeMetadata",
          "AttributeType": "Integer",
          "AttributeTypeName": { "Value": "IntegerType" },
          "Format": "None",
          "MinValue": -2147483648,
          "MaxValue": 2147483647
        };
      
      case 'currency':
        return {
          ...baseAttribute,
          "@odata.type": "Microsoft.Dynamics.CRM.MoneyAttributeMetadata",
          "AttributeType": "Money",
          "AttributeTypeName": { "Value": "MoneyType" },
          "PrecisionSource": 2,
          "MinValue": -922337203685477,
          "MaxValue": 922337203685477
        };
      
      case 'date':
        return {
          ...baseAttribute,
          "@odata.type": "Microsoft.Dynamics.CRM.DateTimeAttributeMetadata",
          "AttributeType": "DateTime",
          "AttributeTypeName": { "Value": "DateTimeType" },
          "Format": "DateOnly",
          "ImeMode": "Disabled"
        };
      
      case 'datetime':
        return {
          ...baseAttribute,
          "@odata.type": "Microsoft.Dynamics.CRM.DateTimeAttributeMetadata",
          "AttributeType": "DateTime",
          "AttributeTypeName": { "Value": "DateTimeType" },
          "Format": "DateAndTime",
          "ImeMode": "Disabled"
        };
      
      case 'boolean':
        return {
          ...baseAttribute,
          "@odata.type": "Microsoft.Dynamics.CRM.BooleanAttributeMetadata",
          "AttributeType": "Boolean",
          "AttributeTypeName": { "Value": "BooleanType" },
          "DefaultValue": false,
          "OptionSet": {
            "@odata.type": "Microsoft.Dynamics.CRM.BooleanOptionSetMetadata",
            "TrueOption": {
              "Value": 1,
              "Label": {
                "@odata.type": "Microsoft.Dynamics.CRM.Label",
                "LocalizedLabels": [{
                  "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
                  "Label": "はい",
                  "LanguageCode": 1041
                }]
              }
            },
            "FalseOption": {
              "Value": 0,
              "Label": {
                "@odata.type": "Microsoft.Dynamics.CRM.Label",
                "LocalizedLabels": [{
                  "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
                  "Label": "いいえ",
                  "LanguageCode": 1041
                }]
              }
            }
          }
        };
      
      case 'choice':
        return {
          ...baseAttribute,
          "@odata.type": "Microsoft.Dynamics.CRM.PicklistAttributeMetadata",
          "AttributeType": "Picklist",
          "AttributeTypeName": { "Value": "PicklistType" },
          "OptionSet": {
            "@odata.type": "Microsoft.Dynamics.CRM.OptionSetMetadata",
            "IsGlobal": false,
            "OptionSetType": "Picklist",
            "Options": column.choices?.map(choice => ({
              "Value": choice.value,
              "Label": {
                "@odata.type": "Microsoft.Dynamics.CRM.Label",
                "LocalizedLabels": [{
                  "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
                  "Label": choice.label,
                  "LanguageCode": 1041
                }]
              }
            })) || []
          }
        };
      
      case 'lookup':
        return {
          ...baseAttribute,
          "@odata.type": "Microsoft.Dynamics.CRM.LookupAttributeMetadata",
          "AttributeType": "Lookup",
          "AttributeTypeName": { "Value": "LookupType" },
          "Targets": column.lookupEntity ? [column.lookupEntity] : []
        };
      
      default:
        return baseAttribute;
    }
  }

  /**
   * Dataverse環境内のカスタムテーブル一覧を取得する
   * 
   * カスタムテーブル(IsCustomEntity = true)のメタデータを取得して返します。
   * 各テーブルの基本情報(論理名、表示名、スキーマ名、エンティティセット名)が含まれます。
   * 
   * @returns {Promise<any[]>} カスタムテーブルのメタデータ配列
   * 
   * @throws {Error} APIリクエストが失敗した場合
   * 
   * @example
   * ```typescript
   * const tables = await service.getTables();
   * 
   * tables.forEach(table => {
   *   console.log(`${table.DisplayName.UserLocalizedLabel.Label}: ${table.LogicalName}`);
   * });
   * ```
   * 
   * @remarks
   * - システムテーブルは含まれません(IsCustomEntity = trueのみ)
   * - 結果にはメタデータのみが含まれ、実際のレコードデータは含まれません
   */
  async getTables(): Promise<any[]> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(
      `${this.baseUrl}/api/data/v${this.apiVersion}/EntityDefinitions?$select=LogicalName,DisplayName,SchemaName,EntitySetName&$filter=IsCustomEntity eq true`,
      {
        headers: headers,
        credentials: 'include',
      }
    );

    if (!response.ok) {
      let errorMessage = 'テーブル一覧の取得に失敗しました';
      try {
        const error = await response.json();
        errorMessage = error.error?.message || errorMessage;
      } catch {
        // JSONパース失敗時はデフォルトメッセージを使用
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    return data.value;
  }

  /**
   * 指定されたテーブルの詳細スキーマを取得する
   * 
   * テーブルのメタデータと、そのテーブルに含まれる全ての属性(カラム)情報を取得します。
   * 
   * @param {string} logicalName - 取得するテーブルの論理名
   * @returns {Promise<any>} テーブルスキーマオブジェクト(Attributes配列を含む)
   * 
   * @throws {Error} APIリクエストが失敗した場合
   * @throws {Error} 指定されたテーブルが存在しない場合
   * 
   * @example
   * ```typescript
   * const schema = await service.getTableSchema('cr123_project');
   * 
   * console.log('テーブル名:', schema.DisplayName.UserLocalizedLabel.Label);
   * console.log('カラム数:', schema.Attributes.length);
   * 
   * schema.Attributes.forEach(attr => {
   *   console.log(`- ${attr.DisplayName.UserLocalizedLabel.Label} (${attr.AttributeType})`);
   * });
   * ```
   * 
   * @remarks
   * - $expandクエリパラメータによりAttributes(カラム情報)が展開されます
   * - システム属性も含めた全ての属性が返されます
   */
  async getTableSchema(logicalName: string): Promise<any> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(
      `${this.baseUrl}/api/data/v${this.apiVersion}/EntityDefinitions(LogicalName='${logicalName}')?$expand=Attributes`,
      {
        headers: headers,
        credentials: 'include',
      }
    );

    if (!response.ok) {
      let errorMessage = 'テーブルスキーマの取得に失敗しました';
      try {
        const error = await response.json();
        errorMessage = error.error?.message || errorMessage;
      } catch {
        // JSONパース失敗時はデフォルトメッセージを使用
      }
      throw new Error(errorMessage);
    }
    
    return response.json();
  }

  /**
   * Dataverseテーブルに新しいレコードを作成する
   * 
   * 指定されたエンティティセットに対してPOSTリクエストを送信し、
   * 新しいレコードを作成します。作成されたレコードのIDを返します。
   * 
   * @param {string} entitySetName - エンティティセット名(テーブルの複数形名)
   * @param {Record<string, any>} data - 作成するレコードのデータ
   * @returns {Promise<string>} 作成されたレコードのID(GUID)
   * 
   * @throws {Error} CORSエラーまたはネットワークエラーの場合
   * @throws {Error} Dataverse APIがエラーを返した場合
   * 
   * @example
   * ```typescript
   * const recordId = await service.createRecord('cr123_projects', {
   *   cr123_name: '新規プロジェクト',
   *   cr123_description: 'プロジェクトの説明',
   *   cr123_status: 1  // 選択肢の値
   * });
   * console.log('作成されたレコードID:', recordId);
   * ```
   * 
   * @remarks
   * - エンティティセット名はテーブルの複数形名です(例: cr123_project → cr123_projects)
   * - フィールド名はDataverseのカラム論理名を使用してください
   * - 選択肢(Choice)フィールドは数値で指定します
   * - 参照(Lookup)フィールドは「フィールド名@odata.bind」形式で指定します
   */
  async createRecord(entitySetName: string, data: Record<string, any>): Promise<string> {
    console.log(`📝 レコード作成中: ${entitySetName}`, data);

    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(
        `${this.baseUrl}/api/data/v${this.apiVersion}/${entitySetName}`,
        {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(data),
          credentials: 'include',
          mode: 'cors',
        }
      );

      console.log('📥 レコード作成レスポンス:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        let errorDetails = null;
        
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            errorDetails = await response.json();
            errorMessage = errorDetails.error?.message || errorMessage;
          } else {
            const textBody = await response.text();
            console.log('📄 非JSON レスポンス:', textBody);
            errorMessage = textBody || errorMessage;
          }
        } catch (parseError) {
          console.error('❌ レスポンス解析エラー:', parseError);
          errorMessage = `${errorMessage} (レスポンス解析失敗)`;
        }
        
        console.error('❌ レコード作成 API エラー詳細:', { status: response.status, errorMessage, errorDetails });
        throw new Error(`レコード作成エラー: ${errorMessage}`);
      }

      // 作成されたレコードのIDを取得
      const entityUrl = response.headers.get('OData-EntityId');
      const entityId = entityUrl?.match(/\(([^)]+)\)/)?.[1] || '';

      console.log('✅ レコード作成成功:', {
        entityId,
        entityUrl
      });

      return entityId;

    } catch (fetchError) {
      console.error('❌ レコード作成 Fetch エラー:', fetchError);
      
      if (fetchError instanceof TypeError && fetchError.message.includes('Failed to fetch')) {
        throw new Error(`CORSエラーまたはネットワークエラー: ${this.baseUrl} への接続に失敗しました。Dataverse環境のCORS設定を確認してください。`);
      } else if (fetchError instanceof Error && fetchError.message.includes('NetworkError')) {
        throw new Error(`ネットワークエラー: インターネット接続またはDataverse環境への接続を確認してください。`);
      } else {
        throw new Error(`レコード作成ネットワークエラー: ${fetchError instanceof Error ? fetchError.message : 'APIへの接続に失敗しました'}`);
      }
    }
  }

  /**
   * 既存のDataverseレコードを更新する
   * 
   * 指定されたレコードIDのレコードに対してPATCHリクエストを送信し、
   * データを更新します。部分更新をサポートしており、指定したフィールドのみ更新されます。
   * 
   * @param {string} entitySetName - エンティティセット名(テーブルの複数形名)
   * @param {string} recordId - 更新するレコードのID(GUID)
   * @param {Record<string, any>} data - 更新するフィールドと値
   * @returns {Promise<void>}
   * 
   * @throws {Error} ネットワークエラーまたはCORSエラーの場合
   * @throws {Error} Dataverse APIがエラーを返した場合
   * @throws {Error} レコードが見つからない場合
   * 
   * @example
   * ```typescript
   * await service.updateRecord(
   *   'cr123_projects',
   *   '12345678-1234-1234-1234-123456789012',
   *   {
   *     cr123_name: '更新されたプロジェクト名',
   *     cr123_status: 2
   *   }
   * );
   * console.log('レコード更新完了');
   * ```
   * 
   * @remarks
   * - PATCHメソッドを使用するため、指定したフィールドのみが更新されます
   * - 他のフィールドは変更されません
   * - レコードIDはハイフン付きGUID形式です
   */
  async updateRecord(entitySetName: string, recordId: string, data: Record<string, any>): Promise<void> {
    console.log(`📝 レコード更新中: ${entitySetName}/${recordId}`, data);

    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(
        `${this.baseUrl}/api/data/v${this.apiVersion}/${entitySetName}(${recordId})`,
        {
          method: 'PATCH',
          headers: headers,
          body: JSON.stringify(data),
          credentials: 'include',
          mode: 'cors',
        }
      );

      console.log('📥 レコード更新レスポンス:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const error = await response.json();
          errorMessage = error.error?.message || errorMessage;
        } catch {
          // JSONパース失敗時はstatusTextを使用
        }
        console.error('❌ レコード更新 API エラー:', errorMessage);
        throw new Error(`レコード更新エラー: ${errorMessage}`);
      }

      console.log('✅ レコード更新成功');

    } catch (fetchError) {
      console.error('❌ レコード更新 Fetch エラー:', fetchError);
      throw new Error(`レコード更新ネットワークエラー: ${fetchError instanceof Error ? fetchError.message : 'APIへの接続に失敗しました'}`);
    }
  }

  /**
   * Dataverseレコードを削除する
   * 
   * 指定されたレコードIDのレコードをDataverseから完全に削除します。
   * この操作は元に戻せません。
   * 
   * @param {string} entitySetName - エンティティセット名(テーブルの複数形名)
   * @param {string} recordId - 削除するレコードのID(GUID)
   * @returns {Promise<void>}
   * 
   * @throws {Error} ネットワークエラーまたはCORSエラーの場合
   * @throws {Error} Dataverse APIがエラーを返した場合
   * @throws {Error} レコードが見つからない場合
   * 
   * @example
   * ```typescript
   * try {
   *   await service.deleteRecord(
   *     'cr123_projects',
   *     '12345678-1234-1234-1234-123456789012'
   *   );
   *   console.log('レコード削除完了');
   * } catch (error) {
   *   console.error('削除失敗:', error);
   * }
   * ```
   * 
   * @remarks
   * - この操作は元に戻せません
   * - 関連レコードがある場合、カスケード設定に応じて削除される可能性があります
   * - レコードIDはハイフン付きGUID形式です
   */
  async deleteRecord(entitySetName: string, recordId: string): Promise<void> {
    console.log(`🗑️ レコード削除中: ${entitySetName}/${recordId}`);

    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(
        `${this.baseUrl}/api/data/v${this.apiVersion}/${entitySetName}(${recordId})`,
        {
          method: 'DELETE',
          headers: headers,
          credentials: 'include',
          mode: 'cors',
        }
      );

      console.log('📥 レコード削除レスポンス:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const error = await response.json();
          errorMessage = error.error?.message || errorMessage;
        } catch {
          // JSONパース失敗時はstatusTextを使用
        }
        console.error('❌ レコード削除 API エラー:', errorMessage);
        throw new Error(`レコード削除エラー: ${errorMessage}`);
      }

      console.log('✅ レコード削除成功');

    } catch (fetchError) {
      console.error('❌ レコード削除 Fetch エラー:', fetchError);
      throw new Error(`レコード削除ネットワークエラー: ${fetchError instanceof Error ? fetchError.message : 'APIへの接続に失敗しました'}`);
    }
  }

  /**
   * Dataverseテーブルからレコードを取得する
   * 
   * ODataクエリオプションを使用して、レコードのフィルタリング、
   * ソート、フィールド選択、件数制限を行えます。
   * 
   * @param {string} entitySetName - エンティティセット名(テーブルの複数形名)
   * @param {Object} [options] - クエリオプション
   * @param {string[]} [options.select] - 取得するフィールド名の配列
   * @param {string} [options.filter] - ODataフィルター式
   * @param {string} [options.orderBy] - ソート順(例: 'cr123_name asc')
   * @param {number} [options.top] - 取得する最大件数
   * @returns {Promise<any[]>} 取得されたレコードの配列
   * 
   * @throws {Error} ネットワークエラーまたはCORSエラーの場合
   * @throws {Error} Dataverse APIがエラーを返した場合
   * 
   * @example
   * ```typescript
   * // 全フィールドを取得
   * const allRecords = await service.getRecords('cr123_projects');
   * 
   * // フィールドを指定して取得
   * const records = await service.getRecords('cr123_projects', {
   *   select: ['cr123_name', 'cr123_status'],
   *   filter: "cr123_status eq 1",
   *   orderBy: 'createdon desc',
   *   top: 10
   * });
   * 
   * records.forEach(record => {
   *   console.log(record.cr123_name);
   * });
   * ```
   * 
   * @remarks
   * - filterオプションはOData v4のフィルター構文を使用します
   * - デフォルトでは全てのフィールドが返されます
   * - 大量のレコードを取得する場合、topオプションでページング処理を検討してください
   */
  async getRecords(entitySetName: string, options?: {
    select?: string[];
    filter?: string;
    orderBy?: string;
    top?: number;
  }): Promise<any[]> {
    console.log(`📖 レコード取得中: ${entitySetName}`, options);

    try {
      let url = `${this.baseUrl}/api/data/v${this.apiVersion}/${entitySetName}`;
      const params = new URLSearchParams();

      if (options?.select) {
        params.append('$select', options.select.join(','));
      }
      if (options?.filter) {
        params.append('$filter', options.filter);
      }
      if (options?.orderBy) {
        params.append('$orderby', options.orderBy);
      }
      if (options?.top) {
        params.append('$top', options.top.toString());
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      console.log('📡 取得URL:', url);

      const headers = await this.getAuthHeaders();
      const response = await fetch(url, {
        method: 'GET',
        headers: headers,
        credentials: 'include',
        mode: 'cors',
      });

      console.log('📥 レコード取得レスポンス:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const error = await response.json();
          errorMessage = error.error?.message || errorMessage;
        } catch {
          // JSONパース失敗時はstatusTextを使用
        }
        console.error('❌ レコード取得 API エラー:', errorMessage);
        throw new Error(`レコード取得エラー: ${errorMessage}`);
      }

      const data = await response.json();
      console.log('✅ レコード取得成功:', data.value?.length || 0, '件');
      return data.value || [];

    } catch (fetchError) {
      console.error('❌ レコード取得 Fetch エラー:', fetchError);
      throw new Error(`レコード取得ネットワークエラー: ${fetchError instanceof Error ? fetchError.message : 'APIへの接続に失敗しました'}`);
    }
  }
}
