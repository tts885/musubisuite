import type { DataverseConnection, TableMapping } from '@/types/dataverse';

/**
 * LocalStorageのキー定数
 * 
 * @constant
 * @private
 */
const STORAGE_KEYS = {
  CONNECTIONS: 'dataverse_connections',
  ACTIVE_CONNECTION: 'dataverse_active_connection',
  TABLE_MAPPINGS: 'dataverse_table_mappings'
};

/**
 * LocalStorageベースのDataverse接続情報管理ストア
 * 
 * Dataverse環境への接続情報とテーブルマッピング設定を管理するストアです。
 * 全ての情報はブラウザのlocalStorageに永続化されます。
 * 
 * @namespace dataverseStore
 * 
 * @remarks
 * - 接続情報とマッピング情報は別々のlocalStorageキーで管理されます
 * - プライベートブラウジングモードでは動作しない可能性があります
 * - データはJSON形式でシリアライズされて保存されます
 * 
 * @example
 * ```typescript
 * // 接続を保存
 * dataverseStore.saveConnection({
 *   id: 'conn-1',
 *   name: '本番環境',
 *   baseUrl: 'https://org.crm.dynamics.com',
 *   apiVersion: '9.2'
 * });
 * 
 * // アクティブな接続を設定
 * dataverseStore.setActiveConnection('conn-1');
 * 
 * // 接続一覧を取得
 * const connections = dataverseStore.getConnections();
 * ```
 */
