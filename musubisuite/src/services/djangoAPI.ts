import axios, { type AxiosInstance, type AxiosError } from 'axios';
import type { Project, Client, Task } from '@/types';

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
   * クライアント一覧を取得する
   * 
   * フィルタリング、検索、ページネーションをサポートします。
   * 
   * @param {Object} [params] - クエリパラメータ
   * @param {string} [params.industry] - 業種フィルター
   * @param {string} [params.search] - 検索キーワード(クライアント名、会社名で部分一致)
   * @param {number} [params.page] - ページ番号(1始まり)
   * @returns {Promise<{ results: Client[]; count: number; next: string | null; previous: string | null }>} クライアント一覧とページネーション情報
   * 
   * @throws {Error} APIリクエストが失敗した場合
   * 
   * @example
   * ```typescript
   * // 全クライアントを取得
   * const data = await djangoAPI.getClients();
   * 
   * // IT業界のクライアントのみ取得
   * const itClients = await djangoAPI.getClients({ industry: 'IT' });
   * 
   * // 検索とページネーション
   * const results = await djangoAPI.getClients({
   *   search: '株式会社',
   *   page: 2
   * });
   * ```
   * 
   * @remarks
   * - レスポンスはDjangoのフィールド名からフロントエンドの型に変換されます
   * - デフォルトのページサイズは20件です
   */
  async getClients(params?: {
    industry?: string;
    search?: string;
    page?: number;
  }) {
    const response = await this.api.get('/clients/', { params });
    return response.data;
  }

  /**
   * 指定されたIDのクライアント詳細情報を取得する
   * 
   * @param {string} id - クライアントID
   * @returns {Promise<Client>} クライアント詳細データ
   * 
   * @throws {Error} クライアントが見つからない場合(404)
   * @throws {Error} APIリクエストが失敗した場合
   * 
   * @example
   * ```typescript
   * try {
   *   const client = await djangoAPI.getClient('123');
   *   console.log('会社名:', client.companyName);
   *   console.log('担当者:', client.name);
   * } catch (error) {
   *   console.error('クライアントの取得に失敗:', error);
   * }
   * ```
   */
  async getClient(id: string) {
    const response = await this.api.get(`/clients/${id}/`);
    return response.data;
  }

  /**
   * 新しいクライアントを作成する
   * 
   * @param {Object} data - クライアント作成データ
   * @param {string} data.name - 担当者名(必須)
   * @param {string} data.company_name - 会社名(必須)
   * @param {string} data.email - メールアドレス(必須)
   * @param {string} [data.phone] - 電話番号
   * @param {string} [data.address] - 住所
   * @param {string} [data.industry] - 業種
   * @param {string} [data.note] - 備考
   * @returns {Promise<any>} 作成されたクライアントデータ
   * 
   * @throws {Error} バリデーションエラーが発生した場合
   * @throws {Error} APIリクエストが失敗した場合
   * 
   * @example
   * ```typescript
   * const newClient = await djangoAPI.createClient({
   *   name: '田中太郎',
   *   company_name: '株式会社サンプル',
   *   email: 'tanaka@sample.co.jp',
   *   phone: '03-1234-5678',
   *   industry: 'IT',
   *   note: '新規顧客'
   * });
   * console.log('作成されたクライアントID:', newClient.id);
   * ```
   */
  async createClient(data: {
    company_name: string;
    email: string;
    phone?: string;
    address?: string;
    industry?: string;
    note?: string;
    [key: string]: any;
  }) {
    const response = await this.api.post('/clients/', data);
    return response.data;
  }

  /**
   * クライアント情報を更新する
   * 
   * 部分更新(PATCH)をサポートしており、変更したいフィールドのみ指定できます。
   * 
   * @param {string} id - クライアントID
   * @param {Partial<Client>} data - 更新するフィールド
   * @returns {Promise<any>} 更新されたクライアントデータ
   * 
   * @throws {Error} クライアントが見つからない場合(404)
   * @throws {Error} バリデーションエラーが発生した場合
   * 
   * @example
   * ```typescript
   * // メールアドレスのみ更新
   * await djangoAPI.updateClient('123', {
   *   email: 'new-email@example.com'
   * });
   * 
   * // 複数フィールドを更新
   * await djangoAPI.updateClient('123', {
   *   phone: '03-9876-5432',
   *   note: '更新された備考'
   * });
   * ```
   */
  async updateClient(id: string, data: Partial<Client>) {
    const response = await this.api.patch(`/clients/${id}/`, data);
    return response.data;
  }

  /**
   * クライアントを削除する
   * 
   * 指定されたIDのクライアントを削除します。
   * この操作は元に戻せません。
   * 
   * @param {string} id - 削除するクライアントのID
   * @returns {Promise<void>}
   * 
   * @throws {Error} クライアントが見つからない場合(404)
   * @throws {Error} 権限がない場合(403)
   * 
   * @example
   * ```typescript
   * try {
   *   await djangoAPI.deleteClient('123');
   *   console.log('クライアントを削除しました');
   * } catch (error) {
   *   console.error('削除に失敗:', error);
   * }
   * ```
   * 
   * @remarks
   * クライアントに紐づくプロジェクトがある場合、カスケード削除される可能性があります
   */
  async deleteClient(id: string) {
    await this.api.delete(`/clients/${id}/`);
  }

  // ========================================
  // Tasks API
  // ========================================

  /**
   * タスク一覧を取得する
   * 
   * プロジェクト、ステータス、優先度、担当者でフィルタリングできます。
   * 
   * @param {Object} [params] - クエリパラメータ
   * @param {string} [params.project] - プロジェクトIDフィルター
   * @param {string} [params.status] - ステータスフィルター
   * @param {string} [params.priority] - 優先度フィルター
   * @param {string} [params.assignee] - 担当者IDフィルター
   * @param {string} [params.search] - 検索キーワード
   * @param {number} [params.page] - ページ番号
   * @returns {Promise<any>} タスク一覧データ
   * 
   * @example
   * ```typescript
   * // 特定プロジェクトのタスクを取得
   * const tasks = await djangoAPI.getTasks({ project: '123' });
   * 
   * // 担当者とステータスでフィルタリング
   * const myTasks = await djangoAPI.getTasks({
   *   assignee: 'user-456',
   *   status: 'in-progress'
   * });
   * ```
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
   * 新しいタスクを作成する
   * 
   * @param {Object} data - タスク作成データ
   * @param {string} data.project - プロジェクトID(必須)
   * @param {string} data.title - タスクタイトル(必須)
   * @param {string} data.description - タスク説明(必須)
   * @param {string} [data.status] - ステータス
   * @param {string} [data.priority] - 優先度
   * @param {string} [data.assignee_id] - 担当者ID
   * @param {string} [data.due_date] - 期限(YYYY-MM-DD形式)
   * @param {number} [data.estimated_hours] - 見積もり時間
   * @param {string} data.created_by_id - 作成者ID(必須)
   * @returns {Promise<any>} 作成されたタスクデータ
   * 
   * @example
   * ```typescript
   * const newTask = await djangoAPI.createTask({
   *   project: 'project-123',
   *   title: 'データベース設計',
   *   description: 'テーブル構造を設計する',
   *   status: 'todo',
   *   priority: 'high',
   *   assignee_id: 'user-456',
   *   due_date: '2025-12-31',
   *   estimated_hours: 8,
   *   created_by_id: 'user-789'
   * });
   * ```
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
   * タスク情報を更新する
   * 
   * @param {string} id - タスクID
   * @param {Partial<Task>} data - 更新するフィールド
   * @returns {Promise<any>} 更新されたタスクデータ
   * 
   * @example
   * ```typescript
   * // ステータスを完了に変更
   * await djangoAPI.updateTask('task-123', {
   *   status: 'completed'
   * });
   * ```
   */
  async updateTask(id: string, data: Partial<Task>) {
    const response = await this.api.patch(`/tasks/${id}/`, data);
    return response.data;
  }

  /**
   * タスクを削除する
   * 
   * @param {string} id - 削除するタスクのID
   * @returns {Promise<void>}
   * 
   * @example
   * ```typescript
   * await djangoAPI.deleteTask('task-123');
   * ```
   */
  async deleteTask(id: string) {
    await this.api.delete(`/tasks/${id}/`);
  }

  // ========================================
  // Members API
  // ========================================

  /**
   * メンバー一覧を取得する
   * 
   * 役割、部署、検索キーワードでフィルタリングできます。
   * 
   * @param {Object} [params] - クエリパラメータ
   * @param {string} [params.role] - 役割フィルター
   * @param {string} [params.department] - 部署フィルター
   * @param {string} [params.search] - 検索キーワード(名前、メールで部分一致)
   * @param {number} [params.page] - ページ番号
   * @returns {Promise<any>} メンバー一覧データ
   * 
   * @example
   * ```typescript
   * // 開発部のメンバーを取得
   * const devMembers = await djangoAPI.getMembers({
   *   department: 'development'
   * });
   * 
   * // マネージャー役割のメンバーを検索
   * const managers = await djangoAPI.getMembers({
   *   role: 'manager',
   *   search: '田中'
   * });
   * ```
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
   * 指定されたIDのメンバー詳細情報を取得する
   * 
   * @param {string} id - メンバーID
   * @returns {Promise<any>} メンバー詳細データ
   * 
   * @throws {Error} メンバーが見つからない場合(404)
   * 
   * @example
   * ```typescript
   * const member = await djangoAPI.getMember('member-123');
   * console.log('名前:', member.name);
   * console.log('部署:', member.department);
   * ```
   */
  async getMember(id: string) {
    const response = await this.api.get(`/members/${id}/`);
    return response.data;
  }

  // ========================================
  // Activities API
  // ========================================

  /**
   * アクティビティログ一覧を取得する
   * 
   * プロジェクトやユーザーの活動履歴を取得します。
   * 
   * @param {Object} [params] - クエリパラメータ
   * @param {string} [params.project] - プロジェクトIDフィルター
   * @param {string} [params.user] - ユーザーIDフィルター
   * @param {number} [params.page] - ページ番号
   * @returns {Promise<any>} アクティビティログ一覧データ
   * 
   * @example
   * ```typescript
   * // 特定プロジェクトのアクティビティを取得
   * const activities = await djangoAPI.getActivities({
   *   project: 'project-123'
   * });
   * 
   * // 特定ユーザーの活動履歴を取得
   * const userActivities = await djangoAPI.getActivities({
   *   user: 'user-456'
   * });
   * ```
   * 
   * @remarks
   * アクティビティログは時系列順(新しい順)で返されます
   */
  async getActivities(params?: {
    project?: string;
    user?: string;
    page?: number;
  }) {
    const response = await this.api.get('/activities/', { params });
    return response.data;
  }

  // ========================================
  // AI Settings API
  // ========================================

  /**
   * AI Provider一覧を取得する
   */
  async getAIProviders() {
    const response = await this.api.get('/ai-providers/');
    return response.data;
  }

  /**
   * AI Providerを作成する
   */
  async createAIProvider(data: any) {
    const response = await this.api.post('/ai-providers/', data);
    return response.data;
  }

  /**
   * AI Providerを更新する
   */
  async updateAIProvider(id: number, data: any) {
    const response = await this.api.put(`/ai-providers/${id}/`, data);
    return response.data;
  }

  /**
   * AI Providerを削除する
   */
  async deleteAIProvider(id: number) {
    await this.api.delete(`/ai-providers/${id}/`);
  }

  /**
   * AI Providerの接続テストを実行する
   */
  async testAIProviderConnection(id: number) {
    const response = await this.api.post(`/ai-providers/${id}/test_connection/`);
    return response.data;
  }

  /**
   * AI Providerにプロンプトを送信して応答をテストする
   */
  async testAIProviderWithPrompt(id: number, prompt: string) {
    // AI APIは応答に時間がかかる場合があるため、タイムアウトを60秒に設定
    const response = await this.api.post(`/ai-providers/${id}/test_prompt/`, {
      prompt
    }, {
      timeout: 60000  // 60秒
    });
    return response.data;
  }

  /**
   * 検索エンジン一覧を取得する
   */
  async getSearchEngines() {
    const response = await this.api.get('/search-engines/');
    return response.data;
  }

  /**
   * 検索エンジンを作成する
   */
  async createSearchEngine(data: any) {
    const response = await this.api.post('/search-engines/', data);
    return response.data;
  }

  /**
   * 検索エンジンを更新する
   */
  async updateSearchEngine(id: number, data: any) {
    const response = await this.api.put(`/search-engines/${id}/`, data);
    return response.data;
  }

  /**
   * 検索エンジンを削除する
   */
  async deleteSearchEngine(id: number) {
    await this.api.delete(`/search-engines/${id}/`);
  }

  /**
   * AI設定を取得する
   */
  async getAISettings() {
    const response = await this.api.get('/ai-settings/');
    return response.data;
  }

  /**
   * AI設定を更新する
   */
  async updateAISettings(data: any) {
    const response = await this.api.post('/ai-settings/', data);
    return response.data;
  }
}

// シングルトンインスタンス
export const djangoAPI = new DjangoAPIClient();
