/**
 * 案件管理システムの型定義
 * 
 * MusubiSuiteで使用される全てのTypeScript型定義を提供します。
 * フロントエンドとバックエンドのデータモデルの橋渡しを行います。
 * 
 * @module types
 * 
 * @remarks
 * - 全ての型は厳密な型安全性を提供します
 * - Django APIのレスポンス形式と一致しています
 * - 日付型は Date オブジェクトとして扱われます
 * 
 * @see {@link https://www.typescriptlang.org/docs/handbook/2/everyday-types.html}
 */

/**
 * プロジェクトステータス
 * 
 * プロジェクトの現在の状態を表します。
 * 
 * @typedef {'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled'} ProjectStatus
 * 
 * @example
 * ```typescript
 * const status: ProjectStatus = 'active';
 * 
 * // ステータス判定
 * if (status === 'completed') {
 *   console.log('プロジェクト完了');
 * }
 * ```
 */
export type ProjectStatus = 
  | 'planning'      // 計画中: プロジェクトの計画段階
  | 'active'        // 進行中: プロジェクト実行中
  | 'on-hold'       // 保留: 一時的に停止
  | 'completed'     // 完了: プロジェクト終了
  | 'cancelled';    // 中止: プロジェクト取り消し

/**
 * プロジェクト優先度
 * 
 * プロジェクトの重要度・緊急度を表します。
 * 
 * @typedef {'low' | 'medium' | 'high' | 'urgent'} ProjectPriority
 * 
 * @example
 * ```typescript
 * const priority: ProjectPriority = 'high';
 * 
 * // 色分けの例
 * const color = priority === 'urgent' ? 'red' : 
 *               priority === 'high' ? 'orange' : 
 *               priority === 'medium' ? 'yellow' : 'gray';
 * ```
 */
export type ProjectPriority = 
  | 'low'      // 低: 緊急性が低い
  | 'medium'   // 中: 通常の優先度
  | 'high'     // 高: 高い優先度
  | 'urgent';  // 緊急: 最優先事項

/**
 * タスクステータス
 * 
 * タスクの現在の進行状況を表します。
 * 
 * @typedef {'todo' | 'in-progress' | 'review' | 'done' | 'blocked'} TaskStatus
 * 
 * @example
 * ```typescript
 * const status: TaskStatus = 'in-progress';
 * 
 * // ステータスの進行
 * const nextStatus: TaskStatus = 
 *   status === 'todo' ? 'in-progress' :
 *   status === 'in-progress' ? 'review' :
 *   status === 'review' ? 'done' : status;
 * ```
 */
export type TaskStatus = 
  | 'todo'          // 未着手: タスク未開始
  | 'in-progress'   // 進行中: タスク実行中
  | 'review'        // レビュー中: レビュー待ち
  | 'done'          // 完了: タスク完了
  | 'blocked';      // ブロック: 進行が阻害されている

/**
 * メンバーの役割
 * 
 * プロジェクト内でのメンバーの権限レベルを表します。
 * 
 * @typedef {'owner' | 'admin' | 'member' | 'viewer'} MemberRole
 * 
 * @example
 * ```typescript
 * const role: MemberRole = 'admin';
 * 
 * // 権限チェック
 * const canEdit = role === 'owner' || role === 'admin';
 * const canDelete = role === 'owner';
 * ```
 */
export type MemberRole = 
  | 'owner'    // オーナー: 全権限
  | 'admin'    // 管理者: 編集権限
  | 'member'   // メンバー: 参照・作成権限
  | 'viewer';  // 閲覧者: 参照のみ

/**
 * プロジェクト(案件)
 * 
 * 企業のプロジェクト情報を表すインターフェースです。
 * 
 * @interface Project
 * 
 * @property {string} id - プロジェクトID(UUID)
 * @property {string} name - プロジェクト名(最大200文字)
 * @property {string} description - プロジェクトの詳細説明
 * @property {ProjectStatus} status - プロジェクトのステータス
 * @property {ProjectPriority} priority - プロジェクトの優先度
 * @property {string} clientId - 関連クライアントのID
 * @property {Date} startDate - プロジェクト開始日
 * @property {Date} endDate - プロジェクト終了日
 * @property {number} [budget] - 予算(円単位、任意)
 * @property {number} progress - 進捗率(0-100)
 * @property {string} ownerId - プロジェクトオーナーのID
 * @property {string[]} memberIds - プロジェクトメンバーのID配列
 * @property {string[]} tags - タグの配列
 * @property {Date} createdAt - 作成日時
 * @property {Date} updatedAt - 最終更新日時
 * 
 * @example
 * ```typescript
 * const project: Project = {
 *   id: '123',
 *   name: '新規プロジェクト',
 *   description: 'プロジェクトの説明',
 *   status: 'active',
 *   priority: 'high',
 *   clientId: '456',
 *   startDate: new Date('2025-01-01'),
 *   endDate: new Date('2025-12-31'),
 *   budget: 1000000,
 *   progress: 50,
 *   ownerId: '789',
 *   memberIds: ['789', '012'],
 *   tags: ['重要', '新規'],
 *   createdAt: new Date(),
 *   updatedAt: new Date()
 * };
 * ```
 * 
 * @remarks
 * - budgetは任意フィールドです(予算未定のプロジェクトに対応)
 * - progressは0-100の範囲で指定します
 * - endDateはstartDate以降である必要があります
 */
