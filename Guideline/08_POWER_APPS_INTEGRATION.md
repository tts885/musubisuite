# Power Apps Code Apps 統合ガイドライン

## 目的

Power Apps Code Apps (Preview) を使用したSPA（Single Page Application）の開発、Dataverse連携、認証、デプロイメントにおける実装方針とベストプラクティスを定義します。

> **重要**: このガイドラインはPower Apps Code Apps (Preview) の公式アーキテクチャとツールチェーンに準拠しています。

---

## 1. Power Apps Code Apps アーキテクチャ

### 1.1 システム構成

```
┌────────────────────────────────────────────────────────┐
│              User Browser                              │
└────────────────────┬───────────────────────────────────┘
                     │ HTTPS
┌────────────────────▼───────────────────────────────────┐
│         Power Apps Host (makers.powerapps.com)         │
│  ┌──────────────────────────────────────────────────┐  │
│  │        Authentication & Authorization            │  │
│  │  - Microsoft Entra ID                            │  │
│  │  - User Context                                  │  │
│  └────────────────────┬─────────────────────────────┘  │
│                       │                                │
│  ┌────────────────────▼─────────────────────────────┐  │
│  │      Code App (React + TypeScript)               │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │  @microsoft/power-apps SDK                 │  │  │
│  │  │  - Context API                             │  │  │
│  │  │  - Navigation API                          │  │  │
│  │  │  - WebAPI Client (Dataverse)               │  │  │
│  │  └────────┬───────────────────────────────────┘  │  │
│  │           │                                       │  │
│  │  ┌────────▼───────────────────────────────────┐  │  │
│  │  │  Application Code (React Components)      │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  └───────────────────┬──────────────────────────────┘  │
└────────────────────┬─┼──────────────────────────────────┘
                     │ │
         ┌───────────┘ └──────────┐
         │                        │
┌────────▼─────────┐    ┌─────────▼──────────┐
│    Dataverse     │    │  External APIs     │
│  - Tables        │    │  (Django Backend)  │
│  - Business      │    │  - REST API        │
│    Logic         │    │  - Custom Logic    │
└──────────────────┘    └────────────────────┘
```

### 1.2 統合パターン

#### パターン1: Dataverse直接連携（推奨）
Power Apps Code Appsの標準的なアプローチです。`@microsoft/power-apps` SDKを使用してDataverseに直接アクセスします。

```typescript
import { WebApiClient } from '@microsoft/power-apps';

// SDK経由でDataverseにアクセス
const client = new WebApiClient();
const response = await client.retrieveMultipleRecords('cr6c8_projects', {
  select: ['cr6c8_name', 'cr6c8_status'],
  orderBy: ['cr6c8_name asc']
});
```

#### パターン2: 外部API連携
DjangoバックエンドなどのカスタムAPIを使用する場合は、`pac code add-data-source`コマンドでデータソースとして登録します。

```typescript
// pacコマンドで登録したデータソース経由でアクセス
const response = await fetch('/api/projects/');
const projects = await response.json();
```

---

## 2. Dataverse連携実装

### 2.1 Dataverseストアの設定

**実装場所:** `src/lib/dataverseStore.ts`

