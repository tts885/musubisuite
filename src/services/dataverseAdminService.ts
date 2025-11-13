import type { DataverseConnection, TableSchema, ColumnSchema } from '@/types/dataverse';

export class DataverseAdminService {
  private baseUrl: string;
  private apiVersion: string;

  constructor(connection: DataverseConnection) {
    this.baseUrl = connection.baseUrl;
    this.apiVersion = connection.apiVersion;
  }

  // 接続テスト
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

  // 認証ヘッダーを取得
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

  // テーブルを作成
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

  // カラムを作成
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

  // カラム定義を作成
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

  // テーブル一覧を取得
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

  // テーブルのスキーマを取得
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

  // レコードを作成
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

  // レコードを更新
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

  // レコードを削除
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

  // レコードを取得
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
