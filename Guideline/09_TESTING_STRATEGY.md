# テスト戦略ガイドライン

## 目的

品質の高いコードを維持し、リグレッションを防ぐための包括的なテスト戦略を定義します。

---

## 1. テストピラミッド

```
        ┌───────────┐
       │  E2E Tests │  (10%)
      │  UI統合テスト  │
     └───────────────┘
    ┌─────────────────┐
   │ Integration Tests│  (20%)
  │  API・コンポーネント │
 └───────────────────────┘
┌─────────────────────────┐
│      Unit Tests         │  (70%)
│  関数・ロジック・ユーティリティ │
└─────────────────────────┘
```

### テストレベル

- **ユニットテスト (70%)**: 個別の関数・コンポーネント・ロジック
- **統合テスト (20%)**: API連携・複数コンポーネントの統合
- **E2Eテスト (10%)**: ユーザーシナリオの自動化

---

## 2. フロントエンドテスト

### 2.1 テストツール

```json
{
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.4",
    "@testing-library/user-event": "^14.5.1",
    "@vitest/ui": "^1.0.0",
    "vitest": "^1.0.0",
    "jsdom": "^23.0.0",
    "@playwright/test": "^1.40.0",
    "msw": "^2.0.0"
  }
}
```

### 2.2 Vitest設定

**実装場所:** `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 2.3 テストセットアップ

**実装場所:** `src/tests/setup.ts`

```typescript
import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Jest-DOMマッチャーを追加
expect.extend(matchers);

// 各テスト後にクリーンアップ
afterEach(() => {
  cleanup();
});

// グローバルモック
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// matchMediaモック
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

### 2.4 ユニットテスト例

#### ユーティリティ関数のテスト

```typescript
// src/lib/utils.test.ts
import { describe, it, expect } from 'vitest';
import { cn, formatDate, formatCurrency } from './utils';

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
    });

    it('should handle conditional classes', () => {
      expect(cn('base', { active: true, disabled: false })).toBe('base active');
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15');
      expect(formatDate(date)).toBe('2024年1月15日');
    });

    it('should handle invalid date', () => {
      expect(formatDate(null)).toBe('');
    });
  });

  describe('formatCurrency', () => {
    it('should format currency with yen symbol', () => {
      expect(formatCurrency(1000)).toBe('¥1,000');
    });

    it('should handle zero', () => {
      expect(formatCurrency(0)).toBe('¥0');
    });
  });
});
```

#### コンポーネントのテスト

```typescript
// src/components/ui/Button.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './button';

describe('Button', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<Button onClick={handleClick}>Click me</Button>);
    
    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should apply variant styles', () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-destructive');
  });

  it('should show loading state', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
});
```

#### カスタムフックのテスト

```typescript
// src/hooks/use-projects.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProjects, useCreateProject } from './use-projects';

// モック
vi.mock('@/services/api', () => ({
  projectsApi: {
    getAll: vi.fn(),
    create: vi.fn(),
  },
}));

import { projectsApi } from '@/services/api';

describe('useProjects', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should fetch projects successfully', async () => {
    const mockProjects = [
      { id: '1', name: 'Project 1' },
      { id: '2', name: 'Project 2' },
    ];
    
    vi.mocked(projectsApi.getAll).mockResolvedValue(mockProjects);

    const { result } = renderHook(() => useProjects(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockProjects);
  });

  it('should handle error when fetching projects', async () => {
    vi.mocked(projectsApi.getAll).mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useProjects(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });
});

describe('useCreateProject', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should create project successfully', async () => {
    const newProject = { name: 'New Project', description: 'Test' };
    const createdProject = { id: '3', ...newProject };
    
    vi.mocked(projectsApi.create).mockResolvedValue(createdProject);

    const { result } = renderHook(() => useCreateProject(), { wrapper });

    result.current.mutate(newProject);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(createdProject);
  });
});
```

### 2.5 統合テスト例

#### ページコンポーネントのテスト

