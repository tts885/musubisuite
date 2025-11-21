# API設計ガイドライン

## 📋 目次
- [API設計原則](#api設計原則)
- [RESTful API規約](#restful-api規約)
- [リクエスト設計](#リクエスト設計)
- [レスポンス設計](#レスポンス設計)
- [エラーハンドリング](#エラーハンドリング)
- [ページネーション](#ページネーション)
- [フィルタリング・検索](#フィルタリング検索)
- [バージョニング](#バージョニング)

## API設計原則

### 1. 一貫性
- すべてのエンドポイントで統一された命名規則
- 統一されたレスポンス構造
- 予測可能なエラーレスポンス

### 2. RESTful原則
- リソース指向の設計
- 適切なHTTPメソッドの使用
- ステートレスな通信

### 3. セキュリティファースト
- 認証・認可の徹底
- 入力バリデーション
- レート制限

### 4. パフォーマンス
- 効率的なクエリ
- 適切なキャッシング
- ページネーション

### 5. 開発者体験
- 明確なドキュメント
- わかりやすいエラーメッセージ
- 一貫したネーミング

## RESTful API規約

### HTTPメソッド

| メソッド | 用途 | 冪等性 | 安全性 |
|---------|------|--------|--------|
| GET | リソース取得 | ✅ | ✅ |
| POST | リソース作成 | ❌ | ❌ |
| PUT | リソース全体更新 | ✅ | ❌ |
| PATCH | リソース部分更新 | ❌ | ❌ |
| DELETE | リソース削除 | ✅ | ❌ |

### エンドポイント設計

#### 基本パターン
```
# コレクション（複数形を使用）
GET    /api/projects/              # 一覧取得
POST   /api/projects/              # 新規作成

# 単一リソース
GET    /api/projects/{id}/         # 詳細取得
PUT    /api/projects/{id}/         # 全体更新
PATCH  /api/projects/{id}/         # 部分更新
DELETE /api/projects/{id}/         # 削除
```

#### ネストされたリソース
```
# プロジェクトに紐づくタスク
GET    /api/projects/{id}/tasks/           # プロジェクトのタスク一覧
POST   /api/projects/{id}/tasks/           # タスク作成
GET    /api/projects/{id}/tasks/{task_id}/ # タスク詳細

# ネストは2階層まで推奨
# ❌ /api/projects/{id}/tasks/{task_id}/comments/{comment_id}/
# ✅ /api/comments/{comment_id}/
```

#### カスタムアクション
```
# リソースに対する特殊な操作
POST   /api/projects/{id}/complete/    # プロジェクト完了
POST   /api/projects/{id}/archive/     # アーカイブ
POST   /api/tasks/{id}/assign/         # タスク割り当て

# コレクションレベルの操作
GET    /api/projects/active/           # 進行中のプロジェクト
GET    /api/projects/search/           # 検索
POST   /api/projects/bulk-create/      # 一括作成
```

### ステータスコード

#### 成功レスポンス

| コード | 意味 | 使用ケース |
|-------|------|-----------|
| 200 OK | 成功 | GET, PUT, PATCH, DELETE成功 |
| 201 Created | 作成成功 | POST成功（新規リソース作成） |
| 204 No Content | 成功（コンテンツなし） | DELETE成功（レスポンスボディなし） |

#### クライアントエラー

| コード | 意味 | 使用ケース |
|-------|------|-----------|
| 400 Bad Request | 不正なリクエスト | バリデーションエラー |
| 401 Unauthorized | 未認証 | トークンなし・無効 |
| 403 Forbidden | 権限なし | アクセス権限不足 |
| 404 Not Found | リソースなし | 存在しないID |
| 409 Conflict | 競合 | 重複データ作成 |
| 422 Unprocessable Entity | 処理不可 | ビジネスロジックエラー |
| 429 Too Many Requests | リクエスト過多 | レート制限超過 |

#### サーバーエラー

| コード | 意味 | 使用ケース |
|-------|------|-----------|
| 500 Internal Server Error | サーバーエラー | 予期しないエラー |
| 502 Bad Gateway | ゲートウェイエラー | 上流サーバーエラー |
| 503 Service Unavailable | サービス利用不可 | メンテナンス中 |

## リクエスト設計

### ヘッダー

#### 必須ヘッダー
```http
Content-Type: application/json
Accept: application/json
Authorization: Bearer {access_token}
```

#### 推奨ヘッダー
```http
Accept-Language: ja
X-Request-ID: {uuid}  # リクエスト追跡用
User-Agent: /1.0.0
```

### リクエストボディ

#### JSON形式（推奨）
```json
{
  "name": "新規プロジェクト",
  "description": "プロジェクトの説明",
  "start_date": "2025-01-01",
  "end_date": "2025-12-31",
  "status": "planning",
  "budget": 1000000
}
```

#### フィールド命名規則
- **snake_case**: バックエンドAPI
- **camelCase**: フロントエンド（変換レイヤーで対応）

```typescript
// フロントエンド (camelCase)
const project = {
  startDate: "2025-01-01",
  endDate: "2025-12-31"
};

// APIリクエスト変換 (snake_case)
const apiData = {
  start_date: project.startDate,
  end_date: project.endDate
};
```

### バリデーション

#### 必須フィールド
```json
{
  "name": "プロジェクト名",  // 必須
  "start_date": "2025-01-01"  // 必須
}
```

#### データ型
```json
{
  "name": "string",
  "budget": "number (decimal)",
  "start_date": "string (ISO 8601)",
  "is_active": "boolean",
  "members": "array"
}
```

## レスポンス設計

### 成功レスポンス

#### 単一リソース
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "プロジェクト名",
  "description": "説明",
  "start_date": "2025-01-01",
  "end_date": "2025-12-31",
  "status": "active",
  "budget": 1000000.00,
  "member_count": 5,
  "task_count": 20,
  "is_overdue": false,
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-15T10:30:00Z"
}
```

#### リソース一覧（ページネーションなし）
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "プロジェクト1",
    "status": "active"
  },
  {
    "id": "223e4567-e89b-12d3-a456-426614174001",
    "name": "プロジェクト2",
    "status": "completed"
  }
]
```

#### リソース一覧（ページネーションあり）
```json
{
  "count": 100,
  "next": "http://api.example.com/api/projects/?page=3",
  "previous": "http://api.example.com/api/projects/?page=1",
  "results": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "プロジェクト1",
      "status": "active"
    }
  ]
}
```

#### 作成成功（201 Created）
```json
// リクエスト
POST /api/projects/
{
  "name": "新規プロジェクト",
  "start_date": "2025-01-01"
}

// レスポンス
Status: 201 Created
Location: /api/projects/123e4567-e89b-12d3-a456-426614174000/
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "新規プロジェクト",
  "start_date": "2025-01-01",
  "status": "planning",
  "created_at": "2025-01-01T00:00:00Z"
}
```

### エラーレスポンス

#### 基本構造
```json
{
  "error": {
    "status_code": 400,
    "message": "バリデーションエラー",
    "details": {
      "name": ["プロジェクト名は必須です"],
      "end_date": ["終了日は開始日以降の日付を指定してください"]
    },
    "timestamp": "2025-01-01T00:00:00Z",
    "path": "/api/projects/"
  }
}
```

#### バリデーションエラー（400）
```json
{
  "error": {
    "status_code": 400,
    "message": "バリデーションエラー",
    "details": {
      "name": [
        "プロジェクト名は必須です",
        "プロジェクト名は200文字以内で入力してください"
      ],
      "budget": [
        "予算は0以上で指定してください"
      ]
    }
  }
}
```

#### 認証エラー（401）
```json
{
  "error": {
    "status_code": 401,
    "message": "認証が必要です",
    "details": {
      "reason": "トークンが提供されていません"
    }
  }
}
```

#### 認可エラー（403）
```json
{
  "error": {
    "status_code": 403,
    "message": "アクセス権限がありません",
    "details": {
      "reason": "このプロジェクトを編集する権限がありません"
    }
  }
}
```

#### リソースなし（404）
```json
{
  "error": {
    "status_code": 404,
    "message": "リソースが見つかりません",
    "details": {
      "resource": "Project",
      "id": "invalid-id"
    }
  }
}
```

#### サーバーエラー（500）
```json
{
  "error": {
    "status_code": 500,
    "message": "サーバーエラーが発生しました",
    "details": {
      "error_id": "err_123456",
      "message": "予期しないエラーが発生しました。しばらくしてから再度お試しください"
    }
  }
}
```

## エラーハンドリング

### フロントエンド実装

```typescript
// src/services/djangoAPI.ts
import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';

interface APIError {
  error: {
    status_code: number;
    message: string;
    details: Record<string, string[]> | { reason?: string };
  };
}

export async function handleAPIError(error: unknown): Promise<never> {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<APIError>;
    const apiError = axiosError.response?.data?.error;
    
    if (apiError) {
      // バリデーションエラー
      if (apiError.status_code === 400 && typeof apiError.details === 'object') {
        const messages = Object.entries(apiError.details)
          .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
          .join('\n');
        toast.error('入力エラー', { description: messages });
      }
      // 認証エラー
      else if (apiError.status_code === 401) {
        toast.error('認証エラー', { description: '再度ログインしてください' });
        // ログインページへリダイレクト
        window.location.href = '/login';
      }
      // 権限エラー
      else if (apiError.status_code === 403) {
        toast.error('権限エラー', { description: apiError.message });
      }
      // その他のエラー
      else {
        toast.error('エラー', { description: apiError.message });
      }
    } else {
      // ネットワークエラー
      toast.error('ネットワークエラー', {
        description: 'サーバーに接続できませんでした',
      });
    }
  } else {
    toast.error('予期しないエラー', {
      description: 'エラーが発生しました',
    });
  }
  
  throw error;
}

// 使用例
try {
  const project = await projectService.create(data);
  return project;
} catch (error) {
  handleAPIError(error);
}
```

### バックエンド実装

```python
# config/exceptions.py
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    """カスタム例外ハンドラー"""
    response = exception_handler(exc, context)
    
    if response is not None:
        # リクエスト情報取得
        request = context.get('request')
        path = request.path if request else ''
        
        # カスタムエラーレスポンス
        error_response = {
            'error': {
                'status_code': response.status_code,
                'message': get_error_message(exc, response.status_code),
                'details': response.data,
                'timestamp': timezone.now().isoformat(),
                'path': path,
            }
        }
        
        # ログ記録
        logger.error(f"API Error: {response.status_code} - {path}", extra={
            'exception': str(exc),
            'status_code': response.status_code,
        })
        
        return Response(error_response, status=response.status_code)
    
    # 予期しないエラー
    logger.exception("Unhandled exception", exc_info=exc)
    return Response({
        'error': {
            'status_code': 500,
            'message': 'サーバーエラーが発生しました',
            'details': {'message': str(exc)},
            'timestamp': timezone.now().isoformat(),
        }
    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def get_error_message(exc, status_code):
    """ステータスコードに応じたエラーメッセージ"""
    messages = {
        400: 'バリデーションエラー',
        401: '認証が必要です',
        403: 'アクセス権限がありません',
        404: 'リソースが見つかりません',
        409: 'データの競合が発生しました',
        422: '処理できないリクエストです',
        500: 'サーバーエラーが発生しました',
    }
    return messages.get(status_code, str(exc))
```

## ページネーション

### Django REST Framework実装

```python
# config/settings.py
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# カスタムページネーション
from rest_framework.pagination import PageNumberPagination

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

# views.py
class ProjectViewSet(viewsets.ModelViewSet):
    pagination_class = StandardResultsSetPagination
```

### リクエスト例

```
GET /api/projects/?page=2&page_size=10
```

### レスポンス例

```json
{
  "count": 45,
  "next": "http://api.example.com/api/projects/?page=3&page_size=10",
  "previous": "http://api.example.com/api/projects/?page=1&page_size=10",
  "results": [
    {
      "id": "123",
      "name": "プロジェクト1"
    }
  ]
}
```

### フロントエンド実装

```typescript
// TanStack Queryでの無限スクロール
export function useInfiniteProjects() {
  return useInfiniteQuery({
    queryKey: ['projects', 'infinite'],
    queryFn: ({ pageParam = 1 }) => 
      projectService.getAll({ page: pageParam }),
    getNextPageParam: (lastPage) => {
      // nextがnullの場合は最後のページ
      return lastPage.next ? lastPage.page + 1 : undefined;
    },
  });
}

// 使用例
function ProjectsList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteProjects();
  
  return (
    <div>
      {data?.pages.map((page) => (
        page.results.map(project => (
          <ProjectCard key={project.id} project={project} />
        ))
      ))}
      
      {hasNextPage && (
        <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? '読み込み中...' : 'もっと見る'}
        </Button>
      )}
    </div>
  );
}
```

## フィルタリング・検索

### クエリパラメータ

```
# ステータスフィルター
GET /api/projects/?status=active

# 日付範囲フィルター
GET /api/projects/?start_date_from=2025-01-01&start_date_to=2025-12-31

# 検索
GET /api/projects/?search=プロジェクト

# ソート
GET /api/projects/?ordering=-created_at

# 複数フィルター
GET /api/projects/?status=active&search=重要&ordering=-start_date
```

### バックエンド実装

```python
# views.py
from django_filters import rest_framework as filters

class ProjectFilter(filters.FilterSet):
    """プロジェクトフィルター"""
    
    start_date_from = filters.DateFilter(field_name='start_date', lookup_expr='gte')
    start_date_to = filters.DateFilter(field_name='start_date', lookup_expr='lte')
    
    class Meta:
        model = Project
        fields = {
            'status': ['exact', 'in'],
            'name': ['icontains'],
        }

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    filterset_class = ProjectFilter
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'start_date', 'status']
```

### フロントエンド実装

```typescript
// カスタムフックでフィルター管理
interface ProjectFilters {
  status?: string;
  search?: string;
  start_date_from?: string;
  start_date_to?: string;
  ordering?: string;
}

export function useFilteredProjects(filters: ProjectFilters) {
  return useQuery({
    queryKey: ['projects', filters],
    queryFn: () => projectService.getAll(filters),
  });
}

// 使用例
function ProjectsList() {
  const [filters, setFilters] = useState<ProjectFilters>({
    status: 'active',
  });
  
  const { data: projects } = useFilteredProjects(filters);
  
  return (
    <div>
      <select
        value={filters.status}
        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
      >
        <option value="">すべて</option>
        <option value="active">進行中</option>
        <option value="completed">完了</option>
      </select>
      
      {/* ... */}
    </div>
  );
}
```

## バージョニング

### URL パスバージョニング（推奨）

```
GET /api/v1/projects/
GET /api/v2/projects/
```

```python
# config/urls.py
urlpatterns = [
    path('api/v1/', include('api.v1.urls')),
    path('api/v2/', include('api.v2.urls')),
]
```

### ヘッダーバージョニング

```http
GET /api/projects/
Accept: application/vnd..v1+json
```

### バージョン管理戦略

1. **下位互換性の維持**
   - 既存フィールドの削除禁止
   - 新規フィールドはオプショナル

2. **バージョン廃止プロセス**
   - 廃止予定の通知（6ヶ月前）
   - 移行ガイドの提供
   - サポート終了

3. **バージョン選択**
   - v1: 安定版
   - v2: 新機能
   - beta: 実験的機能

---

**Version**: 1.0.0  
**Last Updated**: 2025年11月14日
