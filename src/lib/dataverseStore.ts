import type { DataverseConnection, TableMapping } from '@/types/dataverse';

const STORAGE_KEYS = {
  CONNECTIONS: 'dataverse_connections',
  ACTIVE_CONNECTION: 'dataverse_active_connection',
  TABLE_MAPPINGS: 'dataverse_table_mappings'
};

export const dataverseStore = {
  // 接続情報の保存
  saveConnection(connection: DataverseConnection): void {
    const connections = this.getConnections();
    const index = connections.findIndex(c => c.id === connection.id);
    
    if (index >= 0) {
      connections[index] = connection;
    } else {
      connections.push(connection);
    }
    
    localStorage.setItem(STORAGE_KEYS.CONNECTIONS, JSON.stringify(connections));
  },

  // 全接続情報の取得
  getConnections(): DataverseConnection[] {
    const data = localStorage.getItem(STORAGE_KEYS.CONNECTIONS);
    return data ? JSON.parse(data) : [];
  },

  // 接続情報の削除
  deleteConnection(id: string): void {
    const connections = this.getConnections().filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CONNECTIONS, JSON.stringify(connections));
    
    if (this.getActiveConnectionId() === id) {
      this.setActiveConnection(null);
    }
  },

  // アクティブな接続を設定
  setActiveConnection(id: string | null): void {
    if (id) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_CONNECTION, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_CONNECTION);
    }
  },

  // アクティブな接続IDを取得
  getActiveConnectionId(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_CONNECTION);
  },

  // アクティブな接続を取得
  getActiveConnection(): DataverseConnection | null {
    const id = this.getActiveConnectionId();
    if (!id) return null;
    
    const connections = this.getConnections();
    return connections.find(c => c.id === id) || null;
  },

  // テーブルマッピングの保存
  saveTableMapping(mapping: TableMapping): void {
    const mappings = this.getTableMappings();
    const index = mappings.findIndex(m => m.id === mapping.id);
    
    if (index >= 0) {
      mappings[index] = mapping;
    } else {
      mappings.push(mapping);
    }
    
    localStorage.setItem(STORAGE_KEYS.TABLE_MAPPINGS, JSON.stringify(mappings));
  },

  // 全テーブルマッピングの取得
  getTableMappings(): TableMapping[] {
    const data = localStorage.getItem(STORAGE_KEYS.TABLE_MAPPINGS);
    return data ? JSON.parse(data) : [];
  },

  // 特定のテーブル名のマッピングを取得
  getTableMappingByName(tableName: string): TableMapping | null {
    const mappings = this.getTableMappings();
    return mappings.find(m => m.tableName === tableName) || null;
  },

  // テーブルマッピングの削除
  deleteTableMapping(id: string): void {
    const mappings = this.getTableMappings().filter(m => m.id !== id);
    localStorage.setItem(STORAGE_KEYS.TABLE_MAPPINGS, JSON.stringify(mappings));
  }
};