export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  clientId: string;
  startDate: Date;
  endDate: Date;
  budget?: number;
  progress: number; // 0-100
  ownerId: string;
  memberIds: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * タスク
 * 
 * プロジェクト内の個別タスクを表すインターフェースです。
 * 
 * @interface Task
 * 
 * @property {string} id - タスクID(UUID)
 * @property {string} projectId - 関連プロジェクトのID
 * @property {string} title - タスク名(最大200文字)
 * @property {string} description - タスクの詳細説明
 * @property {TaskStatus} status - タスクのステータス
 * @property {ProjectPriority} priority - タスクの優先度
 * @property {string} [assigneeId] - 担当者のID(任意)
 * @property {Date} [dueDate] - 期限(任意)
 * @property {number} [estimatedHours] - 見積もり時間(任意)
 * @property {number} [actualHours] - 実績時間(任意)
 * @property {string} createdBy - 作成者のID
 * @property {Date} createdAt - 作成日時
 * @property {Date} updatedAt - 最終更新日時
 * 
 * @example
 * ```typescript
 * const task: Task = {
 *   id: '123',
 *   projectId: '456',
 *   title: '実装タスク',
 *   description: 'タスクの説明',
 *   status: 'in-progress',
 *   priority: 'high',
 *   assigneeId: '789',
 *   dueDate: new Date('2025-01-31'),
 *   estimatedHours: 8,
 *   actualHours: 6,
 *   createdBy: '789',
 *   createdAt: new Date(),
 *   updatedAt: new Date()
 * };
 * ```
 * 
 * @remarks
 * - assigneeIdが未設定の場合は未割り当てタスクです
 * - dueDateが未設定の場合は期限なしタスクです
 */
export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: ProjectPriority;
  assigneeId?: string;
  dueDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * クライアント(顧客企業)
 * 
 * 顧客企業の情報を表すインターフェースです。
 * 
 * @interface Client
 * 
 * @property {string} id - クライアントID(UUID)
 * @property {string} name - クライアント名(最大200文字)
 * @property {string} companyName - 会社名(最大200文字)
 * @property {string} email - 担当者メールアドレス
 * @property {string} [phone] - 担当者電話番号(任意)
 * @property {string} [address] - 住所(任意)
 * @property {string} [industry] - 業種(任意)
 * @property {string} [note] - 備考(任意)
 * @property {Date} createdAt - 作成日時
 * @property {Date} updatedAt - 最終更新日時
 * 
 * @example
 * ```typescript
 * const client: Client = {
 *   id: '123',
 *   name: 'サンプル社',
 *   companyName: '株式会社サンプル',
 *   email: 'contact@example.com',
 *   phone: '03-1234-5678',
 *   address: '東京都渋谷区...',
 *   industry: 'IT',
 *   note: '重要顧客',
 *   createdAt: new Date(),
 *   updatedAt: new Date()
 * };
 * ```
 * 
 * @remarks
 * - emailは有効なメールアドレス形式である必要があります
 * - companyNameは一意である必要があります
 */
export interface Client {
  id: number;
  company_name: string;
  legal_name?: string;
  email?: string;
  representative?: string;
  established_date?: string;
  capital?: number;
  employee_count?: number;
  industry?: string;
  website?: string;
  description?: string;
  postal_code?: string;
  prefecture?: string;
  city?: string;
  address?: string;
  phone?: string;
  fax?: string;
  contact_name?: string;
  contact_department?: string;
  contact_position?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_mobile?: string;
  priority?: string;
  lead_source?: string;
  assigned_sales?: number;
  tags?: string[];
  note?: string;
  ai_generated?: boolean;
  ai_generated_at?: string;
  ai_confidence_score?: number;
  created_at: string;
  updated_at: string;
}