```typescript
import { create } from 'zustand';

interface DataverseConfig {
  apiUrl: string;
  apiVersion: string;
  accessToken: string | null;
}

interface DataverseStore extends DataverseConfig {
  // Configuration
  setConfig: (config: Partial<DataverseConfig>) => void;
  
  // Authentication
  authenticate: () => Promise<void>;
  
  // CRUD Operations
  fetchRecords: (tableName: string, options?: FetchOptions) => Promise<any[]>;
  fetchRecord: (tableName: string, id: string) => Promise<any>;
  createRecord: (tableName: string, data: any) => Promise<any>;
  updateRecord: (tableName: string, id: string, data: any) => Promise<void>;
  deleteRecord: (tableName: string, id: string) => Promise<void>;
  
  // Batch Operations
  batchCreate: (tableName: string, records: any[]) => Promise<any[]>;
  batchUpdate: (tableName: string, records: Array<{id: string, data: any}>) => Promise<void>;
}

export const useDataverseStore = create<DataverseStore>((set, get) => ({
  apiUrl: '',
  apiVersion: '9.2',
  accessToken: null,
  
  setConfig: (config) => set(config),
  
  authenticate: async () => {
    // MSAL認証実装
    const token = await getAccessToken();
    set({ accessToken: token });
  },
  
  fetchRecords: async (tableName, options = {}) => {
    const { apiUrl, apiVersion, accessToken } = get();
    
    if (!accessToken) {
      throw new Error('Not authenticated');
    }
    
    const queryParams = new URLSearchParams({
      $top: options.top?.toString() || '100',
      ...(options.filter && { $filter: options.filter }),
      ...(options.orderby && { $orderby: options.orderby }),
      ...(options.select && { $select: options.select }),
      ...(options.expand && { $expand: options.expand }),
    });
    
    const response = await fetch(
      `${apiUrl}/api/data/v${apiVersion}/${tableName}?${queryParams}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'OData-MaxVersion': '4.0',
          'OData-Version': '4.0',
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Dataverse API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.value;
  },
  
  createRecord: async (tableName, data) => {
    const { apiUrl, apiVersion, accessToken } = get();
    
    const response = await fetch(
      `${apiUrl}/api/data/v${apiVersion}/${tableName}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'OData-MaxVersion': '4.0',
          'OData-Version': '4.0',
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to create record');
    }
    
    const recordId = response.headers.get('OData-EntityId')?.split('(')[1]?.split(')')[0];
    return { ...data, id: recordId };
  },
  
  // 他のメソッド実装...
}));
```

### 2.2 テーブルスキーマ定義

**実装場所:** `src/data/tableSchemas.ts`

```typescript
export interface DataverseTable {
  logicalName: string;
  displayName: string;
  primaryKey: string;
  columns: DataverseColumn[];
}

export interface DataverseColumn {
  logicalName: string;
  displayName: string;
  type: 'string' | 'number' | 'boolean' | 'datetime' | 'lookup' | 'picklist';
  required: boolean;
  maxLength?: number;
  lookupTarget?: string;
}

export const projectsTableSchema: DataverseTable = {
  logicalName: 'cr6c8_projects',
  displayName: 'Projects',
  primaryKey: 'cr6c8_projectid',
  columns: [
    {
      logicalName: 'cr6c8_name',
      displayName: 'Project Name',
      type: 'string',
      required: true,
      maxLength: 100,
    },
    {
      logicalName: 'cr6c8_description',
      displayName: 'Description',
      type: 'string',
      required: false,
      maxLength: 2000,
    },
    {
      logicalName: 'cr6c8_startdate',
      displayName: 'Start Date',
      type: 'datetime',
      required: true,
    },
    {
      logicalName: 'cr6c8_enddate',
      displayName: 'End Date',
      type: 'datetime',
      required: false,
    },
    {
      logicalName: 'cr6c8_status',
      displayName: 'Status',
      type: 'picklist',
      required: true,
    },
    {
      logicalName: 'cr6c8_clientid',
      displayName: 'Client',
      type: 'lookup',
      required: true,
      lookupTarget: 'cr6c8_clients',
    },
  ],
};

// スキーマバリデーション
export function validateRecord(
  schema: DataverseTable,
  record: Record<string, any>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  schema.columns.forEach((column) => {
    const value = record[column.logicalName];
    
    // 必須チェック
    if (column.required && (value === undefined || value === null || value === '')) {
      errors.push(`${column.displayName} is required`);
    }
    
    // 型チェック
    if (value !== undefined && value !== null) {
      switch (column.type) {
        case 'string':
          if (typeof value !== 'string') {
            errors.push(`${column.displayName} must be a string`);
          } else if (column.maxLength && value.length > column.maxLength) {
            errors.push(`${column.displayName} exceeds maximum length of ${column.maxLength}`);
          }
          break;
        case 'number':
          if (typeof value !== 'number') {
            errors.push(`${column.displayName} must be a number`);
          }
          break;
        case 'boolean':
          if (typeof value !== 'boolean') {
            errors.push(`${column.displayName} must be a boolean`);
          }
          break;
        case 'datetime':
          if (!(value instanceof Date) && isNaN(Date.parse(value))) {
            errors.push(`${column.displayName} must be a valid date`);
          }
          break;
      }
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
```

---

## 3. 認証とセキュリティ

### 3.1 MSAL認証

```typescript
import { PublicClientApplication } from '@azure/msal-browser';

const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID}`,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
};

const msalInstance = new PublicClientApplication(msalConfig);

export async function getAccessToken(): Promise<string> {
  const accounts = msalInstance.getAllAccounts();
  
  if (accounts.length === 0) {
    // ログインが必要
    const loginResponse = await msalInstance.loginPopup({
      scopes: [`${import.meta.env.VITE_DATAVERSE_URL}/.default`],
    });
    return loginResponse.accessToken;
  }
  
  // トークン取得
  const request = {
    scopes: [`${import.meta.env.VITE_DATAVERSE_URL}/.default`],
    account: accounts[0],
  };
  
  try {
    const response = await msalInstance.acquireTokenSilent(request);
    return response.accessToken;
  } catch (error) {
    // サイレント取得失敗時はポップアップ
    const response = await msalInstance.acquireTokenPopup(request);
    return response.accessToken;
  }
}
```

### 3.2 環境変数設定

```env
# Power Apps / Dataverse
VITE_AZURE_CLIENT_ID=your-client-id
VITE_AZURE_TENANT_ID=your-tenant-id
VITE_DATAVERSE_URL=https://your-org.crm.dynamics.com
VITE_DATAVERSE_API_VERSION=9.2
```

---

## 5. データ操作パターン

### 5.1 TanStack Queryとの統合

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchProjects, createProject, updateProject, deleteProject } from '@/services/dataverseService';

// Fetch Hook
export function useProjects(options?: {
  filter?: string;
  orderBy?: string[];
}) {
  return useQuery({
    queryKey: ['dataverse', 'projects', options],
    queryFn: () => fetchProjects(options),
    staleTime: 5 * 60 * 1000, // 5分
  });
}

// Create Hook
export function useCreateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Project>) => createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataverse', 'projects'] });
    },
  });
}

// Update Hook
export function useUpdateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Project> }) =>
      updateProject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataverse', 'projects'] });
    },
  });
}

// Delete Hook
export function useDeleteProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataverse', 'projects'] });
    },
  });
}
```

### 5.2 使用例

```typescript
function ProjectList() {
  const [filter, setFilter] = useState<string>();
  
  const { data: projects, isLoading } = useProjects({
    filter: filter ? `contains(cr6c8_name, '${filter}')` : undefined,
    orderBy: ['cr6c8_name asc'],
    top: 50
  });
  
  const createMutation = useCreateProject();
  
  const handleCreate = async (projectData: Partial<Project>) => {
    try {
      await createMutation.mutateAsync(projectData);
      toast.success('プロジェクトを作成しました');
    } catch (error) {
      toast.error('作成に失敗しました');
    }
  };
  
  if (isLoading) return <div>読み込み中...</div>;
  
  return (
    <div>
      {projects?.map(project => (
        <div key={project.cr6c8_projectid}>{project.cr6c8_name}</div>
      ))}
    </div>
  );
}
```

---

## 6. ナビゲーション統合

Power Apps Code Appsでは、アプリ内のナビゲーションだけでなく、Power Platform全体のナビゲーションもサポートしています。

### 6.1 アプリ内ナビゲーション

```typescript
import { Navigation } from '@microsoft/power-apps';

/**
 * 別のページへ移動
 */
export async function navigateToPage(pageName: string, params?: Record<string, any>) {
  await Navigation.navigateTo({
    pageType: 'custom',
    pageName: pageName,
    params: params
  });
}

/**
 * 使用例
 */
function ProjectCard({ projectId }: { projectId: string }) {
  const handleClick = () => {
    navigateToPage('ProjectDetail', { projectId });
  };
  
  return <div onClick={handleClick}>プロジェクト詳細を見る</div>;
}
```

### 6.2 Dataverseレコードへの移動

```typescript
/**
 * Dataverseレコードの詳細画面を開く
 */
export async function openRecord(entityName: string, recordId: string) {
  await Navigation.openRecord({
    entityName: entityName,
    entityId: recordId
  });
}

/**
 * 使用例
 */
function ClientLink({ clientId }: { clientId: string }) {
  return (
    <button onClick={() => openRecord('cr6c8_clients', clientId)}>
      クライアント詳細
    </button>
  );
}
```

---

## 7. ローカル開発とデバッグ

### 7.1 pac code run による開発サーバー起動

```powershell
# Power Apps Host と Vite を同時に起動
cd 
pac code run

# オプション指定
pac code run --port 8181 --browser chrome
```

このコマンドは以下を実行します:
1. `npm run dev` (Vite開発サーバー)
2. Power Apps Host (認証、Dataverseプロキシ)
3. ブラウザの自動起動

### 7.2 package.json スクリプト設定

```json
{
  "scripts": {
    "dev": "vite",
    "dev:pac": "pac code run",
    "build": "tsc && vite build",
    "build:pac": "pac code build",
    "preview": "vite preview"
  }
}
```

### 7.3 デバッグ構成 (.vscode/launch.json)

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "msedge",
      "request": "launch",
      "name": "Launch Code App",
      "url": "http://localhost:8181",
      "webRoot": "${workspaceFolder}//src",
      "preLaunchTask": "pac-code-run"
    }
  ]
}
```

---

## 8. リクエスト/レスポンスの分析

Power Apps Code Appsでは、Dataverse APIとの通信を分析するツールが組み込まれています。

### 8.1 ネットワークトレースの有効化

```typescript
import { Diagnostics } from '@microsoft/power-apps';

