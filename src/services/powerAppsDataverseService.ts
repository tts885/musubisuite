import type { DataverseConnection, TableSchema } from '@/types/dataverse';

/**
 * Power Apps環境でのDataverse操作サービス
 * Power AppsのコネクターまたはProxy経由でDataverse APIを呼び出し
 */
export class PowerAppsDataverseService {
  private connection: DataverseConnection;

  constructor(connection: DataverseConnection) {
    this.connection = connection;
  }

  /**
   * Power Apps Code環境でのテーブル作成
   * 注意: 実際の本番環境では認証が必要
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
        console.error('Dataverse API Error:', errorText);
        
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
      console.error('Table creation failed:', error);
      throw error;
    }
  }

  /**
   * 認証付きリクエストを送信
   * 本番環境では適切な認証トークンを使用
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