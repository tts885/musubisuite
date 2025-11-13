export interface DataverseConnection {
  id: string;
  name: string;
  environment: string;
  baseUrl: string;
  apiVersion: string;
  isActive: boolean;
  createdAt: string;
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