// 開発モードでのみトレースを有効化
if (import.meta.env.DEV) {
  Diagnostics.enableNetworkTrace();
}
```

### 8.2 パフォーマンス計測

```typescript
import { Performance } from '@microsoft/power-apps';

async function fetchProjectsWithMetrics() {
  const metric = Performance.startMeasure('fetchProjects');
  
  try {
    const projects = await fetchProjects();
    metric.end({ recordCount: projects.length });
    return projects;
  } catch (error) {
    metric.endWithError(error);
    throw error;
  }
}
```

---

## 9. エラーハンドリング

### 9.1 Dataverseエラー処理

```typescript
import { DataverseError } from '@microsoft/power-apps';

/**
 * エラーハンドリング付きデータ取得
 */
export async function safelyFetchProjects() {
  try {
    return await fetchProjects();
  } catch (error) {
    if (error instanceof DataverseError) {
      switch (error.code) {
        case 'PERMISSION_DENIED':
          toast.error('この操作を実行する権限がありません');
          break;
        case 'RECORD_NOT_FOUND':
          toast.error('データが見つかりません');
          break;
        case 'NETWORK_ERROR':
          toast.error('ネットワークエラーが発生しました');
          break;
        default:
          toast.error(`エラー: ${error.message}`);
      }
    } else {
      toast.error('予期しないエラーが発生しました');
    }
    throw error;
  }
}
```

### 9.2 React Error Boundary

```typescript
import { Component, ReactNode } from 'react';
import { DataverseError } from '@microsoft/power-apps';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class DataverseErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.state.error instanceof DataverseError) {
        return (
          <div className="error-container">
            <h2>データの読み込みに失敗しました</h2>
            <p>{this.state.error.message}</p>
            <button onClick={() => window.location.reload()}>
              再読み込み
            </button>
          </div>
        );
      }
    }

    return this.props.children;
  }
}
```

---

## 10. テスト戦略

### 10.1 WebApiClient のモック

```typescript
// tests/mocks/dataverseMock.ts
import { vi } from 'vitest';