```typescript
// src/pages/projects.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import ProjectsPage from './projects';
import { projectsApi } from '@/services/api';

vi.mock('@/services/api');

describe('ProjectsPage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );

  it('should display projects list', async () => {
    const mockProjects = [
      { id: '1', name: 'Project A', status: 'active' },
      { id: '2', name: 'Project B', status: 'completed' },
    ];

    vi.mocked(projectsApi.getAll).mockResolvedValue(mockProjects);

    render(<ProjectsPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Project A')).toBeInTheDocument();
      expect(screen.getByText('Project B')).toBeInTheDocument();
    });
  });

  it('should create new project', async () => {
    const user = userEvent.setup();
    const mockProjects = [];
    const newProject = { id: '1', name: 'New Project', status: 'active' };

    vi.mocked(projectsApi.getAll).mockResolvedValue(mockProjects);
    vi.mocked(projectsApi.create).mockResolvedValue(newProject);

    render(<ProjectsPage />, { wrapper });

    // 新規作成ボタンをクリック
    await user.click(screen.getByRole('button', { name: /新規作成/i }));

    // フォームに入力
    await user.type(screen.getByLabelText(/プロジェクト名/i), 'New Project');
    
    // 保存ボタンをクリック
    await user.click(screen.getByRole('button', { name: /保存/i }));

    // 新しいプロジェクトが表示される
    await waitFor(() => {
      expect(screen.getByText('New Project')).toBeInTheDocument();
    });
  });

  it('should display error message on API failure', async () => {
    vi.mocked(projectsApi.getAll).mockRejectedValue(new Error('Network error'));

    render(<ProjectsPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/エラーが発生しました/i)).toBeInTheDocument();
    });
  });
});
```

### 2.6 MSWを使用したAPIモック

