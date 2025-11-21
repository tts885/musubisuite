/**
 * 案件管理システムのモックデータ
 * Mock data for Project Management System
 */

import type {
  Project,
  Task,
  Client,
  Member,
  ActivityLog,
  DashboardStats,
  Attachment,
  Comment,
  Application
} from '../types';

// アプリケーションのモックデータ
export const mockApplications: Application[] = [
  {
    id: 'app-home',
    name: 'ホーム',
    description: 'corexverseのホーム画面',
    icon: 'Home',
    path: '/',
    color: 'hsl(var(--chart-4))',
    isActive: false,
    order: 0,
  },
  {
    id: 'app-case-management',
    name: '案件管理',
    description: 'プロジェクトと案件の管理',
    icon: 'FolderKanban',
    path: '/dashboard',
    color: 'hsl(var(--chart-1))',
    isActive: true,
    order: 1,
  },
  {
    id: 'app-ocr',
    name: 'OCR',
    description: '帳票OCR処理と管理',
    icon: 'ScanText',
    path: '/ocr',
    color: 'hsl(var(--chart-5))',
    isActive: false,
    order: 2,
  },
  {
    id: 'app-project-management',
    name: 'プロジェクト管理',
    description: 'タスクとスプリントの管理',
    icon: 'Boxes',
    path: '/project-management',
    color: 'hsl(var(--chart-2))',
    isActive: false,
    order: 3,
  },
  {
    id: 'app-tool-portal',
    name: 'ツールPortal',
    description: '開発ツールとリソース',
    icon: 'Wrench',
    path: '/tool-portal',
    color: 'hsl(var(--chart-3))',
    isActive: false,
    order: 4,
  },
];

// メンバー(ユーザー)のモックデータ
export const mockMembers: Member[] = [
  {
    id: 'm1',
    name: '田中 太郎',
    email: 'tanaka@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tanaka',
    role: 'owner',
    department: '開発部',
    position: 'シニアエンジニア',
    skills: ['React', 'TypeScript', 'Node.js'],
    joinedAt: new Date('2023-01-15'),
  },
  {
    id: 'm2',
    name: '佐藤 花子',
    email: 'sato@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sato',
    role: 'admin',
    department: '開発部',
    position: 'プロジェクトマネージャー',
    skills: ['プロジェクト管理', 'アジャイル', 'Scrum'],
    joinedAt: new Date('2023-02-01'),
  },
  {
    id: 'm3',
    name: '鈴木 一郎',
    email: 'suzuki@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Suzuki',
    role: 'member',
    department: 'デザイン部',
    position: 'UIデザイナー',
    skills: ['Figma', 'UI/UX', 'デザインシステム'],
    joinedAt: new Date('2023-03-10'),
  },
  {
    id: 'm4',
    name: '高橋 美咲',
    email: 'takahashi@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Takahashi',
    role: 'member',
    department: '開発部',
    position: 'エンジニア',
    skills: ['Python', 'Django', 'PostgreSQL'],
    joinedAt: new Date('2023-04-20'),
  },
  {
    id: 'm5',
    name: '渡辺 健太',
    email: 'watanabe@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Watanabe',
    role: 'member',
    department: '営業部',
    position: 'セールス',
    skills: ['営業', '顧客折衝', 'プレゼンテーション'],
    joinedAt: new Date('2023-05-15'),
  },
];

