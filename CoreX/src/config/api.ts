/**
 * API設定
 */

// 環境変数またはデフォルト値を使用
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const API_CONFIG = {
  baseUrl: API_BASE_URL,
  endpoints: {
    dataverse: {
      testConnection: `${API_BASE_URL}/api/dataverse/test-connection/`,
      getTables: `${API_BASE_URL}/api/dataverse/get-tables/`,
      getRecords: `${API_BASE_URL}/api/dataverse/get-records/`,
      proxy: `${API_BASE_URL}/api/dataverse/proxy/`,
    }
  }
};