export const mockWebApiClient = {
  retrieveMultipleRecords: vi.fn(),
  retrieveRecord: vi.fn(),
  createRecord: vi.fn(),
  updateRecord: vi.fn(),
  deleteRecord: vi.fn(),
};

// テストでの使用
vi.mock('@microsoft/power-apps', () => ({
  WebApiClient: vi.fn(() => mockWebApiClient),
}));

describe('Projects List', () => {
  it('should display projects from Dataverse', async () => {
    mockWebApiClient.retrieveMultipleRecords.mockResolvedValue({
      entities: [
        { cr6c8_projectid: '1', cr6c8_name: 'Project 1' },
        { cr6c8_projectid: '2', cr6c8_name: 'Project 2' },
      ]
    });
    
    render(<ProjectList />);
    
    await waitFor(() => {
      expect(screen.getByText('Project 1')).toBeInTheDocument();
      expect(screen.getByText('Project 2')).toBeInTheDocument();
    });
  });
});
```

### 10.2 統合テスト

```typescript
import { test, expect } from '@playwright/test';

test.describe('Dataverse Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Power Apps Host環境でテスト
    await page.goto('http://localhost:8181');
  });

  test('should create and retrieve project', async ({ page }) => {
    // プロジェクト作成
    await page.click('button[data-testid="create-project"]');
    await page.fill('input[name="cr6c8_name"]', 'Test Project');
    await page.click('button[type="submit"]');

    // 作成されたプロジェクトが表示されることを確認
    await expect(page.locator('text=Test Project')).toBeVisible();
  });
});
```

---

## 11. パフォーマンス最適化

### 11.1 キャッシング戦略

```typescript
import { useQuery } from '@tanstack/react-query';