// クライアントのモックデータ
export const mockClients: Client[] = [
  {
    id: 1,
    company_name: 'ABC株式会社',
    contact_name: '山田 次郎',
    email: 'yamada@abc-corp.com',
    phone: '03-1234-5678',
    address: '千代田区1-2-3',
    prefecture: '東京都',
    city: '千代田区',
    industry: 'it',
    note: '大手IT企業。長期的なパートナーシップを希望',
    created_at: '2023-01-10T00:00:00Z',
    updated_at: '2023-01-10T00:00:00Z',
  },
  {
    id: 2,
    company_name: 'XYZ商事株式会社',
    contact_name: '伊藤 美由紀',
    email: 'ito@xyz-trading.com',
    phone: '03-9876-5432',
    address: '港区4-5-6',
    prefecture: '東京都',
    city: '港区',
    industry: 'retail',
    note: 'ECサイトリニューアル案件',
    created_at: '2023-02-15T00:00:00Z',
    updated_at: '2023-02-15T00:00:00Z',
  },
  {
    id: 3,
    company_name: 'デジタルソリューションズ株式会社',
    contact_name: '中村 拓也',
    email: 'nakamura@digital-sol.com',
    phone: '06-1111-2222',
    address: '北区7-8-9',
    prefecture: '大阪府',
    city: '大阪市北区',
    industry: 'service',
    note: '業務システム開発を検討中',
    created_at: '2023-03-20T00:00:00Z',
    updated_at: '2023-03-20T00:00:00Z',
  },
];

// 案件のモックデータ
export const mockProjects: Project[] = [
  {
    id: 'p1',
    name: 'ECサイトリニューアルプロジェクト',
    description: '既存のECサイトを最新のフレームワークでリニューアル。UX改善とパフォーマンス向上を目指す。',
    status: 'active',
    priority: 'high',
    clientId: 'c2',
    startDate: new Date('2025-01-15'),
    endDate: new Date('2025-06-30'),
    budget: 15000000,
    progress: 45,
    ownerId: 'm2',
    memberIds: ['m1', 'm2', 'm3'],
    tags: ['Web開発', 'EC', 'React'],
    createdAt: new Date('2024-12-01'),
    updatedAt: new Date('2025-11-08'),
  },
  {
    id: 'p2',
    name: '社内業務管理システム開発',
    description: '社内の業務プロセスを効率化するための管理システムを開発。',
    status: 'active',
    priority: 'medium',
    clientId: 'c1',
    startDate: new Date('2025-02-01'),
    endDate: new Date('2025-09-30'),
    budget: 8000000,
    progress: 30,
    ownerId: 'm1',
    memberIds: ['m1', 'm4'],
    tags: ['業務システム', 'Power Apps', 'Power Automate'],
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-11-07'),
  },
  {
    id: 'p3',
    name: 'モバイルアプリ開発プロジェクト',
    description: '顧客管理のためのモバイルアプリケーション開発。iOS/Android対応。',
    status: 'planning',
    priority: 'high',
    clientId: 'c3',
    startDate: new Date('2025-03-01'),
    endDate: new Date('2025-10-31'),
    budget: 12000000,
    progress: 10,
    ownerId: 'm2',
    memberIds: ['m2', 'm3', 'm4'],
    tags: ['モバイル', 'React Native', 'CRM'],
    createdAt: new Date('2025-02-01'),
    updatedAt: new Date('2025-11-05'),
  },
  {
    id: 'p4',
    name: 'Webサイトリブランディング',
    description: 'コーポレートサイトのデザインリニューアルとコンテンツ刷新。',
    status: 'completed',
    priority: 'low',
    clientId: 'c1',
    startDate: new Date('2024-08-01'),
    endDate: new Date('2024-12-31'),
    budget: 5000000,
    progress: 100,
    ownerId: 'm3',
    memberIds: ['m3', 'm5'],
    tags: ['Web', 'デザイン', 'ブランディング'],
    createdAt: new Date('2024-07-15'),
    updatedAt: new Date('2024-12-31'),
  },
  {
    id: 'p5',
    name: 'AIチャットボット導入プロジェクト',
    description: 'カスタマーサポート向けAIチャットボットの設計・開発・導入。',
    status: 'on-hold',
    priority: 'medium',
    clientId: 'c2',
    startDate: new Date('2025-04-01'),
    endDate: new Date('2025-12-31'),
    budget: 10000000,
    progress: 5,
    ownerId: 'm1',
    memberIds: ['m1'],
    tags: ['AI', 'チャットボット', 'Azure'],
    createdAt: new Date('2025-03-01'),
    updatedAt: new Date('2025-03-15'),
  },
];