```typescript
// src/tests/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

const API_URL = 'http://localhost:8000/api';

export const handlers = [
  // Projects
  http.get(`${API_URL}/projects/`, () => {
    return HttpResponse.json([
      {
        id: '1',
        name: 'Project Alpha',
        description: 'First project',
        status: 'active',
        start_date: '2024-01-01',
        client: { id: '1', name: 'Client A' },
      },
      {
        id: '2',
        name: 'Project Beta',
        description: 'Second project',
        status: 'planning',
        start_date: '2024-02-01',
        client: { id: '2', name: 'Client B' },
      },
    ]);
  }),

  http.post(`${API_URL}/projects/`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      {
        id: '3',
        ...body,
        created_at: new Date().toISOString(),
      },
      { status: 201 }
    );
  }),

  http.put(`${API_URL}/projects/:id/`, async ({ params, request }) => {
    const body = await request.json();
    return HttpResponse.json({
      id: params.id,
      ...body,
      updated_at: new Date().toISOString(),
    });
  }),

  http.delete(`${API_URL}/projects/:id/`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Clients
  http.get(`${API_URL}/clients/`, () => {
    return HttpResponse.json([
      { id: '1', name: 'Client A', email: 'a@example.com' },
      { id: '2', name: 'Client B', email: 'b@example.com' },
    ]);
  }),

  // Error scenarios
  http.get(`${API_URL}/error/`, () => {
    return new HttpResponse(null, { status: 500 });
  }),
];

// src/tests/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);

// src/tests/setup.ts に追加
import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from './mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### 2.7 E2Eテスト (Playwright)

```typescript
// tests/e2e/projects.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Projects Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/projects');
  });

  test('should display projects list', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'プロジェクト一覧' })).toBeVisible();
    
    // プロジェクトが表示される
    await expect(page.getByText('Project Alpha')).toBeVisible();
    await expect(page.getByText('Project Beta')).toBeVisible();
  });

  test('should create new project', async ({ page }) => {
    // 新規作成ボタンをクリック
    await page.getByRole('button', { name: '新規作成' }).click();
    
    // フォームに入力
    await page.getByLabel('プロジェクト名').fill('Test Project');
    await page.getByLabel('説明').fill('This is a test project');
    await page.getByLabel('開始日').fill('2024-03-01');
    await page.getByLabel('クライアント').selectOption('Client A');
    
    // 保存
    await page.getByRole('button', { name: '保存' }).click();
    
    // 成功メッセージ
    await expect(page.getByText('プロジェクトを作成しました')).toBeVisible();
    
    // リストに追加される
    await expect(page.getByText('Test Project')).toBeVisible();
  });

  test('should edit project', async ({ page }) => {
    // プロジェクトをクリック
    await page.getByText('Project Alpha').click();
    
    // 編集ボタンをクリック
    await page.getByRole('button', { name: '編集' }).click();
    
    // 名前を変更
    await page.getByLabel('プロジェクト名').clear();
    await page.getByLabel('プロジェクト名').fill('Project Alpha Updated');
    
    // 保存
    await page.getByRole('button', { name: '保存' }).click();
    
    // 更新確認
    await expect(page.getByText('Project Alpha Updated')).toBeVisible();
  });

  test('should delete project', async ({ page }) => {
    // プロジェクトをクリック
    await page.getByText('Project Beta').click();
    
    // 削除ボタンをクリック
    await page.getByRole('button', { name: '削除' }).click();
    
    // 確認ダイアログ
    await page.getByRole('button', { name: '削除する' }).click();
    
    // 削除確認
    await expect(page.getByText('プロジェクトを削除しました')).toBeVisible();
    await expect(page.getByText('Project Beta')).not.toBeVisible();
  });

  test('should filter projects', async ({ page }) => {
    // 検索フィールドに入力
    await page.getByPlaceholder('プロジェクトを検索').fill('Alpha');
    
    // フィルタされた結果
    await expect(page.getByText('Project Alpha')).toBeVisible();
    await expect(page.getByText('Project Beta')).not.toBeVisible();
  });

  test('should handle errors gracefully', async ({ page }) => {
    // APIエラーをシミュレート
    await page.route('**/api/projects/', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });
    
    await page.reload();
    
    // エラーメッセージが表示される
    await expect(page.getByText('エラーが発生しました')).toBeVisible();
  });
});
```

---

## 3. バックエンドテスト

### 3.1 Django テスト設定

```python
# config/settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# テスト時はメモリ内DB使用
if 'test' in sys.argv:
    DATABASES['default'] = {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
```

### 3.2 モデルテスト

```python
# projects/tests.py
from django.test import TestCase
from django.utils import timezone
from .models import Project, Client
from members.models import Member

class ProjectModelTest(TestCase):
    def setUp(self):
        self.client = Client.objects.create(
            name="Test Client",
            email="test@example.com"
        )
        self.member = Member.objects.create(
            name="Test Member",
            email="member@example.com"
        )

    def test_create_project(self):
        """プロジェクト作成のテスト"""
        project = Project.objects.create(
            name="Test Project",
            description="Test Description",
            client=self.client,
            start_date=timezone.now().date(),
            status="planning"
        )
        
        self.assertEqual(project.name, "Test Project")
        self.assertEqual(project.client, self.client)
        self.assertEqual(project.status, "planning")

    def test_project_str(self):
        """__str__メソッドのテスト"""
        project = Project.objects.create(
            name="Test Project",
            client=self.client,
            start_date=timezone.now().date()
        )
        
        self.assertEqual(str(project), "Test Project")

    def test_project_validation(self):
        """バリデーションのテスト"""
        project = Project(
            name="",  # 必須フィールドが空
            client=self.client,
            start_date=timezone.now().date()
        )
        
        with self.assertRaises(ValidationError):
            project.full_clean()

    def test_project_members_relationship(self):
        """メンバーとのリレーションのテスト"""
        project = Project.objects.create(
            name="Test Project",
            client=self.client,
            start_date=timezone.now().date()
        )
        
        project.members.add(self.member)
        
        self.assertEqual(project.members.count(), 1)
        self.assertIn(self.member, project.members.all())

    def test_project_date_validation(self):
        """日付バリデーションのテスト"""
        start_date = timezone.now().date()
        end_date = start_date - timezone.timedelta(days=1)
        
        project = Project(
            name="Test Project",
            client=self.client,
            start_date=start_date,
            end_date=end_date  # 開始日より前
        )
        
        with self.assertRaises(ValidationError):
            project.clean()
```

### 3.3 APIテスト

```python
# projects/tests/test_api.py
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from projects.models import Project, Client
from django.utils import timezone

class ProjectAPITest(APITestCase):
    def setUp(self):
        self.client_obj = Client.objects.create(
            name="Test Client",
            email="test@example.com"
        )
        
        self.project = Project.objects.create(
            name="Existing Project",
            description="Existing Description",
            client=self.client_obj,
            start_date=timezone.now().date(),
            status="active"
        )
        
        self.list_url = reverse('project-list')
        self.detail_url = reverse('project-detail', kwargs={'pk': self.project.pk})

    def test_get_projects_list(self):
        """プロジェクト一覧取得のテスト"""
        response = self.client.get(self.list_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], "Existing Project")

    def test_get_project_detail(self):
        """プロジェクト詳細取得のテスト"""
        response = self.client.get(self.detail_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], "Existing Project")
        self.assertEqual(response.data['status'], "active")

    def test_create_project(self):
        """プロジェクト作成のテスト"""
        data = {
            'name': 'New Project',
            'description': 'New Description',
            'client': self.client_obj.pk,
            'start_date': timezone.now().date().isoformat(),
            'status': 'planning'
        }
        
        response = self.client.post(self.list_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Project.objects.count(), 2)
        self.assertEqual(response.data['name'], 'New Project')

    def test_create_project_invalid_data(self):
        """不正なデータでのプロジェクト作成テスト"""
        data = {
            'name': '',  # 必須フィールドが空
            'client': self.client_obj.pk,
        }
        
        response = self.client.post(self.list_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_project(self):
        """プロジェクト更新のテスト"""
        data = {
            'name': 'Updated Project',
            'description': 'Updated Description',
            'client': self.client_obj.pk,
            'start_date': self.project.start_date.isoformat(),
            'status': 'completed'
        }
        
        response = self.client.put(self.detail_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.project.refresh_from_db()
        self.assertEqual(self.project.name, 'Updated Project')
        self.assertEqual(self.project.status, 'completed')

    def test_partial_update_project(self):
        """プロジェクト部分更新のテスト"""
        data = {'status': 'on_hold'}
        
        response = self.client.patch(self.detail_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.project.refresh_from_db()
        self.assertEqual(self.project.status, 'on_hold')

    def test_delete_project(self):
        """プロジェクト削除のテスト"""
        response = self.client.delete(self.detail_url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Project.objects.count(), 0)

    def test_filter_projects_by_status(self):
        """ステータスによるフィルタリングのテスト"""
        Project.objects.create(
            name="Planning Project",
            client=self.client_obj,
            start_date=timezone.now().date(),
            status="planning"
        )
        
        response = self.client.get(f"{self.list_url}?status=planning")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['status'], 'planning')

    def test_search_projects(self):
        """プロジェクト検索のテスト"""
        response = self.client.get(f"{self.list_url}?search=Existing")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_ordering_projects(self):
        """プロジェクトソートのテスト"""
        Project.objects.create(
            name="Alpha Project",
            client=self.client_obj,
            start_date=timezone.now().date()
        )
        
        response = self.client.get(f"{self.list_url}?ordering=name")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['name'], 'Alpha Project')
```

### 3.4 パフォーマンステスト

```python
# projects/tests/test_performance.py
from django.test import TestCase, TransactionTestCase
from django.utils import timezone
from projects.models import Project, Client
import time

class ProjectPerformanceTest(TransactionTestCase):
    def setUp(self):
        self.client_obj = Client.objects.create(
            name="Test Client",
            email="test@example.com"
        )

    def test_bulk_create_performance(self):
        """一括作成のパフォーマンステスト"""
        start_time = time.time()
        
        projects = [
            Project(
                name=f"Project {i}",
                client=self.client_obj,
                start_date=timezone.now().date()
            )
            for i in range(1000)
        ]
        
        Project.objects.bulk_create(projects)
        
        elapsed_time = time.time() - start_time
        
        self.assertLess(elapsed_time, 2.0)  # 2秒以内
        self.assertEqual(Project.objects.count(), 1000)

    def test_query_optimization(self):
        """クエリ最適化のテスト"""
        # テストデータ作成
        for i in range(100):
            Project.objects.create(
                name=f"Project {i}",
                client=self.client_obj,
                start_date=timezone.now().date()
            )
        
        # select_related使用
        with self.assertNumQueries(1):
            projects = list(Project.objects.select_related('client').all())
            for project in projects:
                _ = project.client.name
```

---

## 4. テスト実行

### 4.1 フロントエンド

```bash
# すべてのテスト実行
npm test

# ウォッチモード
npm test -- --watch

# カバレッジレポート
npm test -- --coverage

# 特定のファイルのテスト
npm test -- src/components/ui/button.test.tsx

# UI表示
npm test -- --ui

# E2Eテスト
npx playwright test

# E2Eテスト (UI mode)
npx playwright test --ui
```

### 4.2 バックエンド

```bash
# すべてのテスト実行
python manage.py test

# 特定のアプリのテスト
python manage.py test projects

# カバレッジレポート
coverage run --source='.' manage.py test
coverage report
coverage html

# パラレル実行
python manage.py test --parallel
```

---

## 5. CI/CD統合

### 5.1 GitHub Actions設定

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  frontend-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: /package-lock.json
      
      - name: Install dependencies
        run: npm ci
        working-directory: 
      
      - name: Run tests
        run: npm test -- --coverage
        working-directory: 
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: .//coverage/coverage-final.json

  backend-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
          cache: 'pip'
      
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install coverage
        working-directory: 
      
      - name: Run tests
        run: |
          coverage run --source='.' manage.py test
          coverage xml
        working-directory: 
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: .//coverage.xml

  e2e-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          npm ci
          npx playwright install --with-deps
        working-directory: 
      
      - name: Run E2E tests
        run: npx playwright test
        working-directory: 
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: /playwright-report/
```

---

## 6. テストカバレッジ目標

### 6.1 カバレッジ基準

| レイヤー | 目標カバレッジ |
|---------|-------------|
| ユーティリティ関数 | 95%以上 |
| ビジネスロジック | 90%以上 |
| API/サービス層 | 85%以上 |
| UIコンポーネント | 80%以上 |
| 統合テスト | 75%以上 |

### 6.2 カバレッジレポート確認

```bash
# フロントエンド
npm test -- --coverage
open /coverage/index.html

# バックエンド
coverage run --source='.' manage.py test
coverage html
open /htmlcov/index.html
```

---

## 7. ベストプラクティス

### ✅ DO

- **Arrange-Act-Assert (AAA)パターン** を使用
- **テストは独立** させる（他のテストに依存しない）
- **わかりやすいテスト名** を付ける
- **エッジケースをテスト** する
- **モックは必要最小限** にする
- **E2Eテストはクリティカルパス** に集中

### ❌ DON'T

- 実装の詳細をテストしない
- テストでビジネスロジックを実装しない
- フレーキーなテストを放置しない
- カバレッジ100%を目指さない（費用対効果）
- テストが遅くなることを気にしすぎない

---

## まとめ

効果的なテスト戦略により:

✅ **品質保証** - バグの早期発見
✅ **リファクタリングの安全性** - 変更の影響を確認
✅ **ドキュメント** - テストがコードの使い方を示す
✅ **CI/CD統合** - 自動化された品質チェック
✅ **開発速度向上** - 手動テストの削減

このガイドラインに従うことで、信頼性の高いコードベースを維持できます。