// 長期キャッシュ（マスターデータ）
export function useClients() {
  return useQuery({
    queryKey: ['dataverse', 'clients'],
    queryFn: () => dataverseClient.retrieveMultipleRecords('cr6c8_clients'),
    staleTime: 30 * 60 * 1000, // 30分
    gcTime: 60 * 60 * 1000, // 1時間
  });
}

// 短期キャッシュ（動的データ）
export function useTasks(projectId: string) {
  return useQuery({
    queryKey: ['dataverse', 'tasks', projectId],
    queryFn: () => dataverseClient.retrieveMultipleRecords('cr6c8_tasks', {
      filter: `_cr6c8_projectid_value eq ${projectId}`,
    }),
    staleTime: 1 * 60 * 1000, // 1分
    gcTime: 5 * 60 * 1000, // 5分
    enabled: !!projectId, // projectIdが存在する場合のみ実行
  });
}
```

### 11.2 バッチリクエスト

```typescript
/**
 * 複数のデータを並列取得
 */
export async function fetchProjectDetails(projectId: string) {
  const [project, tasks, activities] = await Promise.all([
    dataverseClient.retrieveRecord('cr6c8_projects', projectId),
    dataverseClient.retrieveMultipleRecords('cr6c8_tasks', {
      filter: `_cr6c8_projectid_value eq ${projectId}`,
    }),
    dataverseClient.retrieveMultipleRecords('cr6c8_activities', {
      filter: `_cr6c8_projectid_value eq ${projectId}`,
    }),
  ]);

  return { project, tasks, activities };
}
```

### 11.3 データプリフェッチ

```typescript
import { useQueryClient } from '@tanstack/react-query';

