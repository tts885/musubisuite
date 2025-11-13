/**
 * 案件管理システムの型定義
 * Project Management System Type Definitions
 */

// 案件ステータス
export type ProjectStatus = 
  | 'planning'      // 計画中
  | 'active'        // 進行中
  | 'on-hold'       // 保留
  | 'completed'     // 完了
  | 'cancelled';    // 中止

// 案件優先度
export type ProjectPriority = 'low' | 'medium' | 'high' | 'urgent';

// タスクステータス
export type TaskStatus = 
  | 'todo'          // 未着手
  | 'in-progress'   // 進行中
  | 'review'        // レビュー中
  | 'done'          // 完了
  | 'blocked';      // ブロック

// メンバーの役割
export type MemberRole = 'owner' | 'admin' | 'member' | 'viewer';

// 案件(プロジェクト)
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

// タスク
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

// クライアント(顧客)
export interface Client {
  id: string;
  name: string;
  companyName: string;
  email: string;
  phone?: string;
  address?: string;
  industry?: string;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

// メンバー(ユーザー)
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

// ファイル添付
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

// コメント
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
  totalMembers: number;
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
