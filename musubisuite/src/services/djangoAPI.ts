import axios, { type AxiosInstance, type AxiosError } from 'axios';
import type { Project, Client, Member, Task, ActivityLog } from '@/types';

/**
 * Django REST Framework APIクライアント
 * 
 * バックエンドDjango APIとの通信を管理するクライアントクラスです。
 * JWT認証、リクエスト/レスポンスインターセプター、エラーハンドリングを提供します。
 * 
 * @class DjangoAPIClient
 * 
 * @remarks
 * - シングルトンパターンで実装されています
 * - JWT トークンは localStorage で管理されます
 * - 401エラー発生時は自動でトークンをクリアします
 * 
 * @see {@link https://axios-http.com/docs/interceptors}
 */
class DjangoAPIClient {
  private api: AxiosInstance;
  private accessToken: string | null = null;

  constructor() {
    // Axiosインスタンスの初期化
    // 環境変数からベースURLを取得、なければローカル開発環境を使用
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
      timeout: 10000, // 10秒でタイムアウト
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // リクエストインターセプター
    // 全てのAPIリクエストに自動的にJWTトークンを付与します
    this.api.interceptors.request.use(
      (config) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // レスポンスインターセプター
    // 401エラー(認証エラー)をキャッチし、トークンをクリアします
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // トークンが無効または期限切れの場合、ローカルストレージから削除
          this.clearToken();
        }
        return Promise.reject(error);
      }
    );

    // 初期化時にローカルストレージからトークンを読み込み
    this.loadToken();
  }

  /**
   * ローカルストレージからアクセストークンを読み込む
   * 
   * アプリケーション起動時または再読み込み時に、
   * 保存されているアクセストークンを復元します。
   * 
   * @private
   * 
   * @remarks
   * トークンが存在しない場合は何もしません
   */
  private loadToken(): void {
    const token = localStorage.getItem('access_token');
    if (token) {
      this.accessToken = token;
    }
  }

  /**
   * アクセストークンとリフレッシュトークンを保存する
   * 
   * ログイン成功時やトークンリフレッシュ時に呼び出され、
   * トークンをローカルストレージに永続化します。
   * 
   * @private
   * @param {string} accessToken - アクセストークン(短命)
   * @param {string} refreshToken - リフレッシュトークン(長命)
   * 
   * @remarks
   * - アクセストークン: APIリクエストに使用(有効期限: 1時間)
   * - リフレッシュトークン: アクセストークンの更新に使用(有効期限: 7日間)
   */
  private saveToken(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken;
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }

  /**
   * 保存されているトークンをクリアする
   * 
   * ログアウト時や認証エラー発生時に呼び出され、
   * メモリとローカルストレージからトークンを削除します。
   * 
   * @private
   * 
   * @remarks
   * この操作後は認証が必要なAPIを呼び出せなくなります
   */
  private clearToken(): void {
    this.accessToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  /**
   * ユーザーログインを実行する
   * 
   * ユーザー名とパスワードでDjango APIに認証し、
   * JWTトークンを取得・保存します。
   * 
   * @param {string} username - ユーザー名
   * @param {string} password - パスワード
   * @returns {Promise<{ access: string; refresh: string }>} アクセストークンとリフレッシュトークン
   * 
   * @throws {Error} ユーザー名またはパスワードが間違っている場合
   * @throws {Error} ネットワークエラーが発生した場合
   * 
   * @example
   * ```typescript
   * try {
   *   const { access, refresh } = await djangoAPI.login('user@example.com', 'password');
   *   console.log('ログイン成功');
   * } catch (error) {
   *   console.error('ログイン失敗:', error);
   * }
   * ```
   */
  async login(username: string, password: string): Promise<{ access: string; refresh: string }> {
    const response = await this.api.post('/auth/token/', {
      username,
      password,
    });
    this.saveToken(response.data.access, response.data.refresh);
    return response.data;
  }

  /**
   * ユーザーをログアウトさせる
   * 
   * ローカルに保存されているトークンをクリアします。
   * サーバー側でのトークン無効化は行いません。
   * 
   * @example
   * ```typescript
   * djangoAPI.logout();
   * // ログイン画面にリダイレクト
   * router.push('/login');
   * ```
   * 
   * @remarks
   * この操作は即座に実行され、元に戻すことはできません
   */
  logout(): void {
    this.clearToken();
  }

  /**
   * アクセストークンを更新する
   * 
   * 保存されているリフレッシュトークンを使用して、
   * 新しいアクセストークンを取得します。
   * 
   * @returns {Promise<{ access: string }>} 新しいアクセストークン
   * 
   * @throws {Error} リフレッシュトークンが存在しない場合
   * @throws {Error} リフレッシュトークンが無効または期限切れの場合
   * 
   * @example
   * ```typescript
   * try {
   *   await djangoAPI.refreshToken();
   *   console.log('トークン更新成功');
   * } catch (error) {
   *   console.error('トークン更新失敗:', error);
   *   // 再ログインが必要
   * }
   * ```
   * 
   * @remarks
   * - アクセストークンの有効期限は通常1時間です
   * - リフレッシュトークンの有効期限は通常7日間です
   * - リフレッシュが失敗した場合は再ログインが必要です
   */
  async refreshToken(): Promise<{ access: string }> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('リフレッシュトークンがありません');
    }

    const response = await this.api.post('/auth/token/refresh/', {
      refresh: refreshToken,
    });
    this.saveToken(response.data.access, refreshToken);
    return response.data;
  }

  // ========================================
  // プロジェクト API
  // ========================================

  /**
   * プロジェクト一覧を取得する
   * 
   * フィルタリング、検索、ソート、ページネーションをサポートします。
   * 
   * @param {Object} [params] - クエリパラメータ
   * @param {string} [params.status] - ステータスフィルター ('planning', 'active', など)
   * @param {string} [params.priority] - 優先度フィルター ('low', 'medium', 'high', 'urgent')
   * @param {string} [params.search] - 検索キーワード(プロジェクト名・説明で部分一致)
   * @param {string} [params.ordering] - ソート順('-created_at', 'name', など)
   * @param {number} [params.page] - ページ番号(1始まり)
   * @returns {Promise<{ results: any[]; count: number; next: string | null; previous: string | null }>} プロジェクト一覧とページネーション情報
   * 
   * @throws {Error} APIリクエストが失敗した場合
   * 
   * @example
   * ```typescript
   * // 全プロジェクトを取得
   * const data = await djangoAPI.getProjects();
   * 
   * // 進行中のプロジェクトのみ取得
   * const activeProjects = await djangoAPI.getProjects({ status: 'active' });
   * 
   * // 検索とソート
   * const results = await djangoAPI.getProjects({
   *   search: 'テスト',
   *   ordering: '-created_at'
   * });
   * ```
   * 
   * @remarks
   * デフォルトのページサイズは20件です
   */
  async getProjects(params?: {
    status?: string;
    priority?: string;
    search?: string;
    ordering?: string;
    page?: number;
  }): Promise<{ results: any[]; count: number; next: string | null; previous: string | null }> {
    const response = await this.api.get('/projects/', { params });
    return response.data;
  }

  /**
   * プロジェクトの詳細情報を取得する
   * 
   * 指定されたIDのプロジェクトの完全な詳細情報を取得します。
   * クライアント情報、メンバー、添付ファイル、コメントを含みます。
   * 
   * @param {string} id - プロジェクトID
   * @returns {Promise<any>} プロジェクト詳細データ
   * 
   * @throws {Error} プロジェクトが見つからない場合(404)
   * @throws {Error} APIリクエストが失敗した場合
   * 
   * @example
   * ```typescript
   * try {
   *   const project = await djangoAPI.getProject('123');
   *   console.log('プロジェクト名:', project.name);
   * } catch (error) {
   *   console.error('プロジェクトの取得に失敗:', error);
   * }
   * ```
   */
  async getProject(id: string): Promise<any> {
    const response = await this.api.get(`/projects/${id}/`);
    return response.data;
  }

  /**
   * 新しいプロジェクトを作成する
   * 
   * プロジェクトの基本情報を登録し、新規プロジェクトを作成します。
   * 
   * @param {Object} data - プロジェクト作成データ
   * @param {string} data.name - プロジェクト名(必須)
   * @param {string} data.description - プロジェクト説明
   * @param {string} data.status - ステータス
   * @param {string} data.priority - 優先度
   * @param {string} data.client_id - クライアントID(必須)
   * @param {string} data.start_date - 開始日(YYYY-MM-DD形式)
   * @param {string} data.end_date - 終了日(YYYY-MM-DD形式)
   * @param {number} [data.budget] - 予算(任意)
   * @param {string} [data.owner_id] - オーナーのメンバーID(任意)
   * @param {string[]} [data.member_ids] - メンバーIDの配列(任意)
   * @param {string[]} [data.tags] - タグの配列(任意)
   * @returns {Promise<any>} 作成されたプロジェクトデータ
   * 
   * @throws {Error} バリデーションエラーが発生した場合
   * @throws {Error} APIリクエストが失敗した場合
   * 
   * @example
   * ```typescript
   * const newProject = await djangoAPI.createProject({
   *   name: '新規プロジェクト',
   *   description: 'プロジェクトの説明',
   *   status: 'planning',
   *   priority: 'medium',
   *   client_id: '1',
   *   start_date: '2025-01-01',
   *   end_date: '2025-12-31',
   *   budget: 1000000,
   *   tags: ['重要', '新規']
   * });
   * console.log('作成されたプロジェクトID:', newProject.id);
   * ```
   * 
   * @remarks
   * - 開始日は終了日より前である必要があります
   * - クライアントIDは事前に存在するクライアントのIDを指定してください
   */
  async createProject(data: {
    name: string;
    description: string;
    status: string;
    priority: string;
    client_id: string;
    start_date: string;
    end_date: string;
    budget?: number;
    owner_id?: string;
    member_ids?: string[];
    tags?: string[];
  }): Promise<any> {
    const response = await this.api.post('/projects/', data);
    return response.data;
  }

  /**
   * プロジェクト情報を更新する
   * 
   * 部分更新(PATCH)をサポートしており、変更したいフィールドのみ指定できます。
   * 
   * @param {string} id - プロジェクトID
   * @param {Partial<Project>} data - 更新するフィールド
   * @returns {Promise<any>} 更新されたプロジェクトデータ
   * 
   * @throws {Error} プロジェクトが見つからない場合(404)
   * @throws {Error} バリデーションエラーが発生した場合
   * 
   * @example
   * ```typescript
   * // ステータスのみ更新
   * await djangoAPI.updateProject('123', {
   *   status: 'completed'
   * });
   * 
   * // 複数フィールドを更新
   * await djangoAPI.updateProject('123', {
   *   progress: 75,
   *   priority: 'high'
   * });
   * ```
   */
  async updateProject(id: string, data: Partial<Project>): Promise<any> {
    const response = await this.api.patch(`/projects/${id}/`, data);
    return response.data;
  }

  /**
   * プロジェクトを削除する
   * 
   * 指定されたIDのプロジェクトを削除します。
   * この操作は元に戻すことができません。
   * 
   * @param {string} id - プロジェクトID
   * @returns {Promise<void>}
   * 
   * @throws {Error} プロジェクトが見つからない場合(404)
   * @throws {Error} 権限がない場合(403)
   * 
   * @example
   * ```typescript
   * try {
   *   await djangoAPI.deleteProject('123');
   *   console.log('プロジェクトを削除しました');
   * } catch (error) {
   *   console.error('削除に失敗:', error);
   * }
   * ```
   * 
   * @remarks
   * プロジェクトに紐づくタスク、コメント、添付ファイルも一緒に削除されます
   */
  async deleteProject(id: string): Promise<void> {
    await this.api.delete(`/projects/${id}/`);
  }

  /**
   * ダッシュボード統計情報を取得する
   * 
   * プロジェクトの総数、ステータス別の集計など、
   * ダッシュボード表示に必要な統計データを取得します。
   * 
   * @returns {Promise<{ total_projects: number; active_projects: number; completed_projects: number }>} 統計情報
   * 
   * @throws {Error} APIリクエストが失敗した場合
   * 
   * @example
   * ```typescript
   * const stats = await djangoAPI.getDashboardStats();
   * console.log('総プロジェクト数:', stats.total_projects);
   * console.log('進行中:', stats.active_projects);
   * console.log('完了:', stats.completed_projects);
   * ```
   * 
   * @remarks
   * キャッシュされる可能性があるため、リアルタイム性が必要な場合は注意してください
   */
  async getDashboardStats(): Promise<{ 
    total_projects: number; 
    active_projects: number; 
    completed_projects: number;
  }> {
    const response = await this.api.get('/projects/dashboard_stats/');
    return response.data;
  }

  // ========================================
  // Clients API
  // ========================================

  /**
   * クライアント一覧を取得
   */
  async getClients(params?: {
    industry?: string;
    search?: string;
    page?: number;
  }) {
    const response = await this.api.get('/clients/', { params });
    // Django APIのレスポンスをフロントエンドの型に変換
    const data = response.data;
    if (data.results) {
      data.results = data.results.map((client: any) => ({
        id: client.id,
        name: client.name,
        companyName: client.company_name,
        email: client.email,
        phone: client.phone,
        address: client.address,
        industry: client.industry,
        note: client.note,
        createdAt: new Date(client.created_at),
        updatedAt: new Date(client.updated_at),
      }));
    }
    return data;
  }

  /**
   * クライアント詳細を取得
   */
  async getClient(id: string) {
    const response = await this.api.get(`/clients/${id}/`);
    const client = response.data;
    return {
      id: client.id,
      name: client.name,
      companyName: client.company_name,
      email: client.email,
      phone: client.phone,
      address: client.address,
      industry: client.industry,
      note: client.note,
      createdAt: new Date(client.created_at),
      updatedAt: new Date(client.updated_at),
    };
  }

  /**
   * クライアントを作成
   */
  async createClient(data: {
    name: string;
    company_name: string;
    email: string;
    phone?: string;
    address?: string;
    industry?: string;
    note?: string;
  }) {
    const response = await this.api.post('/clients/', data);
    return response.data;
  }

  /**
   * クライアントを更新
   */
  async updateClient(id: string, data: Partial<Client>) {
    const response = await this.api.patch(`/clients/${id}/`, data);
    return response.data;
  }

  /**
   * クライアントを削除
   */
  async deleteClient(id: string) {
    await this.api.delete(`/clients/${id}/`);
  }

  // ========================================
  // Tasks API
  // ========================================

  /**
   * タスク一覧を取得
   */
  async getTasks(params?: {
    project?: string;
    status?: string;
    priority?: string;
    assignee?: string;
    search?: string;
    page?: number;
  }) {
    const response = await this.api.get('/tasks/', { params });
    return response.data;
  }

  /**
   * タスクを作成
   */
  async createTask(data: {
    project: string;
    title: string;
    description: string;
    status?: string;
    priority?: string;
    assignee_id?: string;
    due_date?: string;
    estimated_hours?: number;
    created_by_id: string;
  }) {
    const response = await this.api.post('/tasks/', data);
    return response.data;
  }

  /**
   * タスクを更新
   */
  async updateTask(id: string, data: Partial<Task>) {
    const response = await this.api.patch(`/tasks/${id}/`, data);
    return response.data;
  }

  /**
   * タスクを削除
   */
  async deleteTask(id: string) {
    await this.api.delete(`/tasks/${id}/`);
  }

  // ========================================
  // Members API
  // ========================================

  /**
   * メンバー一覧を取得
   */
  async getMembers(params?: {
    role?: string;
    department?: string;
    search?: string;
    page?: number;
  }) {
    const response = await this.api.get('/members/', { params });
    return response.data;
  }

  /**
   * メンバー詳細を取得
   */
  async getMember(id: string) {
    const response = await this.api.get(`/members/${id}/`);
    return response.data;
  }

  // ========================================
  // Activities API
  // ========================================

  /**
   * アクティビティログ一覧を取得
   */
  async getActivities(params?: {
    project?: string;
    user?: string;
    page?: number;
  }) {
    const response = await this.api.get('/activities/', { params });
    return response.data;
  }
}

// シングルトンインスタンス
export const djangoAPI = new DjangoAPIClient();