export function ProjectCard({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();

  const handleMouseEnter = () => {
    // マウスホバー時にプリフェッチ
    queryClient.prefetchQuery({
      queryKey: ['dataverse', 'project', projectId],
      queryFn: () => fetchProject(projectId),
    });
  };

  return (
    <div onMouseEnter={handleMouseEnter}>
      {/* ... */}
    </div>
  );
}
```

---

## 12. Application Lifecycle Management (ALM)

### 12.1 ソリューションの作成

```powershell
# 新しいソリューションを作成
pac solution init --publisher-name "YourPublisher" --publisher-prefix "corex"

# Code Appをソリューションに追加
pac solution add-reference --path ./
```

### 12.2 ビルドとパッケージング

```powershell
# Code Appのビルド
cd 
npm run build

# ソリューションのパッケージ化
cd ..
pac solution pack --zipfile .zip --folder ./solution --packagetype Managed
```

### 12.3 環境への展開

```powershell
# 開発環境への展開
pac auth create --url https://dev-org.crm.dynamics.com
pac solution import --path .zip

# 本番環境への展開
pac auth create --url https://prod-org.crm.dynamics.com
pac solution import --path .zip --publish-changes
```

### 12.4 CI/CD パイプライン (GitHub Actions)

```yaml
# .github/workflows/deploy-code-app.yml
name: Deploy Power Apps Code App

on:
  push:
    branches: [main, develop]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: /package-lock.json

      - name: Install dependencies
        run: npm ci
        working-directory: 

      - name: Build Code App
        run: npm run build
        working-directory: 

      - name: Setup Power Platform CLI
        uses: microsoft/powerplatform-actions/actions-install@v1

      - name: Authenticate to Power Platform
        uses: microsoft/powerplatform-actions/who-am-i@v1
        with:
          environment-url: ${{ secrets.POWER_PLATFORM_ENVIRONMENT_URL }}
          app-id: ${{ secrets.POWER_PLATFORM_APP_ID }}
          client-secret: ${{ secrets.POWER_PLATFORM_CLIENT_SECRET }}
          tenant-id: ${{ secrets.POWER_PLATFORM_TENANT_ID }}

      - name: Pack solution
        run: pac solution pack --zipfile .zip --folder ./solution --packagetype Managed

      - name: Import solution
        uses: microsoft/powerplatform-actions/import-solution@v1
        with:
          environment-url: ${{ secrets.POWER_PLATFORM_ENVIRONMENT_URL }}
          app-id: ${{ secrets.POWER_PLATFORM_APP_ID }}
          client-secret: ${{ secrets.POWER_PLATFORM_CLIENT_SECRET }}
          tenant-id: ${{ secrets.POWER_PLATFORM_TENANT_ID }}
          solution-file: .zip
          force-overwrite: true
          publish-changes: true
```

### 12.5 バージョン管理

```powershell
# ソリューションのバージョンを更新
pac solution version --version-number 1.0.1.0

# 変更履歴の記録
git tag -a v1.0.1 -m "Release version 1.0.1"
git push origin v1.0.1
```

---

## 13. ベストプラクティス

### ✅ DO

1. **認証**: Power Appsホストの認証機構を活用し、カスタムMSAL実装は避ける
2. **データアクセス**: `@microsoft/power-apps` の `WebApiClient` を使用してDataverseにアクセス
3. **型安全性**: `pac code add-data-source` で生成された型定義を使用
4. **キャッシング**: TanStack Queryで適切なキャッシュ戦略を実装
5. **エラーハンドリング**: `DataverseError` を適切に処理し、ユーザーフレンドリーなメッセージを表示
6. **パフォーマンス**: 必要なフィールドのみ取得し、バッチ処理を活用
7. **テスト**: `WebApiClient` のモックを使用して単体テストを実装
8. **ALM**: ソリューションベースの開発とCI/CDパイプラインを構築
9. **セキュリティ**: Power Platform環境変数で機密情報を管理
10. **ドキュメント**: 公式ドキュメントを参照し、最新のベストプラクティスに従う

### ❌ DON'T

1. **カスタム認証**: 独自のMSAL実装を作成しない
2. **直接API呼び出し**: `fetch` で直接Dataverse APIを呼ばない
3. **トークン管理**: アクセストークンをローカルストレージに保存しない
4. **大量データ**: ページネーションなしで全データを一度に取得しない
5. **ハードコード**: 環境固有の値をコードに埋め込まない
6. **スキーマ無視**: 型定義を無視して `any` 型を多用しない
7. **エラー無視**: エラーハンドリングを省略しない
8. **手動デプロイ**: 手動でのデプロイに依存しない
9. **未テスト**: テストなしでコードをデプロイしない
10. **ドキュメント不足**: 実装の意図を説明するコメントを省略しない

---

## 14. システム制限と構成

Power Apps Code Apps (Preview) には以下の制限があります:

### 14.1 アプリケーションサイズ

- **最大バンドルサイズ**: 15 MB (gzip圧縮後)
- **最大アセット数**: 500ファイル
- **推奨**: Code splitting と Tree shaking を活用

```typescript
// vite.config.ts でコード分割を設定
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          query: ['@tanstack/react-query'],
        },
      },
    },
  },
});
```

### 14.2 API リクエスト制限

- **Dataverse API**: 毎分60,000リクエスト (環境全体)
- **同時接続**: ユーザーあたり最大52接続
- **推奨**: リクエストのバッチ化とキャッシングを実装

### 14.3 ブラウザ互換性

- **サポート対象**: 最新のChrome、Edge、Safari、Firefox
- **非サポート**: Internet Explorer

---

## 15. トラブルシューティング

### 15.1 認証エラー

**問題**: `Power Apps context not available`

**原因**: Power Apps Host外で実行されている

**解決策**:
```powershell
# pac code run で実行
pac code run
```

### 15.2 Dataverseアクセスエラー

**問題**: `403 Forbidden` when accessing Dataverse

**原因**: データソースが正しく登録されていない、または権限不足

**解決策**:
```powershell
# データソースを再登録
pac code add-data-source dataverse --tables "cr6c8_projects"

