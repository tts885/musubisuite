/**
 * Dataverse接続サービス
 * 
 * Power Apps SDKを使用してDataverseに接続し、接続テストを実行します。
 * 
 * @module services/dataverse
 */

import { getContext } from '@microsoft/power-apps/app';

/**
 * Dataverse接続設定
 */
export interface DataverseConnection {
  environmentUrl: string;
  environmentId?: string;
  displayName?: string;
}

/**
 * 接続テスト結果
 */
export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: {
    environmentUrl?: string;
    environmentId?: string;
    version?: string;
    organizationName?: string;
    error?: string;
  };
}

/**
 * Power Apps環境情報を取得
 * 
 * @returns Power Apps環境コンテキスト
 */
export async function getPowerAppsContext() {
  try {
    const context = await getContext();
    return {
      success: true,
      context,
      // IContextに存在するプロパティのみ使用
      // environment, organizationプロパティは型定義に存在しないためコメントアウト
      // environmentId: context?.environment?.id,
      // environmentUrl: context?.environment?.url,
      // organizationName: context?.organization?.friendlyName,
    };
  } catch (error) {
    console.error('Failed to get Power Apps context:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Dataverse接続をテスト
 * 
 * Power Apps SDKのコンテキストを使用して接続状態を確認します。
 * 
 * @param connection - 接続設定
 * @returns 接続テスト結果
 */
export async function testDataverseConnection(
  connection: DataverseConnection
): Promise<ConnectionTestResult> {
  try {
    console.log('Testing Dataverse connection...', connection);
    
    // Power Apps コンテキストを取得
    const contextResult = await getPowerAppsContext();
    
    if (!contextResult.success) {
      return {
        success: false,
        message: 'Power Apps環境に接続されていません',
        details: {
          error: contextResult.error,
          environmentUrl: connection.environmentUrl,
        },
      };
    }
    
    // Power Apps環境に接続されている
    return {
      success: true,
      message: 'Dataverse環境に接続されています',
      details: {
        environmentUrl: connection.environmentUrl,
        // IContextから利用可能な情報を追加する場合はここに記述
      },
    };
  } catch (error) {
    console.error('Dataverse connection test failed:', error);
    return {
      success: false,
      message: '接続テストに失敗しました',
      details: {
        environmentUrl: connection.environmentUrl,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * 使用可能なDataverseテーブル一覧を取得
 * 
 * @returns テーブル情報のリスト
 * @remarks
 * この機能を使用するには、事前に `pac code add-data-source` で
 * テーブルをデータソースとして追加する必要があります。
 */
export async function getAvailableTables() {
  // TODO: 実装予定
  // 生成されたサービスファイルを使用してテーブル一覧を取得
  return {
    success: false,
    message: 'この機能はまだ実装されていません。pac code add-data-source でテーブルを追加してください。',
  };
}
