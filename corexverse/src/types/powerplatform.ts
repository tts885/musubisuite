/**
 * Power Platform接続関連の型定義
 */

/**
 * Dataverse接続情報
 */
export interface DataverseConnection {
  id: string;
  name: string;
  displayName: string;
  environmentId: string;
  environmentUrl: string;
  apiVersion: string;
  description?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
  lastTestDate?: string;
  lastTestStatus?: 'success' | 'failure';
  lastTestMessage?: string;
  testHistory?: TestHistoryEntry[];
}

/**
 * テスト履歴エントリ
 */
export interface TestHistoryEntry {
  id: string;
  connectionId: string;
  connectionName: string;
  testType: 'basic' | 'whoami' | 'query';
  status: 'success' | 'failure';
  responseTime: number;
  errorMessage?: string;
  executedAt: string;
}

/**
 * 接続ログエントリ
 */
export interface ConnectionLogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  action: string;
  connectionId?: string;
  connectionName?: string;
  message: string;
  details?: string;
}

/**
 * 接続テスト結果
 */
export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: string;
  responseTime?: number;
  timestamp: string;
  error?: {
    message: string;
    code?: string;
    stack?: string;
  };
}

/**
 * Power Apps WebApiClient型定義（簡易版）
 */
export interface WebApiClient {
  retrieveMultiple: (entityName: string, options?: any) => Promise<any>;
  retrieve: (entityName: string, id: string, options?: any) => Promise<any>;
  create: (entityName: string, data: any) => Promise<string>;
  update: (entityName: string, id: string, data: any) => Promise<void>;
  delete: (entityName: string, id: string) => Promise<void>;
}

/**
 * Power Apps SDK初期化オプション
 */
export interface PowerAppsSDKOptions {
  environmentId: string;
  apiVersion?: string;
}
