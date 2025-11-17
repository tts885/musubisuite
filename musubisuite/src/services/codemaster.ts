import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// キャッシュの有効期限（5分）
const CACHE_DURATION = 5 * 60 * 1000;

export interface CodeMaster {
  id: number;
  category: string;
  code: string;
  name: string;
  name_en: string;
  description: string;
  sort_order: number;
  is_active: boolean;
  color?: string;
  icon?: string;
  parent_code?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CodeCategory {
  code: string;
  name: string;
  description: string;
  is_system: boolean;
  sort_order: number;
  is_active: boolean;
  codes_count: number;
}

export interface CodeCategoryWithCodes extends CodeCategory {
  codes: CodeMaster[];
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class CodeMasterService {
  private cache: Map<string, CacheEntry<any>> = new Map();

  /**
   * キャッシュをクリア
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * 特定のキャッシュを削除
   */
  clearCacheFor(key: string) {
    this.cache.delete(key);
  }

  /**
   * キャッシュからデータを取得
   */
  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * キャッシュにデータを保存
   */
  private setCache<T>(key: string, data: T) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * すべてのカテゴリを取得
   */
  async getCategories(): Promise<CodeCategory[]> {
    const cacheKey = 'categories';
    const cached = this.getFromCache<CodeCategory[]>(cacheKey);
    if (cached) return cached;

    const response = await axios.get(`${API_BASE_URL}/code-categories/`);
    const data = response.data;
    this.setCache(cacheKey, data);
    return data;
  }

  /**
   * カテゴリの詳細（コードを含む）を取得
   */
  async getCategoryWithCodes(categoryCode: string): Promise<CodeCategoryWithCodes> {
    const cacheKey = `category:${categoryCode}`;
    const cached = this.getFromCache<CodeCategoryWithCodes>(cacheKey);
    if (cached) return cached;

    const response = await axios.get(`${API_BASE_URL}/code-categories/${categoryCode}/`);
    const data = response.data;
    this.setCache(cacheKey, data);
    return data;
  }

  /**
   * カテゴリに属するコードを取得
   */
  async getCodesByCategory(categoryCode: string): Promise<CodeMaster[]> {
    const cacheKey = `codes:${categoryCode}`;
    const cached = this.getFromCache<CodeMaster[]>(cacheKey);
    if (cached) return cached;

    const response = await axios.get(`${API_BASE_URL}/codemasters/by_category/`, {
      params: { category: categoryCode },
    });
    const data = response.data;
    this.setCache(cacheKey, data);
    return data;
  }

  /**
   * 複数のカテゴリのコードを一括取得
   */
  async getBulkCodes(categories: string[]): Promise<Record<string, CodeMaster[]>> {
    const cacheKey = `bulk:${categories.sort().join(',')}`;
    const cached = this.getFromCache<Record<string, CodeMaster[]>>(cacheKey);
    if (cached) return cached;

    const response = await axios.get(`${API_BASE_URL}/codemasters/bulk/`, {
      params: { categories: categories.join(',') },
    });
    const data = response.data;
    this.setCache(cacheKey, data);
    return data;
  }

  /**
   * コードマスタを作成
   */
  async createCode(code: Partial<CodeMaster>): Promise<CodeMaster> {
    const response = await axios.post(`${API_BASE_URL}/codemasters/`, code);
    this.clearCacheFor(`codes:${code.category}`);
    this.clearCacheFor(`category:${code.category}`);
    return response.data;
  }

  /**
   * コードマスタを更新
   */
  async updateCode(id: number, code: Partial<CodeMaster>): Promise<CodeMaster> {
    const response = await axios.patch(`${API_BASE_URL}/codemasters/${id}/`, code);
    this.clearCacheFor(`codes:${code.category}`);
    this.clearCacheFor(`category:${code.category}`);
    return response.data;
  }

  /**
   * コードマスタを削除（論理削除）
   */
  async deleteCode(id: number, category: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/codemasters/${id}/`);
    this.clearCacheFor(`codes:${category}`);
    this.clearCacheFor(`category:${category}`);
  }

  /**
   * コードの並び順を更新
   */
  async reorderCodes(codes: { id: number; sort_order: number }[], category: string): Promise<CodeMaster[]> {
    const response = await axios.post(`${API_BASE_URL}/codemasters/reorder/`, { codes });
    this.clearCacheFor(`codes:${category}`);
    this.clearCacheFor(`category:${category}`);
    return response.data;
  }

  /**
   * カテゴリを作成
   */
  async createCategory(category: Partial<CodeCategory>): Promise<CodeCategory> {
    const response = await axios.post(`${API_BASE_URL}/code-categories/`, category);
    this.clearCacheFor('categories');
    return response.data;
  }

  /**
   * カテゴリを更新
   */
  async updateCategory(code: string, category: Partial<CodeCategory>): Promise<CodeCategory> {
    const response = await axios.patch(`${API_BASE_URL}/code-categories/${code}/`, category);
    this.clearCacheFor('categories');
    this.clearCacheFor(`category:${code}`);
    return response.data;
  }

  /**
   * カテゴリを削除
   */
  async deleteCategory(code: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/code-categories/${code}/`);
    this.clearCacheFor('categories');
    this.clearCacheFor(`category:${code}`);
  }
}

export const codeMasterService = new CodeMasterService();
