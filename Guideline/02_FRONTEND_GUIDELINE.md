# フロントエンド開発ガイドライン

## 📋 目次
- [開発環境](#開発環境)
- [プロジェクト構造](#プロジェクト構造)
- [コーディング規約](#コーディング規約)
- [コンポーネント開発](#コンポーネント開発)
- [状態管理](#状態管理)
- [API通信](#api通信)
- [型定義](#型定義)
- [スタイリング](#スタイリング)
- [パフォーマンス](#パフォーマンス)

## 開発環境

### 必須ツール
- **Node.js**: 18.x以上
- **npm**: 9.x以上
- **TypeScript**: 5.x
- **VS Code**: 推奨IDE

### 推奨VS Code拡張機能
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "dsznajder.es7-react-js-snippets"
  ]
}
```

### セットアップ
```powershell
# プロジェクトのクローン
cd 

# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev

# ビルド
npm run build

# Lint実行
npm run lint
```

## プロジェクト構造

### ディレクトリ構成
```
/
├── src/
│   ├── main.tsx              # エントリーポイント
│   ├── App.tsx               # ルートコンポーネント
│   ├── router.tsx            # ルーティング設定
│   ├── index.css             # グローバルスタイル
│   │
│   ├── components/           # 再利用可能なコンポーネント
│   │   ├── ui/              # UIプリミティブ (Shadcn/ui)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   └── ...
│   │   ├── AppSwitcher.tsx  # アプリ切り替え
│   │   └── mode-toggle.tsx  # テーマ切り替え
│   │
│   ├── pages/               # ページコンポーネント
│   │   ├── _layout.tsx      # レイアウトコンポーネント
│   │   ├── landing.tsx      # ランディングページ
│   │   ├── dashboard.tsx    # ダッシュボード
│   │   ├── projects.tsx     # プロジェクト一覧
│   │   ├── project-detail.tsx
│   │   ├── members.tsx
│   │   ├── clients.tsx
│   │   └── ...
│   │
│   ├── services/            # API通信・ビジネスロジック
│   │   ├── djangoAPI.ts     # Django APIクライアント
│   │   ├── powerAppsDataverseService.ts
│   │   └── dataverseAdminService.ts
│   │
│   ├── hooks/               # カスタムフック
│   │   └── use-theme.ts
│   │
│   ├── lib/                 # ユーティリティ・Store
│   │   ├── utils.ts         # ヘルパー関数
│   │   └── dataverseStore.ts # Zustand Store
│   │
│   ├── types/               # TypeScript型定義
│   │   ├── dataverse.ts
│   │   └── ...
│   │
│   ├── providers/           # Contextプロバイダー
│   │   ├── theme-provider.tsx
│   │   ├── query-provider.tsx
│   │   ├── power-provider.tsx
│   │   └── sonner-provider.tsx
│   │
│   ├── data/                # モックデータ・スキーマ
│   │   ├── mockData.ts
│   │   └── tableSchemas.ts
│   │
│   └── assets/              # 静的アセット
│
├── plugins/                 # Viteプラグイン
│   └── plugin-power-apps.ts
│
├── public/                  # 公開静的ファイル
├── components.json          # Shadcn/ui設定
├── tsconfig.json            # TypeScript設定
├── vite.config.ts           # Vite設定
├── eslint.config.js         # ESLint設定
├── tailwind.config.js       # Tailwind CSS設定
└── package.json
```

### ファイル命名規則

#### コンポーネントファイル
- **PascalCase**: `ProjectCard.tsx`, `UserProfile.tsx`
- **Kebab-case** (UIコンポーネント): `button.tsx`, `dropdown-menu.tsx`

#### 非コンポーネントファイル
- **camelCase**: `useProjects.ts`, `apiClient.ts`
- **Kebab-case**: `use-theme.ts`, `mode-toggle.tsx`

#### ページファイル
- **Kebab-case**: `project-detail.tsx`, `dataverse-settings.tsx`
- **アンダースコアプレフィックス** (レイアウト): `_layout.tsx`, `_layout-home.tsx`

## コーディング規約

### コメント記述規則

**重要: このプロジェクトでは、全てのソースコードのコメントは丁寧な日本語で記述します。**

詳細なコメント規約は [`06_CODING_STANDARDS.md`](./06_CODING_STANDARDS.md) を参照してください。

#### フロントエンドコンポーネントのコメント例

##### Reactコンポーネント

```typescript
/**
 * プロジェクトカードコンポーネント
 * 
 * プロジェクトの基本情報を表示するカードUIです。
 * ステータスバッジ、進捗バー、アクションボタンを含みます。
 * 
 * @component
 * 
 * @param {Object} props - コンポーネントのプロパティ
 * @param {Project} props.project - 表示するプロジェクトデータ
 * @param {boolean} [props.showActions=true] - アクションボタンの表示/非表示
 * @param {Function} [props.onEdit] - 編集ボタンクリック時のコールバック
 * @param {Function} [props.onDelete] - 削除ボタンクリック時のコールバック
 * 
 * @example
 * ```tsx
 * <ProjectCard
 *   project={project}
 *   onEdit={(p) => handleEdit(p)}
 *   onDelete={(id) => handleDelete(id)}
 * />
 * ```
 * 
 * @remarks
 * - プロジェクトが期限切れの場合、赤色のバッジが表示されます
 * - 編集・削除には適切な権限が必要です
 */
export function ProjectCard({
  project,
  showActions = true,
  onEdit,
  onDelete
}: ProjectCardProps) {
  // 期限切れかどうかを判定
  // 終了日が現在日時より前で、かつ完了していない場合
  const isOverdue = 
    project.endDate && 
    new Date(project.endDate) < new Date() && 
    project.status !== 'completed';

  // ステータスに応じたバッジの色を決定
  const statusColorMap: Record<ProjectStatus, string> = {
    planning: 'bg-yellow-100 text-yellow-800',
    active: 'bg-green-100 text-green-800',
    completed: 'bg-blue-100 text-blue-800',
    on_hold: 'bg-gray-100 text-gray-800',
  };

  return (
    <Card className={cn(isOverdue && 'border-destructive')}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{project.name}</CardTitle>
          {/* ステータスバッジ */}
          <Badge className={statusColorMap[project.status]}>
            {project.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {project.description}
        </p>
        
        {/* アクションボタン（権限がある場合のみ表示） */}
        {showActions && (
          <div className="mt-4 flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onEdit?.(project)}
            >
              編集
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => onDelete?.(project.id)}
            >
              削除
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

##### カスタムフック

```typescript
/**
 * プロジェクト一覧を取得するカスタムフック
 * 
 * Dataverseまたは Django APIからプロジェクトを取得し、
 * TanStack Queryでキャッシュ管理を行います。
 * 
 * @param {Object} [options] - クエリオプション
 * @param {ProjectStatus} [options.status] - フィルタリングするステータス
 * @param {string} [options.search] - 検索キーワード
 * @param {string} [options.sortBy] - ソート基準フィールド
 * @param {'asc' | 'desc'} [options.sortOrder] - ソート順序
 * 
 * @returns {UseQueryResult<Project[]>} TanStack Queryの結果オブジェクト
 * @returns {Project[]} returns.data - プロジェクト配列
 * @returns {boolean} returns.isLoading - ローディング状態
 * @returns {Error} returns.error - エラーオブジェクト
 * @returns {Function} returns.refetch - 手動再取得関数
 * 
 * @example
 * ```typescript
 * // 基本的な使用方法
 * const { data: projects, isLoading } = useProjects();
 * 
 * // フィルタリング
 * const { data: activeProjects } = useProjects({
 *   status: 'active',
 *   sortBy: 'start_date',
 *   sortOrder: 'desc'
 * });
 * 
 * // 検索
 * const { data: searchResults } = useProjects({
 *   search: searchTerm
 * });
 * ```
 * 
 * @remarks
 * - キャッシュの有効期限は5分です
 * - ネットワークエラー時は自動で3回リトライします
 * - データソースは環境設定に基づいて自動選択されます
 * 
 * @see {@link https://tanstack.com/query/latest/docs/react/guides/queries}
 */
export function useProjects(options?: ProjectQueryOptions) {
  const { baseUrl, isConnected } = useDataverseStore();
  
  return useQuery({
    queryKey: ['projects', options],
    queryFn: async () => {
      // Dataverseが接続されている場合はDataverseから取得
      if (isConnected && baseUrl) {
        return fetchProjectsFromDataverse(options);
      }
      // それ以外はDjango APIから取得
      return fetchProjectsFromDjango(options);
    },
    staleTime: 5 * 60 * 1000, // 5分間は再取得しない
    retry: 3, // 失敗時は最大3回リトライ
    enabled: true, // 自動実行を有効化
  });
}

/**
 * プロジェクトを作成するカスタムフック
 * 
 * 新規プロジェクトを作成し、成功時にキャッシュを更新します。
 * 楽観的更新により、即座にUIに反映されます。
 * 
 * @returns {UseMutationResult} TanStack Queryのミューテーション結果
 * @returns {Function} returns.mutate - 同期実行関数
 * @returns {Function} returns.mutateAsync - 非同期実行関数
 * @returns {boolean} returns.isPending - 実行中フラグ
 * @returns {boolean} returns.isSuccess - 成功フラグ
 * @returns {Error} returns.error - エラーオブジェクト
 * 
 * @example
 * ```typescript
 * const createProject = useCreateProject();
 * 
 * // 同期実行
 * createProject.mutate({
 *   name: "新規プロジェクト",
 *   description: "説明",
 *   start_date: "2025-01-01",
 *   status: "planning"
 * });
 * 
 * // 非同期実行（async/await）
 * try {
 *   const newProject = await createProject.mutateAsync(data);
 *   console.log('作成成功:', newProject.id);
 * } catch (error) {
 *   console.error('作成失敗:', error);
 * }
 * ```
 * 
 * @remarks
 * - 成功時に自動でプロジェクト一覧キャッシュを無効化します
 * - 楽観的更新により、API応答前にUIが更新されます
 * - エラー時はトーストで通知されます
 */
export function useCreateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateProjectDto) => projectService.create(data),
    
    // 楽観的更新: API応答前にキャッシュを更新
    onMutate: async (newProject) => {
      // 進行中のクエリをキャンセル
      await queryClient.cancelQueries({ queryKey: ['projects'] });
      
      // 以前のキャッシュを保存（ロールバック用）
      const previousProjects = queryClient.getQueryData<Project[]>(['projects']);
      
      // 楽観的に新しいプロジェクトを追加
      queryClient.setQueryData<Project[]>(
        ['projects'],
        (old) => old ? [...old, newProject as Project] : [newProject as Project]
      );
      
      // ロールバック用のコンテキストを返す
      return { previousProjects };
    },
    
    // 成功時の処理
    onSuccess: (createdProject) => {
      // 正確なデータでキャッシュを更新
      queryClient.setQueryData<Project[]>(
        ['projects'],
        (old) => {
          if (!old) return [createdProject];
          // 楽観的更新した仮データを削除し、正式データを追加
          return [...old.filter(p => p.id !== createdProject.id), createdProject];
        }
      );
      
      toast.success('プロジェクトを作成しました');
    },
    
    // エラー時の処理（ロールバック）
    onError: (error, newProject, context) => {
      // キャッシュを元に戻す
      if (context?.previousProjects) {
        queryClient.setQueryData(['projects'], context.previousProjects);
      }
      
      toast.error('プロジェクトの作成に失敗しました');
      console.error('プロジェクト作成エラー:', error);
    },
    
    // 成功・失敗にかかわらず実行
    onSettled: () => {
      // キャッシュを無効化して最新データを取得
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
```

##### サービス層の関数

```typescript
/**
 * Dataverseからプロジェクトを取得する
 * 
 * WebApiClientを使用してDataverseのcr6c8_projectsテーブルから
 * プロジェクトデータを取得します。ODataクエリでフィルタリングと
 * ソートを行います。
 * 
 * @param {ProjectQueryOptions} [options] - クエリオプション
 * @returns {Promise<Project[]>} プロジェクト配列のPromise
 * 
 * @throws {Error} Dataverse API呼び出しが失敗した場合
 * @throws {ValidationError} レスポンスデータが不正な場合
 * 
 * @example
 * ```typescript
 * // 全プロジェクトを取得
 * const projects = await fetchProjectsFromDataverse();
 * 
 * // 進行中のプロジェクトのみ取得
 * const active = await fetchProjectsFromDataverse({
 *   status: 'active'
 * });
 * ```
 * 
 * @remarks
 * - 最大5000件まで取得可能（Dataverse APIの制限）
 * - ページングが必要な場合は別途実装が必要
 * 
 * @see {@link https://learn.microsoft.com/ja-jp/power-apps/developer/data-platform/webapi/query-data-web-api}
 */
async function fetchProjectsFromDataverse(
  options?: ProjectQueryOptions
): Promise<Project[]> {
  const client = new WebApiClient();
  
  // ODataクエリパラメータを構築
  const query: string[] = [];
  
  // ステータスフィルター
  if (options?.status) {
    // ステータス値をDataverseの選択肢番号に変換
    const statusMap: Record<ProjectStatus, number> = {
      planning: 1,
      active: 2,
      completed: 3,
      on_hold: 4,
    };
    query.push(`$filter=cr6c8_status eq ${statusMap[options.status]}`);
  }
  
  // 検索キーワード（プロジェクト名で部分一致）
  if (options?.search) {
    const searchFilter = `contains(cr6c8_name, '${options.search}')`;
    query.push(
      query.length > 0 
        ? `${query[0]} and ${searchFilter}` 
        : `$filter=${searchFilter}`
    );
  }
  
  // ソート順序
  if (options?.sortBy) {
    const order = options.sortOrder === 'desc' ? 'desc' : 'asc';
    query.push(`$orderby=cr6c8_${options.sortBy} ${order}`);
  }
  
  try {
    // Dataverse APIを呼び出し
    const response = await client.retrieveMultipleRecords(
      'cr6c8_projects',
      `?${query.join('&')}`
    );
    
    // Dataverseのレスポンスをアプリケーションの型に変換
    return response.entities.map(mapDataverseToProject);
  } catch (error) {
    console.error('Dataverseからのプロジェクト取得に失敗:', error);
    throw new Error('プロジェクトデータの取得に失敗しました');
  }
}
```

### TypeScript

#### 型定義の原則
```typescript
// ✅ 良い例: 明示的な型定義
interface Project {
  id: string;
  name: string;
  description: string;
  start_date: string; // ISO 8601形式
  end_date: string | null;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

type ProjectStatus = 'planning' | 'active' | 'completed' | 'on_hold';

// ✅ 関数の型注釈
function createProject(data: CreateProjectDto): Promise<Project> {
  return apiClient.post<Project>('/projects/', data);
}

// ❌ 悪い例: any型の使用
function processData(data: any) { // anyは避ける
  return data.something;
}
```

#### ユーティリティ型の活用
```typescript
// Partial: すべてのプロパティをオプションに
type UpdateProjectDto = Partial<CreateProjectDto>;

// Pick: 特定のプロパティのみ抽出
type ProjectSummary = Pick<Project, 'id' | 'name' | 'status'>;

// Omit: 特定のプロパティを除外
type ProjectFormData = Omit<Project, 'id' | 'created_at' | 'updated_at'>;

// Record: キーと値の型を指定
type ProjectsById = Record<string, Project>;

// NonNullable: null/undefinedを除外
type DefinitelyProject = NonNullable<Project | null>;
```

#### 型ガード
```typescript
// 型ガードの実装
function isProject(obj: unknown): obj is Project {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj
  );
}

// 使用例
if (isProject(data)) {
  // この中では data は Project 型
  console.log(data.name);
}
```

### React

#### コンポーネント定義
```typescript
// ✅ 良い例: 関数コンポーネント + TypeScript
interface ProjectCardProps {
  project: Project;
  onEdit?: (project: Project) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

export function ProjectCard({ 
  project, 
  onEdit, 
  onDelete,
  className 
}: ProjectCardProps) {
  return (
    <Card className={cn('hover:shadow-lg transition-shadow', className)}>
      {/* ... */}
    </Card>
  );
}

// デフォルトProps (必要な場合)
ProjectCard.defaultProps = {
  onEdit: undefined,
  onDelete: undefined,
};
```

#### Hooks使用規則
```typescript
// ✅ コンポーネントのトップレベルで呼び出す
function ProjectsList() {
  const { data: projects } = useProjects(); // ✅
  const [filter, setFilter] = useState('all'); // ✅
  
  // ❌ 条件分岐内でHooksを呼び出さない
  if (someCondition) {
    const data = useData(); // ❌
  }
  
  // ❌ ループ内でHooksを呼び出さない
  projects.forEach(() => {
    const something = useSomething(); // ❌
  });
  
  return <div>{/* ... */}</div>;
}
```

#### イベントハンドラー
```typescript
// ✅ 良い例: 型付きイベントハンドラー
function SearchForm() {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // フォーム送信処理
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input onChange={handleInputChange} />
    </form>
  );
}
```

### 非同期処理

#### async/await
```typescript
// ✅ 良い例: エラーハンドリング付き
async function fetchProjects(): Promise<Project[]> {
  try {
    const response = await apiClient.get<Project[]>('/projects/');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('API Error:', error.response?.data);
      throw new Error(error.response?.data?.message || 'プロジェクトの取得に失敗しました');
    }
    throw error;
  }
}

// ❌ 悪い例: エラーハンドリングなし
async function fetchProjects() {
  const response = await apiClient.get('/projects/');
  return response.data; // エラー時の処理がない
}
```

## コンポーネント開発

### コンポーネント設計原則

#### 1. Single Responsibility (単一責任)
```typescript
// ❌ 悪い例: 複数の責任
function ProjectDashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    // データ取得
    fetch('/api/projects').then(/* ... */);
  }, []);
  
  // データ変換
  const stats = calculateStats(projects);
  
  // レンダリング
  return (
    <div>
      <h1>Dashboard</h1>
      {/* ... */}
    </div>
  );
}

// ✅ 良い例: 責任の分離
function ProjectDashboard() {
  const { data: projects, isLoading } = useProjects(); // データ取得
  const stats = useProjectStats(projects); // データ変換
  
  return <DashboardView projects={projects} stats={stats} loading={isLoading} />;
}
```

#### 2. Props Drilling回避
```typescript
// ❌ 悪い例: Props Drilling
function App() {
  const [user, setUser] = useState(null);
  return <Layout user={user} setUser={setUser} />;
}

function Layout({ user, setUser }) {
  return <Sidebar user={user} setUser={setUser} />;
}

function Sidebar({ user, setUser }) {
  return <UserMenu user={user} onLogout={() => setUser(null)} />;
}

// ✅ 良い例: Context使用
const UserContext = createContext<UserContextType>(null!);

function App() {
  const [user, setUser] = useState(null);
  
  return (
    <UserContext.Provider value={{ user, setUser }}>
      <Layout />
    </UserContext.Provider>
  );
}

function UserMenu() {
  const { user, setUser } = useContext(UserContext);
  return <button onClick={() => setUser(null)}>ログアウト</button>;
}
```

#### 3. Composition over Inheritance
```typescript
// ✅ コンポーネント合成
function ProjectCard({ project, children }: { 
  project: Project; 
  children?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{project.name}</CardTitle>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}

// 使用例: 柔軟な構成
<ProjectCard project={project}>
  <ProjectDetails project={project} />
  <ProjectActions project={project} />
</ProjectCard>
```

### カスタムフック

#### データ取得フック
```typescript
// src/hooks/useProjects.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '@/services/djangoAPI';
import type { Project, CreateProjectDto, UpdateProjectDto } from '@/types';

// プロジェクト一覧取得
export function useProjects(filters?: ProjectFilters) {
  return useQuery({
    queryKey: ['projects', filters],
    queryFn: () => projectService.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5分
  });
}

// 単一プロジェクト取得
export function useProject(id: string) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: () => projectService.getById(id),
    enabled: !!id, // idがある場合のみ実行
  });
}

// プロジェクト作成
export function useCreateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateProjectDto) => projectService.create(data),
    onSuccess: (newProject) => {
      // キャッシュ無効化
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      
      // 楽観的更新
      queryClient.setQueryData<Project[]>(
        ['projects'],
        (old) => old ? [...old, newProject] : [newProject]
      );
      
      toast.success('プロジェクトを作成しました');
    },
    onError: (error) => {
      toast.error('プロジェクトの作成に失敗しました');
      console.error(error);
    },
  });
}

// プロジェクト更新
export function useUpdateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectDto }) => 
      projectService.update(id, data),
    onSuccess: (updatedProject) => {
      // 特定のプロジェクトキャッシュ更新
      queryClient.setQueryData(['projects', updatedProject.id], updatedProject);
      
      // 一覧キャッシュ無効化
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      
      toast.success('プロジェクトを更新しました');
    },
  });
}

// プロジェクト削除
export function useDeleteProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => projectService.delete(id),
    onSuccess: (_, deletedId) => {
      // キャッシュから削除
      queryClient.removeQueries({ queryKey: ['projects', deletedId] });
      
      // 一覧キャッシュ更新
      queryClient.setQueryData<Project[]>(
        ['projects'],
        (old) => old?.filter(p => p.id !== deletedId)
      );
      
      toast.success('プロジェクトを削除しました');
    },
  });
}
```

#### ビジネスロジックフック
```typescript
// src/hooks/useProjectStats.ts
export function useProjectStats(projects: Project[] | undefined) {
  return useMemo(() => {
    if (!projects) return null;
    
    return {
      total: projects.length,
      active: projects.filter(p => p.status === 'active').length,
      completed: projects.filter(p => p.status === 'completed').length,
      planning: projects.filter(p => p.status === 'planning').length,
      completionRate: (
        projects.filter(p => p.status === 'completed').length / projects.length * 100
      ).toFixed(1),
    };
  }, [projects]);
}
```

## 状態管理

### TanStack Query (サーバー状態)

#### 基本的な使用方法
```typescript
// Provider設定 (src/providers/query-provider.tsx)
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分
      cacheTime: 10 * 60 * 1000, // 10分
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

#### キャッシュ戦略
```typescript
// 常に新鮮なデータが必要な場合
const { data } = useQuery({
  queryKey: ['realtime-data'],
  queryFn: fetchRealtimeData,
  staleTime: 0, // 即座にstaleになる
  refetchInterval: 10000, // 10秒ごとに再取得
});

// 頻繁に変更されないデータ
const { data } = useQuery({
  queryKey: ['static-data'],
  queryFn: fetchStaticData,
  staleTime: Infinity, // 無期限に新鮮
  cacheTime: Infinity, // 永続的にキャッシュ
});
```

### Zustand (クライアント状態)

#### Store定義
```typescript
// src/lib/dataverseStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DataverseStore {
  // State
  baseUrl: string;
  apiVersion: string;
  isConnected: boolean;
  
  // Actions
  setConnection: (url: string, version: string) => void;
  disconnect: () => void;
  reset: () => void;
}

export const useDataverseStore = create<DataverseStore>()(
  persist(
    (set) => ({
      // Initial state
      baseUrl: '',
      apiVersion: '9.2',
      isConnected: false,
      
      // Actions
      setConnection: (url, version) => 
        set({ baseUrl: url, apiVersion: version, isConnected: true }),
      
      disconnect: () => 
        set({ baseUrl: '', isConnected: false }),
      
      reset: () => 
        set({ baseUrl: '', apiVersion: '9.2', isConnected: false }),
    }),
    {
      name: 'dataverse-storage', // localStorage key
      partialize: (state) => ({ 
        baseUrl: state.baseUrl, 
        apiVersion: state.apiVersion 
      }), // 永続化する項目
    }
  )
);

// 使用例
function DataverseSettings() {
  const { baseUrl, setConnection, disconnect } = useDataverseStore();
  
  return (
    <div>
      <input 
        value={baseUrl} 
        onChange={(e) => setConnection(e.target.value, '9.2')} 
      />
      <button onClick={disconnect}>切断</button>
    </div>
  );
}
```

## API通信

### APIクライアント設定

```typescript
// src/services/djangoAPI.ts
import axios, { AxiosError } from 'axios';

// Axiosインスタンス作成
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// リクエストインターセプター
apiClient.interceptors.request.use(
  (config) => {
    // 認証トークン追加
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// レスポンスインターセプター
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    
    // 401エラー: トークンリフレッシュ
    if (error.response?.status === 401 && originalRequest) {
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const { data } = await axios.post('/api/token/refresh/', {
          refresh: refreshToken,
        });
        
        localStorage.setItem('access_token', data.access);
        
        // リトライ
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return apiClient.request(originalRequest);
      } catch (refreshError) {
        // リフレッシュ失敗: ログアウト
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
```

### サービス層実装

```typescript
// src/services/projectService.ts
import { apiClient } from './djangoAPI';
import type { Project, CreateProjectDto, UpdateProjectDto } from '@/types';

export const projectService = {
  // 一覧取得
  async getAll(filters?: ProjectFilters): Promise<Project[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    
    const response = await apiClient.get<Project[]>('/projects/', { params });
    return response.data;
  },
  
  // 単一取得
  async getById(id: string): Promise<Project> {
    const response = await apiClient.get<Project>(`/projects/${id}/`);
    return response.data;
  },
  
  // 作成
  async create(data: CreateProjectDto): Promise<Project> {
    const response = await apiClient.post<Project>('/projects/', data);
    return response.data;
  },
  
  // 更新
  async update(id: string, data: UpdateProjectDto): Promise<Project> {
    const response = await apiClient.patch<Project>(`/projects/${id}/`, data);
    return response.data;
  },
  
  // 削除
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/projects/${id}/`);
  },
};
```

## 型定義

### 型ファイルの構成

```typescript
// src/types/project.ts
export interface Project {
  id: string;
  name: string;
  description: string;
  start_date: string; // ISO 8601
  end_date: string | null;
  status: ProjectStatus;
  budget: number | null;
  created_at: string;
  updated_at: string;
}

export type ProjectStatus = 'planning' | 'active' | 'completed' | 'on_hold';

// DTO (Data Transfer Object)
export interface CreateProjectDto {
  name: string;
  description: string;
  start_date: string;
  end_date?: string;
  status?: ProjectStatus;
  budget?: number;
}

export type UpdateProjectDto = Partial<CreateProjectDto>;

// フィルター
export interface ProjectFilters {
  status?: ProjectStatus;
  search?: string;
  start_date_from?: string;
  start_date_to?: string;
}

// ビューモデル
export interface ProjectCardViewModel {
  id: string;
  name: string;
  status: ProjectStatus;
  statusLabel: string;
  daysRemaining: number | null;
  isOverdue: boolean;
}
```

### Zodバリデーション

```typescript
// src/schemas/projectSchema.ts
import { z } from 'zod';

export const projectSchema = z.object({
  name: z
    .string()
    .min(1, 'プロジェクト名は必須です')
    .max(200, 'プロジェクト名は200文字以内で入力してください'),
  
  description: z.string().optional(),
  
  start_date: z.string().refine((date) => {
    return !isNaN(Date.parse(date));
  }, '有効な日付を入力してください'),
  
  end_date: z.string().optional().refine((date) => {
    return !date || !isNaN(Date.parse(date));
  }, '有効な日付を入力してください'),
  
  status: z.enum(['planning', 'active', 'completed', 'on_hold']).optional(),
  
  budget: z.number().min(0, '予算は0以上で入力してください').optional(),
}).refine((data) => {
  // 終了日が開始日より後であることを検証
  if (data.end_date && data.start_date) {
    return new Date(data.end_date) >= new Date(data.start_date);
  }
  return true;
}, {
  message: '終了日は開始日以降の日付を指定してください',
  path: ['end_date'],
});

export type ProjectFormData = z.infer<typeof projectSchema>;
```

## スタイリング

### Tailwind CSS

#### クラス名の順序
```typescript
// 推奨順序: レイアウト → ボックスモデル → タイポグラフィ → ビジュアル → その他
<div className="
  flex items-center justify-between  // レイアウト
  p-4 m-2                            // スペーシング
  text-lg font-semibold             // タイポグラフィ
  bg-white border rounded-lg        // ビジュアル
  hover:shadow-md transition        // インタラクション
">
```

#### cn()ユーティリティの使用
```typescript
import { cn } from '@/lib/utils';

// 条件付きクラス
<Button 
  className={cn(
    'px-4 py-2',
    isPrimary && 'bg-blue-500',
    isDisabled && 'opacity-50 cursor-not-allowed'
  )}
/>

// propsとマージ
<Card className={cn('hover:shadow-lg', className)} />
```

### CSS Modules (必要な場合)

```typescript
// ProjectCard.module.css
.card {
  @apply rounded-lg border bg-card text-card-foreground shadow-sm;
}

.cardHeader {
  @apply flex flex-col space-y-1.5 p-6;
}

// ProjectCard.tsx
import styles from './ProjectCard.module.css';

export function ProjectCard() {
  return <div className={styles.card}>...</div>;
}
```

## パフォーマンス

### メモ化

#### React.memo
```typescript
// 不要な再レンダリングを防ぐ
export const ProjectCard = React.memo(function ProjectCard({ project }: ProjectCardProps) {
  return <Card>{/* ... */}</Card>;
}, (prevProps, nextProps) => {
  // カスタム比較関数（オプション）
  return prevProps.project.id === nextProps.project.id;
});
```

#### useMemo
```typescript
// 計算コストの高い処理をメモ化
function ProjectsList({ projects }: { projects: Project[] }) {
  const stats = useMemo(() => {
    return {
      total: projects.length,
      completed: projects.filter(p => p.status === 'completed').length,
      active: projects.filter(p => p.status === 'active').length,
    };
  }, [projects]); // projectsが変わった時のみ再計算
  
  return <div>{/* ... */}</div>;
}
```

#### useCallback
```typescript
// 関数をメモ化
function ProjectsList() {
  const deleteProject = useDeleteProject();
  
  // 関数をメモ化して子コンポーネントの再レンダリングを防ぐ
  const handleDelete = useCallback((id: string) => {
    deleteProject.mutate(id);
  }, [deleteProject]);
  
  return (
    <div>
      {projects.map(project => (
        <ProjectCard 
          key={project.id} 
          project={project}
          onDelete={handleDelete} // メモ化された関数
        />
      ))}
    </div>
  );
}
```

### コード分割

#### React.lazy
```typescript
// src/router.tsx
import { lazy } from 'react';

// 動的インポート
const Dashboard = lazy(() => import('./pages/dashboard'));
const Projects = lazy(() => import('./pages/projects'));

export const routes = [
  {
    path: '/dashboard',
    component: Dashboard,
  },
  {
    path: '/projects',
    component: Projects,
  },
];
```

#### Suspense
```typescript
import { Suspense } from 'react';

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes />
    </Suspense>
  );
}
```

### バンドルサイズ最適化

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'query-vendor': ['@tanstack/react-query'],
        },
      },
    },
  },
});
```

---

**Version**: 1.0.0  
**Last Updated**: 2025年11月14日