// タスクのモックデータ
export const mockTasks: Task[] = [
  {
    id: 't1',
    projectId: 'p1',
    title: 'デザインモックアップ作成',
    description: 'ECサイトの新デザインモックアップを作成',
    status: 'done',
    priority: 'high',
    assigneeId: 'm3',
    dueDate: new Date('2025-02-15'),
    estimatedHours: 40,
    actualHours: 38,
    createdBy: 'm2',
    createdAt: new Date('2025-01-20'),
    updatedAt: new Date('2025-02-14'),
  },
  {
    id: 't2',
    projectId: 'p1',
    title: 'フロントエンド実装',
    description: 'React + TypeScriptでフロントエンドを実装',
    status: 'in-progress',
    priority: 'high',
    assigneeId: 'm1',
    dueDate: new Date('2025-04-30'),
    estimatedHours: 120,
    actualHours: 60,
    createdBy: 'm2',
    createdAt: new Date('2025-02-20'),
    updatedAt: new Date('2025-11-08'),
  },
  {
    id: 't3',
    projectId: 'p1',
    title: 'バックエンドAPI開発',
    description: 'RESTful APIの開発とテスト',
    status: 'in-progress',
    priority: 'high',
    assigneeId: 'm4',
    dueDate: new Date('2025-04-15'),
    estimatedHours: 80,
    actualHours: 45,
    createdBy: 'm2',
    createdAt: new Date('2025-02-20'),
    updatedAt: new Date('2025-11-07'),
  },
  {
    id: 't4',
    projectId: 'p2',
    title: '要件定義書作成',
    description: '業務管理システムの要件定義',
    status: 'done',
    priority: 'high',
    assigneeId: 'm1',
    dueDate: new Date('2025-02-28'),
    estimatedHours: 24,
    actualHours: 28,
    createdBy: 'm1',
    createdAt: new Date('2025-02-01'),
    updatedAt: new Date('2025-02-27'),
  },
  {
    id: 't5',
    projectId: 'p2',
    title: 'データベース設計',
    description: 'テーブル設計とER図作成',
    status: 'review',
    priority: 'medium',
    assigneeId: 'm4',
    dueDate: new Date('2025-03-15'),
    estimatedHours: 32,
    actualHours: 30,
    createdBy: 'm1',
    createdAt: new Date('2025-03-01'),
    updatedAt: new Date('2025-11-06'),
  },
  {
    id: 't6',
    projectId: 'p3',
    title: 'プロジェクト計画書作成',
    description: 'モバイルアプリ開発計画の策定',
    status: 'todo',
    priority: 'high',
    assigneeId: 'm2',
    dueDate: new Date('2025-02-28'),
    estimatedHours: 16,
    createdBy: 'm2',
    createdAt: new Date('2025-02-10'),
    updatedAt: new Date('2025-02-10'),
  },
];

// アクティビティログのモックデータ
export const mockActivityLogs: ActivityLog[] = [
  {
    id: 'a1',
    projectId: 'p1',
    userId: 'm1',
    action: 'task_updated',
    description: 'タスク「フロントエンド実装」を更新しました',
    createdAt: new Date('2025-11-10T09:30:00'),
  },
  {
    id: 'a2',
    projectId: 'p1',
    userId: 'm3',
    action: 'task_completed',
    description: 'タスク「デザインモックアップ作成」を完了しました',
    createdAt: new Date('2025-11-09T14:20:00'),
  },
  {
    id: 'a3',
    projectId: 'p2',
    userId: 'm4',
    action: 'task_created',
    description: '新しいタスク「ユニットテスト作成」を追加しました',
    createdAt: new Date('2025-11-09T11:15:00'),
  },
  {
    id: 'a4',
    projectId: 'p1',
    userId: 'm2',
    action: 'project_updated',
    description: 'プロジェクトの進捗を45%に更新しました',
    createdAt: new Date('2025-11-08T16:45:00'),
  },
  {
    id: 'a5',
    projectId: 'p2',
    userId: 'm1',
    action: 'comment_added',
    description: 'コメントを追加しました',
    createdAt: new Date('2025-11-08T10:30:00'),
  },
];

