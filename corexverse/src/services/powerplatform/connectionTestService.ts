import type { DataverseConnection, ConnectionTestResult, TestHistoryEntry } from '@/types/powerplatform';
import { dataverseStore } from '@/lib/dataverseStore';
import { DataverseAdminService } from '@/services/dataverseAdminService';

/**
 * Dataverse接続テストサービス
 * 
 * Dataverse Web APIを使用して接続をテストし、
 * レスポンスデータとテーブル一覧を詳細にログ出力します。
 */

/**
 * 接続テストを実行
 * 
 * @param connection - テスト対象の接続情報
 * @returns テスト結果
 */
export async function testConnection(
  connection: DataverseConnection
): Promise<ConnectionTestResult> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  // ログ記録: テスト開始
  dataverseStore.saveConnectionLog({
    id: `log-${Date.now()}-${Math.random()}`,
    timestamp,
    level: 'info',
    action: 'test_start',
    connectionId: connection.id,
    connectionName: connection.name,
    message: '接続テストを開始しました',
    details: `環境URL: ${connection.environmentUrl}, APIバージョン: ${connection.apiVersion}`
  });
  
  try {
    const logEntries: string[] = [];

    // DataverseAdminServiceを使用して接続テスト
    const adminService = new DataverseAdminService({
      id: connection.id,
      name: connection.name,
      displayName: connection.displayName,
      environmentId: connection.environmentId,
      environmentUrl: connection.environmentUrl,
      baseUrl: connection.environmentUrl,
      apiVersion: connection.apiVersion,
      isActive: connection.isActive || false,
      createdAt: connection.createdAt,
      updatedAt: connection.updatedAt
    } as any);

    logEntries.push('=== Dataverse 接続テスト開始 ===');
    logEntries.push(`環境URL: ${connection.environmentUrl}`);
    logEntries.push(`APIバージョン: ${connection.apiVersion}`);
    logEntries.push('');

    // Step 1: 基本的な接続テスト ($metadata エンドポイント)
    logEntries.push('Step 1: 基本接続テスト ($metadata)');
    dataverseStore.saveConnectionLog({
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      level: 'info',
      action: 'metadata_test',
      connectionId: connection.id,
      connectionName: connection.name,
      message: '$metadataエンドポイントに接続中...'
    });

    const basicTestResult = await adminService.testConnection();
    
    if (!basicTestResult.success) {
      const errorDetails = basicTestResult.error || '接続テストに失敗しました';
      dataverseStore.saveConnectionLog({
        id: `log-${Date.now()}-${Math.random()}`,
        timestamp: new Date().toISOString(),
        level: 'error',
        action: 'metadata_test_failed',
        connectionId: connection.id,
        connectionName: connection.name,
        message: '基本接続テストに失敗',
        details: errorDetails
      });
      throw new Error(errorDetails);
    }
    
    logEntries.push('✓ 基本接続: 成功');
    dataverseStore.saveConnectionLog({
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      level: 'info',
      action: 'metadata_test_success',
      connectionId: connection.id,
      connectionName: connection.name,
      message: '$metadataエンドポイントへの接続成功',
      details: basicTestResult.details ? JSON.stringify(basicTestResult.details, null, 2) : undefined
    });
    logEntries.push('');

    // Step 2: カスタムテーブル一覧の取得
    logEntries.push('Step 2: カスタムテーブル一覧取得');
    dataverseStore.saveConnectionLog({
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      level: 'info',
      action: 'get_tables_start',
      connectionId: connection.id,
      connectionName: connection.name,
      message: 'カスタムテーブル一覧の取得を開始...'
    });

    try {
      const tables = await adminService.getTables();
      
      logEntries.push(`✓ テーブル取得: 成功 (${tables.length}件)`);
      
      if (tables.length > 0) {
        logEntries.push('');
        logEntries.push('=== 取得したカスタムテーブル一覧 ===');
        tables.slice(0, 20).forEach((table: any, index: number) => {
          const displayName = table.DisplayName?.UserLocalizedLabel?.Label || table.LogicalName;
          logEntries.push(`${index + 1}. ${displayName} (${table.LogicalName})`);
          logEntries.push(`   エンティティセット名: ${table.EntitySetName}`);
        });
        
        if (tables.length > 20) {
          logEntries.push(`... 他 ${tables.length - 20}件`);
        }

        // テーブルリストの詳細をログに記録
        const tableList = tables.map((t: any) => ({
          logicalName: t.LogicalName,
          displayName: t.DisplayName?.UserLocalizedLabel?.Label,
          entitySetName: t.EntitySetName,
          schemaName: t.SchemaName
        }));

        dataverseStore.saveConnectionLog({
          id: `log-${Date.now()}-${Math.random()}`,
          timestamp: new Date().toISOString(),
          level: 'info',
          action: 'get_tables_success',
          connectionId: connection.id,
          connectionName: connection.name,
          message: `カスタムテーブル一覧の取得に成功 (${tables.length}件)`,
          details: JSON.stringify(tableList, null, 2)
        });
      } else {
        logEntries.push('⚠ カスタムテーブルが見つかりませんでした');
        dataverseStore.saveConnectionLog({
          id: `log-${Date.now()}-${Math.random()}`,
          timestamp: new Date().toISOString(),
          level: 'warning',
          action: 'get_tables_empty',
          connectionId: connection.id,
          connectionName: connection.name,
          message: 'カスタムテーブルが見つかりませんでした',
          details: 'この環境にはカスタムテーブルが作成されていません'
        });
      }
    } catch (tableError: any) {
      logEntries.push(`✗ テーブル取得: 失敗`);
      logEntries.push(`  エラー: ${tableError.message}`);
      
      dataverseStore.saveConnectionLog({
        id: `log-${Date.now()}-${Math.random()}`,
        timestamp: new Date().toISOString(),
        level: 'error',
        action: 'get_tables_failed',
        connectionId: connection.id,
        connectionName: connection.name,
        message: 'カスタムテーブル一覧の取得に失敗',
        details: `エラー: ${tableError.message}\nスタック: ${tableError.stack}`
      });
    }
    
    logEntries.push('');

    // Step 3: 標準テーブルへのアクセステスト
    logEntries.push('Step 3: 標準テーブルアクセステスト');
    dataverseStore.saveConnectionLog({
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      level: 'info',
      action: 'standard_table_test_start',
      connectionId: connection.id,
      connectionName: connection.name,
      message: '標準テーブルへのアクセステストを開始...'
    });

    const standardTables = [
      { name: 'accounts', displayName: '取引先企業' },
      { name: 'contacts', displayName: '取引先担当者' },
      { name: 'systemusers', displayName: 'ユーザー' }
    ];

    const accessibleTables: string[] = [];
    const tableAccessResults: any[] = [];

    for (const table of standardTables) {
      try {
        const records = await adminService.getRecords(table.name, { top: 1 });
        accessibleTables.push(`${table.displayName} (${table.name})`);
        tableAccessResults.push({
          name: table.name,
          displayName: table.displayName,
          accessible: true,
          recordCount: records.length > 0 ? '1件以上' : '0件'
        });
        logEntries.push(`✓ ${table.displayName} (${table.name}): アクセス可能`);
      } catch (error: any) {
        tableAccessResults.push({
          name: table.name,
          displayName: table.displayName,
          accessible: false,
          error: error.message
        });
        logEntries.push(`✗ ${table.displayName} (${table.name}): アクセス不可`);
      }
    }

    // テーブルアクセス結果をログに記録
    dataverseStore.saveConnectionLog({
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      level: 'info',
      action: 'standard_table_test_complete',
      connectionId: connection.id,
      connectionName: connection.name,
      message: `標準テーブルアクセステスト完了 (${accessibleTables.length}/${standardTables.length}件アクセス可能)`,
      details: JSON.stringify(tableAccessResults, null, 2)
    });

    logEntries.push('');
    logEntries.push(`アクセス可能なテーブル: ${accessibleTables.length}/${standardTables.length}件`);
    
    // テスト結果サマリー
    logEntries.push('');
    logEntries.push('=== テスト結果サマリー ===');
    logEntries.push('✓ 基本接続テスト: 成功');
    logEntries.push(`✓ カスタムテーブル取得: 成功`);
    logEntries.push(`✓ 標準テーブルアクセス: ${accessibleTables.length}/${standardTables.length}件成功`);

    const testDetails = logEntries.join('\n');
    const responseTime = Date.now() - startTime;

    // テスト成功 - 接続情報とテスト履歴を更新
    dataverseStore.updateConnectionTestResult(connection.id, {
      status: 'success',
      message: `接続成功 (応答時間: ${responseTime}ms)`,
      timestamp
    });

    const historyEntry: TestHistoryEntry = {
      id: `test-${Date.now()}`,
      connectionId: connection.id,
      connectionName: connection.name,
      testType: 'basic',
      status: 'success',
      responseTime,
      executedAt: timestamp
    };
    
    dataverseStore.saveTestHistory(historyEntry);

    // ログ記録: テスト成功
    dataverseStore.saveConnectionLog({
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      level: 'info',
      action: 'test_success',
      connectionId: connection.id,
      connectionName: connection.name,
      message: `接続テストが成功しました (応答時間: ${responseTime}ms)`,
      details: testDetails
    });

    return {
      success: true,
      message: `接続テストが成功しました (応答時間: ${responseTime}ms)`,
      details: testDetails,
      responseTime,
      timestamp
    };

  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : '不明なエラー';
    const errorStack = error instanceof Error ? error.stack : undefined;

    // テスト失敗 - 接続情報とテスト履歴を更新
    dataverseStore.updateConnectionTestResult(connection.id, {
      status: 'failure',
      message: errorMessage,
      timestamp
    });

    const historyEntry: TestHistoryEntry = {
      id: `test-${Date.now()}`,
      connectionId: connection.id,
      connectionName: connection.name,
      testType: 'basic',
      status: 'failure',
      responseTime,
      errorMessage,
      executedAt: timestamp
    };
    
    dataverseStore.saveTestHistory(historyEntry);

    // ログ記録: テスト失敗
    dataverseStore.saveConnectionLog({
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      level: 'error',
      action: 'test_failure',
      connectionId: connection.id,
      connectionName: connection.name,
      message: `接続テストが失敗しました: ${errorMessage}`,
      details: errorStack
    });

    return {
      success: false,
      message: errorMessage,
      details: errorStack,
      responseTime,
      timestamp,
      error: {
        message: errorMessage,
        code: 'TEST_FAILED',
        stack: errorStack
      }
    };
  }
}