# ユーザーのセキュリティロールを確認
# Power Platform管理センターで確認
```

### 15.3 ビルドエラー

**問題**: `Module not found: @microsoft/power-apps`

**原因**: SDK がインストールされていない

**解決策**:
```powershell
# pac code init で自動インストール
pac code init

# または手動インストール
npm install @microsoft/power-apps
```

### 15.4 パフォーマンス問題

**問題**: アプリの読み込みが遅い

**解決策**:
1. バンドルサイズを確認: `npm run build -- --analyze`
2. 不要な依存関係を削除
3. Dynamic import を使用してコード分割
4. 画像を最適化 (WebP形式、適切なサイズ)

### 15.5 デバッグのヒント

```typescript
// 開発モードでのみデバッグ情報を出力
if (import.meta.env.DEV) {
  console.log('Environment:', await Environment.getEnvironmentVariables());
  console.log('User Context:', await Context.getContext());
}
```

---

## 16. 参考リソース

### 公式ドキュメント
- [Power Apps Code Apps クイックスタート](https://learn.microsoft.com/ja-jp/power-apps/developer/code-apps/quickstart)
- [Power Apps Code Apps アーキテクチャ](https://learn.microsoft.com/ja-jp/power-apps/developer/code-apps/architecture)
- [Dataverseへの接続](https://learn.microsoft.com/ja-jp/power-apps/developer/code-apps/how-to/connect-to-dataverse)
- [ALM ガイド](https://learn.microsoft.com/ja-jp/power-apps/developer/code-apps/how-to/alm)

### ツール
- [Power Platform CLI](https://aka.ms/PowerPlatformCLI)
- [@microsoft/power-apps SDK](https://www.npmjs.com/package/@microsoft/power-apps)

### コミュニティ
- [Power Apps Community Forum](https://powerusers.microsoft.com/t5/Power-Apps-Community/ct-p/PowerApps1)
- [Power Platform GitHub](https://github.com/microsoft/PowerPlatform-Tools)

---

## まとめ

Power Apps Code Apps統合では、以下の点が重要です:

1. **公式SDK活用**: `@microsoft/power-apps` と `pac` CLIを中心とした開発
2. **認証自動化**: Power Appsホストによる透過的な認証管理
3. **型安全性**: 自動生成された型定義の活用
4. **ALM準拠**: ソリューションベースの開発とCI/CD
5. **パフォーマンス**: 適切なキャッシングとコード分割

このガイドラインに従うことで、Power Platform標準に準拠した保守性の高いCode Appを開発できます。

---

**Version**: 2.0.0  
**Last Updated**: 2025年11月14日  
**対応SDK**: @microsoft/power-apps 1.x  
**対応CLI**: pac 1.33+