// ダッシュボード統計のモックデータ
export const mockDashboardStats: DashboardStats = {
  totalProjects: mockProjects.length,
  activeProjects: mockProjects.filter(p => p.status === 'active').length,
  completedProjects: mockProjects.filter(p => p.status === 'completed').length,
  totalTasks: mockTasks.length,
  completedTasks: mockTasks.filter(t => t.status === 'done').length,
  overdueTasksCount: mockTasks.filter(
    t => t.dueDate && t.dueDate < new Date() && t.status !== 'done'
  ).length,
  recentActivities: mockActivityLogs.slice(0, 5),
};

// ファイル添付のモックデータ
export const mockAttachments: Attachment[] = [
  {
    id: 'f1',
    projectId: 'p1',
    fileName: 'デザイン仕様書.pdf',
    fileSize: 2048000,
    fileType: 'application/pdf',
    uploadedBy: 'm3',
    uploadedAt: new Date('2025-02-01T10:00:00'),
    url: '/files/design-spec.pdf',
  },
  {
    id: 'f2',
    projectId: 'p1',
    fileName: 'モックアップ.fig',
    fileSize: 5120000,
    fileType: 'application/figma',
    uploadedBy: 'm3',
    uploadedAt: new Date('2025-02-10T14:30:00'),
    url: '/files/mockup.fig',
  },
];

// コメントのモックデータ
export const mockComments: Comment[] = [
  {
    id: 'c1',
    projectId: 'p1',
    taskId: 't2',
    content: 'フロントエンドの実装が順調に進んでいます。UIコンポーネントの大部分が完成しました。',
    authorId: 'm1',
    createdAt: new Date('2025-11-08T10:30:00'),
    updatedAt: new Date('2025-11-08T10:30:00'),
  },
  {
    id: 'c2',
    projectId: 'p1',
    content: 'クライアントからデザインの承認をいただきました。',
    authorId: 'm2',
    createdAt: new Date('2025-11-07T15:20:00'),
    updatedAt: new Date('2025-11-07T15:20:00'),
  },
];

// ヘルパー関数: プロジェクトIDからクライアントを取得
export const getClientByProject = (projectId: string): Client | undefined => {
  const project = mockProjects.find(p => p.id === projectId);
  if (!project) return undefined;
  return mockClients.find(c => String(c.id) === project.clientId);
};

// ヘルパー関数: プロジェクトIDからタスクを取得
export const getTasksByProject = (projectId: string): Task[] => {
  return mockTasks.filter(t => t.projectId === projectId);
};

// ヘルパー関数: プロジェクトIDからメンバーを取得
export const getMembersByProject = (projectId: string): Member[] => {
  const project = mockProjects.find(p => p.id === projectId);
  if (!project) return [];
  return mockMembers.filter(m => project.memberIds.includes(m.id));
};

// ヘルパー関数: ステータスラベルを取得
export const getStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    'planning': '計画中',
    'active': '進行中',
    'on-hold': '保留',
    'completed': '完了',
    'cancelled': '中止',
    'todo': '未着手',
    'in-progress': '進行中',
    'review': 'レビュー中',
    'done': '完了',
    'blocked': 'ブロック',
  };
  return statusMap[status] || status;
};

// ヘルパー関数: 優先度ラベルを取得
export const getPriorityLabel = (priority: string): string => {
  const priorityMap: Record<string, string> = {
    'low': '低',
    'medium': '中',
    'high': '高',
    'urgent': '緊急',
  };
  return priorityMap[priority] || priority;
};