/**
 * メンバー(社内ユーザー)
 * 
 * 社内のプロジェクトメンバー情報を表すインターフェースです。
 * 
 * @interface Member
 * 
 * @property {string} id - メンバーID(UUID)
 * @property {string} name - 氏名(最大100文字)
 * @property {string} email - メールアドレス(ユニークキー)
 * @property {string} [avatar] - プロフィール画像URL(任意)
 * @property {MemberRole} role - システム上の役割
 * @property {string} [department] - 所属部署(任意、最大100文字)
 * @property {string} [position] - 役職(任意、最大100文字)
 * @property {string[]} skills - スキルセット(技術タグの配列)
 * @property {Date} joinedAt - 入社日
 * 
 * @example
 * ```typescript
 * const member: Member = {
 *   id: '123',
 *   name: '佐藤一郎',
 *   email: 'sato@company.com',
 *   avatar: 'https://example.com/avatar.jpg',
 *   role: 'manager',
 *   department: '開発部',
 *   position: '部長',
 *   skills: ['TypeScript', 'React', 'Python'],
 *   joinedAt: new Date('2020-04-01')
 * };
 * ```
 * 
 * @remarks
 * - emailは一意である必要があります
 * - avatarが未設定の場合、デフォルトアバターが使用されます
 * - skillsは技術スタックや専門領域を表します
 */
export interface Member {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: MemberRole;
  department?: string;
  position?: string;
  skills: string[];
  joinedAt: Date;
}

/**
 * ファイル添付
 * 
 * プロジェクトに関連付けられた添付ファイルの情報を表します。
 * 
 * @interface Attachment
 * 
 * @property {string} id - 添付ファイルID(UUID)
 * @property {string} projectId - 関連プロジェクトのID
 * @property {string} fileName - ファイル名(拡張子含む)
 * @property {number} fileSize - ファイルサイズ(バイト単位)
 * @property {string} fileType - MIMEタイプ(例: 'application/pdf', 'image/png')
 * @property {string} uploadedBy - アップロード者のメンバーID
 * @property {Date} uploadedAt - アップロード日時
 * @property {string} url - ファイルへのアクセスURL
 * 
 * @example
 * ```typescript
 * const attachment: Attachment = {
 *   id: '123',
 *   projectId: '456',
 *   fileName: '設計書.pdf',
 *   fileSize: 2048000,
 *   fileType: 'application/pdf',
 *   uploadedBy: '789',
 *   uploadedAt: new Date(),
 *   url: '/api/files/123/download'
 * };
 * ```
 * 
 * @remarks
 * - fileSizeは表示時にKB、MB等に変換して表示します
 * - fileTypeはファイルのダウンロード時のContent-Typeとして使用されます
 * - urlはファイルダウンロードのエンドポイントを指します
 */
export interface Attachment {
  id: string;
  projectId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  uploadedAt: Date;
  url: string;
}

/**
 * コメント
 * 
 * プロジェクトまたはタスクに対するコメント情報を表します。
 * 
 * @interface Comment
 * 
 * @property {string} id - コメントID(UUID)
 * @property {string} projectId - 関連プロジェクトのID
 * @property {string} [taskId] - 関連タスクのID(タスク固有のコメントの場合)
 * @property {string} content - コメント本文
 * @property {string} authorId - コメント投稿者のメンバーID
 * @property {Date} createdAt - 作成日時
 * @property {Date} updatedAt - 最終更新日時
 * 
 * @example
 * ```typescript
 * const comment: Comment = {
 *   id: '123',
 *   projectId: '456',
 *   taskId: '789',
 *   content: 'この部分について確認をお願いします。',
 *   authorId: '012',
 *   createdAt: new Date(),
 *   updatedAt: new Date()
 * };
 * ```
 * 
 * @remarks
 * - taskIdが未設定の場合はプロジェクト全体に対するコメントです
 * - taskIdが設定されている場合は特定タスクに対するコメントです
 * - contentはMarkdown記法をサポートします
 */
export interface Comment {
  id: string;
  projectId: string;
  taskId?: string;
  content: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}

// アクティビティログ
export interface ActivityLog {
  id: string;
  projectId: string;
  userId: string;
  action: string;
  description: string;
  createdAt: Date;
}

// ダッシュボード統計
export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasksCount: number;
  recentActivities: ActivityLog[];
}

// フィルタオプション
export interface ProjectFilters {
  status?: ProjectStatus[];
  priority?: ProjectPriority[];
  clientId?: string;
  ownerId?: string;
  search?: string;
  startDate?: Date;
  endDate?: Date;
}

// ページネーション
export interface Pagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

// API レスポンス
export interface ApiResponse<T> {
  data: T;
  pagination?: Pagination;
  success: boolean;
  message?: string;
}

// アプリケーション定義
export interface Application {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  path: string;
  color: string; // CSS color variable
  isActive: boolean;
  order: number;
}
