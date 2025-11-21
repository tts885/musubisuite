export interface DataverseConnection {
  id: string;
  name: string;
  displayName: string;
  environmentId: string;
  environmentUrl: string;
  baseUrl?: string; // DataverseAdminService用
  apiVersion: string;
  description?: string;
  isActive: boolean;
  lastTestDate?: string;
  lastTestStatus?: 'success' | 'failure';
  lastTestMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TableSchema {
  logicalName: string;
  displayName: string;
  pluralName: string;
  description?: string;
  columns: ColumnSchema[];
}

export interface ColumnSchema {
  logicalName: string;
  displayName: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'currency' | 'choice' | 'lookup';
  required?: boolean;
  maxLength?: number;
  choices?: { value: number; label: string }[];
  lookupEntity?: string;
}

export interface TableMapping {
  id: string;
  tableName: string;
  entitySetName: string;
  connectionId: string;
  fieldMappings: {
    appField: string;
    dataverseField: string;
  }[];
  createdAt: string;
}

// 接続テスト関連の型定義
export interface ConnectionTestResult {
  success: boolean;
  status: 'success' | 'failure' | 'loading';
  message: string;
  responseTime?: number;
  timestamp: string;
  details?: {
    step: string;
    result: 'success' | 'failure';
    message?: string;
  }[];
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

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

// Power Apps SDK の型定義拡張
export interface WebApiClientConfig {
  environmentId: string;
  apiVersion?: string;
}

export interface RetrieveMultipleOptions {
  select?: string[];
  filter?: string;
  orderBy?: string[];
  top?: number;
}

export interface DataverseRecord {
  [key: string]: unknown;
}

export interface DataverseError {
  statusCode: number;
  message: string;
  error?: {
    code: string;
    message: string;
  };
}