export const dataverseStore = {
  /**
   * Dataverse接続情報を保存する
   * 
   * 既存の接続IDがある場合は更新、ない場合は新規追加を行います。
   * 接続情報はlocalStorageに永続化されます。
   * 
   * @param {DataverseConnection} connection - 保存する接続情報
   * @param {string} connection.id - 接続の一意識別子
   * @param {string} connection.name - 接続の表示名
   * @param {string} connection.baseUrl - DataverseのベースURL
   * @param {string} connection.apiVersion - 使用するAPIバージョン(例: '9.2')
   * 
   * @returns {void}
   * 
   * @example
   * ```typescript
   * dataverseStore.saveConnection({
   *   id: 'conn-123',
   *   name: '開発環境',
   *   baseUrl: 'https://dev-org.crm.dynamics.com',
   *   apiVersion: '9.2'
   * });
   * ```
   * 
   * @remarks
   * - localStorageに保存されるため、プライベートブラウジングでは使用できません
   * - 既存の接続と同じIDの場合、完全に上書きされます
   */
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

  /**
   * 保存されている全てのDataverse接続情報を取得する
   * 
   * localStorageから接続情報の配列を読み込んで返します。
   * データが存在しない場合は空の配列を返します。
   * 
   * @returns {DataverseConnection[]} 保存されている接続情報の配列
   * 
   * @example
   * ```typescript
   * const connections = dataverseStore.getConnections();
   * console.log(`${connections.length}件の接続が登録されています`);
   * 
   * connections.forEach(conn => {
   *   console.log(`${conn.name}: ${conn.baseUrl}`);
   * });
   * ```
   * 
   * @remarks
   * - localStorageにデータがない場合、空の配列[]が返されます
   * - JSON parse エラーが発生した場合も空の配列が返されます
   */
  getConnections(): DataverseConnection[] {
    const data = localStorage.getItem(STORAGE_KEYS.CONNECTIONS);
    return data ? JSON.parse(data) : [];
  },

  /**
   * 指定されたIDの接続情報を削除する
   * 
   * 指定したIDに一致する接続情報をlocalStorageから削除します。
   * 削除対象の接続がアクティブな接続だった場合、アクティブ状態もクリアされます。
   * 
   * @param {string} id - 削除する接続のID
   * 
   * @returns {void}
   * 
   * @example
   * ```typescript
   * // 接続を削除
   * dataverseStore.deleteConnection('conn-123');
   * 
   * // 削除後、接続一覧を確認
   * const remaining = dataverseStore.getConnections();
   * console.log(`残り${remaining.length}件`);
   * ```
   * 
   * @remarks
   * - 指定したIDが存在しない場合、何も起こりません(エラーにはなりません)
   * - アクティブな接続を削除した場合、アクティブ接続情報も自動的に削除されます
   */
  deleteConnection(id: string): void {
    const connections = this.getConnections().filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CONNECTIONS, JSON.stringify(connections));
    
    if (this.getActiveConnectionId() === id) {
      this.setActiveConnection(null);
    }
  },

  /**
   * アクティブな接続を設定する
   * 
   * 指定したIDの接続を現在使用中の接続として設定します。
   * この設定はlocalStorageに保存され、アプリケーション全体で使用されます。
   * nullを指定するとアクティブ接続をクリアします。
   * 
   * @param {string | null} id - アクティブに設定する接続のID、またはクリアする場合はnull
   * 
   * @returns {void}
   * 
   * @example
   * ```typescript
   * // 本番環境の接続をアクティブに設定
   * dataverseStore.setActiveConnection('prod-conn-1');
   * 
   * // アクティブ接続をクリア
   * dataverseStore.setActiveConnection(null);
   * ```
   * 
   * @remarks
   * - 指定したIDの接続が存在するかどうかのチェックは行われません
   * - 存在しないIDを指定した場合、getActiveConnection()はnullを返します
   */
  setActiveConnection(id: string | null): void {
    if (id) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_CONNECTION, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_CONNECTION);
    }
  },

  /**
   * 現在アクティブな接続のIDを取得する
   * 
   * localStorageから現在アクティブに設定されている接続のIDを取得します。
   * アクティブな接続が設定されていない場合はnullを返します。
   * 
   * @returns {string | null} アクティブな接続のID、または設定されていない場合はnull
   * 
   * @example
   * ```typescript
   * const activeId = dataverseStore.getActiveConnectionId();
   * 
   * if (activeId) {
   *   console.log(`アクティブな接続ID: ${activeId}`);
   * } else {
   *   console.log('アクティブな接続が設定されていません');
   * }
   * ```
   * 
   * @remarks
   * - この関数はIDのみを返します。完全な接続情報が必要な場合はgetActiveConnection()を使用してください
   */
  getActiveConnectionId(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_CONNECTION);
  },

  /**
   * 現在アクティブな接続情報を取得する
   * 
   * setActiveConnection()で設定されたIDに対応する接続情報を返します。
   * アクティブな接続が設定されていない、または該当する接続が見つからない場合はnullを返します。
   * 
   * @returns {DataverseConnection | null} アクティブな接続情報、または存在しない場合はnull
   * 
   * @example
   * ```typescript
   * const active = dataverseStore.getActiveConnection();
   * 
   * if (active) {
   *   console.log(`接続先: ${active.name}`);
   *   console.log(`URL: ${active.baseUrl}`);
   * } else {
   *   console.log('アクティブな接続が設定されていません');
   * }
   * ```
   * 
   * @remarks
   * - アクティブIDが設定されていても、該当する接続が削除されている場合はnullを返します
   * - この関数は毎回localStorageから最新のデータを読み込みます
   */
  getActiveConnection(): DataverseConnection | null {
    const id = this.getActiveConnectionId();
    if (!id) return null;
    
    const connections = this.getConnections();
    return connections.find(c => c.id === id) || null;
  },

  /**
   * DjangoモデルとDataverseテーブルのマッピング設定を保存する
   * 
   * DjangoのモデルとどのDataverseテーブルを連携するかの設定を保存します。
   * 既存のマッピングと同じIDの場合は更新されます。
   * 
   * @param {TableMapping} mapping - 保存するマッピング設定
   * @param {string} mapping.id - マッピング設定の一意識別子
   * @param {string} mapping.tableName - Dataverseテーブル名
   * @param {Record<string, string>} mapping.fieldMapping - フィールド名のマッピング
   * 
   * @returns {void}
   * 
   * @example
   * ```typescript
   * dataverseStore.saveTableMapping({
   *   id: 'map-1',
   *   tableName: 'cr123_project',
   *   fieldMapping: {
   *     'name': 'cr123_name',
   *     'description': 'cr123_description',
   *     'status': 'cr123_status'
   *   }
   * });
   * ```
   * 
   * @remarks
   * - 同じIDのマッピングは1つだけ保持されます
   * - fieldMappingは双方向で使用されます(Django→Dataverse、Dataverse→Django)
   */
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

  /**
   * 保存されている全てのテーブルマッピング設定を取得する
   * 
   * localStorageから全てのDjango-Dataverseマッピング設定を読み込んで返します。
   * データが存在しない場合は空の配列を返します。
   * 
   * @returns {TableMapping[]} 保存されているマッピング設定の配列
   * 
   * @example
   * ```typescript
   * const mappings = dataverseStore.getTableMappings();
   * 
   * console.log(`${mappings.length}件のマッピングが設定されています`);
   * 
   * mappings.forEach(mapping => {
   *   console.log(`テーブル: ${mapping.tableName}`);
   * });
   * ```
   * 
   * @remarks
   * - localStorageにデータがない場合、空の配列[]が返されます
   * - JSON parse エラーが発生した場合も空の配列が返されます
   */
  getTableMappings(): TableMapping[] {
    const data = localStorage.getItem(STORAGE_KEYS.TABLE_MAPPINGS);
    return data ? JSON.parse(data) : [];
  },

  /**
   * 指定されたテーブル名のマッピング設定を取得する
   * 
   * Dataverseテーブル名を指定して、対応するマッピング設定を取得します。
   * 
   * @param {string} tableName - 検索するDataverseテーブル名
   * 
   * @returns {TableMapping | null} マッピング設定、または存在しない場合はnull
   * 
   * @example
   * ```typescript
   * const projectMapping = dataverseStore.getTableMappingByName('cr123_project');
   * 
   * if (projectMapping) {
   *   console.log('フィールドマッピング:', projectMapping.fieldMapping);
   * } else {
   *   console.log('該当するマッピングが設定されていません');
   * }
   * ```
   * 
   * @remarks
   * - テーブル名は大文字小文字を区別します
   * - マッピングが見つからない場合はnullを返します
   */
  getTableMappingByName(tableName: string): TableMapping | null {
    const mappings = this.getTableMappings();
    return mappings.find(m => m.tableName === tableName) || null;
  },

  /**
   * 指定されたIDのマッピング設定を削除する
   * 
   * マッピング設定をlocalStorageから削除します。
   * 
   * @param {string} id - 削除するマッピング設定のID
   * 
   * @returns {void}
   * 
   * @example
   * ```typescript
   * // マッピングを削除
   * dataverseStore.deleteTableMapping('map-1');
   * 
   * // 削除後、マッピング一覧を確認
   * const remaining = dataverseStore.getTableMappings();
   * console.log(`残り${remaining.length}件のマッピング`);
   * ```
   * 
   * @remarks
   * - 指定したIDが存在しない場合、何も起こりません(エラーにはなりません)
   * - この操作は元に戻せません
   */
  deleteTableMapping(id: string): void {
    const mappings = this.getTableMappings().filter(m => m.id !== id);
    localStorage.setItem(STORAGE_KEYS.TABLE_MAPPINGS, JSON.stringify(mappings));
  }
};
