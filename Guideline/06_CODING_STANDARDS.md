# コーディング規約

## 📋 目次
- [命名規則](#命名規則)
- [フォーマット規約](#フォーマット規約)
- [コメント規約](#コメント規約)
- [関数・メソッド設計](#関数メソッド設計)
- [エラーハンドリング](#エラーハンドリング)
- [TypeScript規約](#typescript規約)
- [Python規約](#python規約)
- [Git規約](#git規約)

## 命名規則

### TypeScript/JavaScript

#### 変数・関数
```typescript
// ✅ camelCase
const userName = 'John Doe';
const projectCount = 10;

function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// Boolean値は is/has/can で開始
const isActive = true;
const hasPermission = false;
const canEdit = true;

// イベントハンドラーは handle で開始
const handleSubmit = () => { /* ... */ };
const handleChange = (e: React.ChangeEvent) => { /* ... */ };

// ❌ 避けるべき命名
const x = 10; // 意味不明
const data = fetchData(); // 曖昧
const temp = value; // 一時変数でも意味のある名前を
```

#### 定数
```typescript
// ✅ UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;
const API_BASE_URL = 'https://api.example.com';
const DEFAULT_PAGE_SIZE = 20;

// enum
enum ProjectStatus {
  Planning = 'planning',
  Active = 'active',
  Completed = 'completed',
  OnHold = 'on_hold',
}
```

#### クラス・型・インターフェース
```typescript
// ✅ PascalCase
class ProjectManager {
  // ...
}

interface ProjectData {
  id: string;
  name: string;
}

type ProjectStatus = 'planning' | 'active' | 'completed';

// 型エイリアスは名詞
type UserProfile = {
  name: string;
  email: string;
};

// インターフェースは名詞（Iプレフィックスは不要）
interface Project {
  id: string;
  name: string;
}
```

#### ファイル名
```
// コンポーネント: PascalCase
ProjectCard.tsx
UserProfile.tsx

// UIコンポーネント: kebab-case
button.tsx
dropdown-menu.tsx

// ユーティリティ・サービス: camelCase
apiClient.ts
dateUtils.ts

// フック: camelCase (use で開始)
useProjects.ts
useAuth.ts

// ページ: kebab-case
project-detail.tsx
user-settings.tsx
```

### Python

#### 変数・関数
```python
# ✅ snake_case
user_name = 'John Doe'
project_count = 10

def calculate_total(items: list[Item]) -> float:
    return sum(item.price for item in items)

# Boolean値
is_active = True
has_permission = False
can_edit = True

# ❌ 避けるべき命名
x = 10  # 意味不明
data = fetch_data()  # 曖昧
temp = value  # 一時変数でも意味のある名前を
```

#### 定数
```python
# ✅ UPPER_SNAKE_CASE
MAX_RETRY_COUNT = 3
API_BASE_URL = 'https://api.example.com'
DEFAULT_PAGE_SIZE = 20
```

#### クラス
```python
# ✅ PascalCase
class ProjectManager:
    pass

class UserProfile:
    pass

# プライベートメソッド・変数: _ で開始
class Project:
    def __init__(self):
        self._internal_state = None  # プライベート
    
    def _calculate_score(self):  # プライベートメソッド
        pass
    
    def get_score(self):  # パブリックメソッド
        return self._calculate_score()
```

#### ファイル・モジュール
```
# snake_case
project_manager.py
user_service.py
data_utils.py
```

## フォーマット規約

### TypeScript/JavaScript

#### インデント・スペース
```typescript
// 2スペースインデント
function example() {
  if (condition) {
    doSomething();
  }
}

// オブジェクト
const config = {
  apiUrl: 'https://api.example.com',
  timeout: 10000,
};

// 配列
const items = [
  'item1',
  'item2',
  'item3',
];
```

#### 行長
```typescript
// ✅ 最大100文字（推奨80文字）
const result = someFunction(
  parameter1,
  parameter2,
  parameter3
);

// 長い文字列
const message = 
  'これは長いメッセージです。' +
  '複数行に分割します。';
```

#### セミコロン
```typescript
// ✅ セミコロンを使用
const value = 10;
const result = calculate();

// ❌ セミコロンなし（避ける）
const value = 10
const result = calculate()
```

#### クォート
```typescript
// ✅ シングルクォート（文字列）
const name = 'John Doe';
const message = 'Hello, World!';

// ダブルクォート（JSX属性）
<Button className="primary">Click</Button>
```

#### 改行
```typescript
// 演算子の前で改行
const result = 
  value1
  + value2
  + value3;

// メソッドチェーン
const result = array
  .filter(item => item.active)
  .map(item => item.name)
  .join(', ');
```

### Python

#### インデント
```python
# 4スペースインデント
def example():
    if condition:
        do_something()

# 辞書
config = {
    'api_url': 'https://api.example.com',
    'timeout': 10000,
}

# リスト
items = [
    'item1',
    'item2',
    'item3',
]
```

#### 行長
```python
# 最大79文字（PEP 8）
result = some_function(
    parameter1,
    parameter2,
    parameter3
)

# 長い文字列
message = (
    'これは長いメッセージです。'
    '複数行に分割します。'
)
```

#### クォート
```python
# シングルクォートを推奨
name = 'John Doe'
message = 'Hello, World!'

# ダブルクォート（docstring）
def function():
    """
    関数の説明
    """
    pass
```

#### インポート
```python
# 標準ライブラリ、サードパーティ、ローカルの順
import os
import sys
from datetime import datetime

from django.db import models
from rest_framework import serializers

from .models import Project
from .utils import calculate_total

# 1行に1つのインポート
# ✅
import os
import sys

# ❌
import os, sys
```

## コメント規約

### 基本方針

**重要: このプロジェクトでは、全てのソースコードのコメントは丁寧な日本語で記述します。**

#### コメントの目的
- コードの**意図**と**理由**を説明する
- 複雑なロジックの**理解を助ける**
- 将来の開発者（未来の自分を含む）への**配慮**
- ドメイン知識や業務ルールの**文書化**
- 保守性とチームコラボレーションの**向上**

#### 日本語コメントのベストプラクティス

```typescript
// ✅ 良いコメント例

/**
 * プロジェクトの総予算に対する消費率を計算する
 * 
 * 予算が0円の場合は100%を返す（予算オーバー扱い）
 * これはビジネス要件に基づく仕様。
 */
function calculateBudgetUsage(spent: number, budget: number): number {
  if (budget === 0) {
    return 100; // 予算未設定は常に100%
  }
  return (spent / budget) * 100;
}

// Power Platform環境変数からAPIキーを取得
// 開発環境ではフォールバック値を使用
const apiKey = await getEnvironmentVariable('ApiKey') ?? 'dev-fallback-key';

// Dataverseのページングトークンは次回リクエストまで保持する必要がある
// 参考: https://learn.microsoft.com/ja-jp/power-apps/developer/data-platform/webapi/query-data-web-api
let pagingCookie: string | null = null;

// ❌ 悪いコメント例（避ける）

// iに1を足す
i++;

// ユーザー名を取得
const userName = user.name;

// データを保存
saveData(data);
```

### TypeScript/JavaScript コメント規約

#### 1. ファイルヘッダーコメント

全てのファイルの先頭に目的を記述します。

```typescript
/**
 * プロジェクト管理サービス
 * 
 * Dataverseのプロジェクトテーブル(cr6c8_projects)に対する
 * CRUD操作を提供します。
 * 
 * @module services/projectService
 * @see {@link https://learn.microsoft.com/ja-jp/power-apps/developer/data-platform/webapi/overview}
 */

import { WebApiClient } from '@microsoft/power-apps';
// ...
```

#### 2. 関数・メソッドのJSDoc（日本語）

全ての公開関数には詳細なJSDocコメントを記述します。

```typescript
/**
 * プロジェクトの統計情報を計算する
 * 
 * アクティブ、完了、保留中のプロジェクト数を集計し、
 * 完了率も計算します。
 * 
 * @param projects - 集計対象のプロジェクト配列
 * @returns 統計情報オブジェクト
 * @returns {number} returns.total - 総プロジェクト数
 * @returns {number} returns.active - 進行中のプロジェクト数
 * @returns {number} returns.completed - 完了したプロジェクト数
 * @returns {number} returns.completionRate - 完了率(0-100)
 * 
 * @throws {Error} projectsが空配列の場合
 * 
 * @example
 * ```typescript
 * const projects = await fetchProjects();
 * const stats = calculateProjectStats(projects);
 * console.log(`完了率: ${stats.completionRate}%`);
 * ```
 * 
 * @remarks
 * 完了率は小数点第1位で四捨五入されます。
 */
function calculateProjectStats(projects: Project[]): ProjectStats {
  if (projects.length === 0) {
    throw new Error('プロジェクトが存在しません');
  }

  const completed = projects.filter(p => p.status === 'completed').length;
  
  return {
    total: projects.length,
    active: projects.filter(p => p.status === 'active').length,
    completed,
    // 完了率を計算（小数点第1位で四捨五入）
    completionRate: Math.round((completed / projects.length) * 1000) / 10,
  };
}
```

#### 3. Reactコンポーネントのコメント

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

  return (
    <Card className={cn(isOverdue && 'border-destructive')}>
      {/* カード内容 */}
    </Card>
  );
}
```

#### 4. カスタムフックのコメント

```typescript
/**
 * プロジェクト一覧を取得するカスタムフック
 * 
 * Dataverseからプロジェクトを取得し、TanStack Queryで
 * キャッシュ管理を行います。
 * 
 * @param {Object} [options] - クエリオプション
 * @param {string} [options.filter] - ODataフィルター式
 * @param {string[]} [options.orderBy] - ソート順
 * @param {number} [options.top] - 取得件数の上限
 * 
 * @returns {UseQueryResult<Project[]>} TanStack Queryの結果オブジェクト
 * 
 * @example
 * ```typescript
 * // 進行中のプロジェクトのみ取得
 * const { data, isLoading, error } = useProjects({
 *   filter: "cr6c8_status eq 1",
 *   orderBy: ['cr6c8_name asc']
 * });
 * ```
 * 
 * @remarks
 * - キャッシュの有効期限は5分です
 * - ネットワークエラー時は自動で3回リトライします
 */
export function useProjects(options?: ProjectQueryOptions) {
  return useQuery({
    queryKey: ['dataverse', 'projects', options],
    queryFn: () => fetchProjects(options),
    staleTime: 5 * 60 * 1000, // 5分間は再取得しない
    retry: 3, // 失敗時は最大3回リトライ
  });
}
```

#### 5. インラインコメント（複雑なロジック）

```typescript
async function syncProjectToDataverse(project: Project) {
  try {
    // まずDataverseに存在するか確認
    // retrieveRecordは404エラーをスローするため、try-catchが必要
    const existing = await dataverseClient.retrieveRecord(
      'cr6c8_projects',
      project.id
    );
    
    // 既存レコードが見つかった場合は更新
    // NOTE: Dataverseの楽観的同時実行制御を使用
    await dataverseClient.updateRecord(
      'cr6c8_projects',
      project.id,
      {
        ...mapProjectToDataverse(project),
        // ETaggerヘッダーで競合検出
        '@odata.etag': existing['@odata.etag'],
      }
    );
  } catch (error) {
    // 404エラーの場合は新規作成
    if (isNotFoundError(error)) {
      await dataverseClient.createRecord(
        'cr6c8_projects',
        mapProjectToDataverse(project)
      );
    } else {
      // それ以外のエラーは再スロー
      throw error;
    }
  }
}
```

#### 6. TODO/FIXME/NOTE等のタグ

```typescript
// TODO: [担当者名] ページネーション機能を実装する (期限: 2025-12-01)
// FIXME: [担当者名] 日付フォーマットがタイムゾーンを考慮していない
// HACK: Dataverse APIの制限により、一時的にポーリングで対応
//       将来的にはWebhookに移行する予定
// NOTE: この処理はPower Platformの仕様により必須
// OPTIMIZE: N+1問題が発生している。バッチ取得に変更すべき
// DEPRECATED: この関数は非推奨。代わりに useProjectsV2 を使用してください
// SECURITY: ユーザー入力をサニタイズする必要がある
```

### Python/Django コメント規約

#### 1. モジュールdocstring

```python
"""
プロジェクト管理ビュー

Djangoのプロジェクト関連APIエンドポイントを提供します。
認証されたユーザーのみがアクセスできます。

Author: 開発チーム
Created: 2025-11-14
"""

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
# ...
```

#### 2. クラスのdocstring

```python
class ProjectViewSet(viewsets.ModelViewSet):
    """
    プロジェクトのCRUD操作を提供するViewSet
    
    このViewSetは以下の機能を提供します:
    - プロジェクト一覧取得（フィルタリング、ページネーション対応）
    - プロジェクト詳細取得
    - プロジェクト作成（バリデーション付き）
    - プロジェクト更新（部分更新対応）
    - プロジェクト削除（論理削除）
    
    Attributes:
        queryset (QuerySet): プロジェクトのクエリセット
        serializer_class (Serializer): 使用するシリアライザー
        permission_classes (list): 必要な権限
        filterset_fields (list): フィルター可能なフィールド
    
    Examples:
        >>> # 一覧取得
        >>> GET /api/projects/
        >>> 
        >>> # フィルタリング
        >>> GET /api/projects/?status=active&search=テスト
        >>> 
        >>> # 作成
        >>> POST /api/projects/
        >>> {
        >>>   "name": "新規プロジェクト",
        >>>   "description": "説明",
        >>>   "start_date": "2025-01-01"
        >>> }
    
    Note:
        - 削除は論理削除で、is_deletedフラグを立てるのみ
        - プロジェクトのオーナーのみが編集・削除可能
    """
    
    queryset = Project.objects.filter(is_deleted=False)
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'start_date']
```

#### 3. 関数のdocstring（Google Style）

```python
def calculate_project_completion_rate(project: Project) -> float:
    """
    プロジェクトの完了率を計算する
    
    タスクの完了状況に基づいて、プロジェクト全体の
    完了率をパーセンテージで計算します。
    
    Args:
        project (Project): 完了率を計算するプロジェクト
    
    Returns:
        float: 完了率（0.0 〜 100.0）
            - タスクがない場合は0.0を返す
            - 小数点第1位まで計算
    
    Raises:
        ValueError: projectがNoneの場合
        TypeError: projectがProjectインスタンスでない場合
    
    Examples:
        >>> project = Project.objects.get(id=1)
        >>> rate = calculate_project_completion_rate(project)
        >>> print(f"完了率: {rate}%")
        完了率: 75.5%
    
    Note:
        - 完了率の計算には完了状態のタスクのみを使用
        - キャンセルされたタスクは除外される
    
    See Also:
        - calculate_task_progress: 個別タスクの進捗計算
        - update_project_status: プロジェクトステータスの自動更新
    """
    if project is None:
        raise ValueError("プロジェクトがNullです")
    
    if not isinstance(project, Project):
        raise TypeError("Project型である必要があります")
    
    # プロジェクトに紐づくタスクを取得
    # キャンセルされたタスクは除外
    tasks = project.tasks.exclude(status='cancelled')
    
    if not tasks.exists():
        return 0.0
    
    # 完了したタスク数をカウント
    completed = tasks.filter(status='completed').count()
    
    # 完了率を計算（小数点第1位まで）
    rate = (completed / tasks.count()) * 100
    return round(rate, 1)
```

#### 4. Djangoモデルのdocstring

```python
class Project(models.Model):
    """
    プロジェクトモデル
    
    企業のプロジェクト情報を管理します。
    各プロジェクトは複数のタスク、メンバー、クライアントと
    関連付けることができます。
    
    Attributes:
        name (str): プロジェクト名（最大200文字）
        description (str): プロジェクトの詳細説明
        start_date (date): プロジェクト開始日
        end_date (date): プロジェクト終了日（任意）
        status (str): プロジェクトのステータス
            - 'planning': 計画中
            - 'active': 進行中
            - 'completed': 完了
            - 'on_hold': 保留
        budget (Decimal): 予算（円単位）
        owner (User): プロジェクトオーナー
        members (QuerySet[User]): プロジェクトメンバー
        client (Client): クライアント
        created_at (datetime): 作成日時
        updated_at (datetime): 最終更新日時
        is_deleted (bool): 論理削除フラグ
    
    Meta:
        db_table (str): データベースのテーブル名
        ordering (list): デフォルトの並び順
        verbose_name (str): 管理画面での表示名
        indexes (list): インデックス定義
    
    Examples:
        >>> # プロジェクト作成
        >>> project = Project.objects.create(
        ...     name="新規プロジェクト",
        ...     start_date=date.today(),
        ...     status='planning',
        ...     owner=user
        ... )
        >>> 
        >>> # ステータス変更
        >>> project.activate()
        >>> 
        >>> # 期限切れチェック
        >>> if project.is_overdue:
        ...     send_notification(project.owner)
    
    Note:
        - 削除は論理削除で実装（is_deleted=True）
        - end_dateがNoneの場合、期限なしと判断
        - budgetは必須ではない（予算未定のプロジェクトに対応）
    """
    
    STATUS_CHOICES = [
        ('planning', '計画中'),
        ('active', '進行中'),
        ('completed', '完了'),
        ('on_hold', '保留'),
    ]
    
    name = models.CharField(
        max_length=200,
        verbose_name='プロジェクト名',
        help_text='プロジェクトの識別名（最大200文字）'
    )
    # ... 他のフィールド定義
    
    def activate(self) -> None:
        """
        プロジェクトをアクティブ状態に変更する
        
        プロジェクトのステータスを'active'に変更し、
        関連するメンバーに通知を送信します。
        
        Raises:
            ValidationError: すでにアクティブな場合
            ValidationError: 開始日が未来の場合
        
        Note:
            この操作はトランザクション内で実行されます
        """
        if self.status == 'active':
            raise ValidationError('既にアクティブです')
        
        if self.start_date > date.today():
            raise ValidationError('開始日が未来です')
        
        self.status = 'active'
        self.save()
        
        # メンバーに通知を送信
        self._notify_members('プロジェクトが開始されました')
```

#### 5. インラインコメント

```python
def sync_project_status(project_id: str) -> None:
    """プロジェクトステータスを同期する"""
    
    # トランザクション内で実行し、整合性を保証
    with transaction.atomic():
        # select_for_updateで排他ロックを取得
        # 他のリクエストによる同時更新を防ぐ
        project = Project.objects.select_for_update().get(id=project_id)
        
        # 全タスクが完了している場合、プロジェクトも完了にする
        # NOTE: キャンセルされたタスクは除外して判定
        active_tasks = project.tasks.exclude(status='cancelled')
        if active_tasks.exists():
            completed_tasks = active_tasks.filter(status='completed')
            
            # 完了率が100%になったら自動的に完了状態に遷移
            if completed_tasks.count() == active_tasks.count():
                project.status = 'completed'
                project.save()
                
                # 完了通知をオーナーとメンバーに送信
                notify_project_completion(project)
```

### コメントを書くべき場所

#### ✅ コメントが必須の箇所

1. **全ての公開API（関数・メソッド・コンポーネント）**
2. **複雑なビジネスロジック**
3. **パフォーマンス最適化を行った箇所**
4. **一時的な対処（HACK、FIXME）**
5. **外部APIやライブラリの制限事項への対応**
6. **セキュリティ関連の処理**
7. **Magic Number（定数として抽出できない場合）**

```typescript
// ✅ 必須コメント例

// Power Platform APIの制限により、一度に取得できるのは5000件まで
const MAX_BATCH_SIZE = 5000;

// セキュリティ: XSS攻撃を防ぐため、ユーザー入力をサニタイズ
const sanitized = DOMPurify.sanitize(userInput);

// パフォーマンス: debounceで検索APIの呼び出し頻度を制限
const debouncedSearch = debounce(searchProjects, 300);

// HACK: Dataverse APIのバグ回避のため、一時的にポーリングで対応
// Issue: https://github.com/microsoft/PowerApps-Samples/issues/123
```

#### ❌ コメント不要な箇所

1. **自明なコード**
2. **適切に命名された変数・関数**
3. **型定義で説明できる内容**

```typescript
// ❌ 不要なコメント

// ユーザー名を取得
const userName = user.name;

// 合計を計算
const total = items.reduce((sum, item) => sum + item.price, 0);

// ✅ 良い命名で self-documenting
const totalPrice = calculateTotalPrice(items);
const isEligibleForDiscount = checkDiscountEligibility(user);
```

## 関数・メソッド設計

### 単一責任の原則

```typescript
// ❌ 悪い例: 複数の責任
function processUserData(user: User) {
  // データ検証
  if (!user.email) throw new Error('Invalid email');
  
  // データ変換
  const formatted = formatUser(user);
  
  // API呼び出し
  await apiClient.post('/users', formatted);
  
  // ログ記録
  console.log('User created');
  
  // 通知送信
  sendNotification(user);
}

// ✅ 良い例: 責任を分離
function validateUser(user: User): void {
  if (!user.email) throw new Error('Invalid email');
}

function formatUser(user: User): FormattedUser {
  return {
    // ...
  };
}

async function createUser(user: User): Promise<User> {
  validateUser(user);
  const formatted = formatUser(user);
  const created = await apiClient.post('/users', formatted);
  logUserCreation(created);
  await sendNotification(created);
  return created;
}
```

### 関数の長さ

```typescript
// ✅ 短く、焦点を絞った関数（推奨20行以内）
function calculateDiscount(price: number, discountRate: number): number {
  if (price < 0 || discountRate < 0 || discountRate > 1) {
    throw new Error('Invalid parameters');
  }
  return price * (1 - discountRate);
}

// ❌ 長すぎる関数（リファクタリング推奨）
function processOrder(order: Order) {
  // 50行以上のロジック...
  // 複数の責任を持つ
}
```

### 引数の数

```typescript
// ❌ 引数が多すぎる（3つ以上は避ける）
function createProject(
  name: string,
  description: string,
  startDate: string,
  endDate: string,
  status: string,
  budget: number,
  ownerId: string
) {
  // ...
}

// ✅ オブジェクトにまとめる
interface CreateProjectParams {
  name: string;
  description: string;
  startDate: string;
  endDate?: string;
  status?: string;
  budget?: number;
  ownerId: string;
}

function createProject(params: CreateProjectParams) {
  // ...
}
```

### 純粋関数の推奨

```typescript
// ✅ 純粋関数: 副作用なし、同じ入力で同じ出力
function add(a: number, b: number): number {
  return a + b;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ❌ 副作用あり（グローバル変数の変更）
let total = 0;
function addToTotal(value: number) {
  total += value; // 副作用
}
```

## エラーハンドリング

### TypeScript

```typescript
// ✅ try-catchで適切にハンドリング
async function fetchProject(id: string): Promise<Project> {
  try {
    const response = await apiClient.get<Project>(`/projects/${id}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error(`プロジェクト ${id} が見つかりません`);
      }
      throw new Error(`API Error: ${error.message}`);
    }
    throw error;
  }
}

// カスタムエラークラス
class ProjectNotFoundError extends Error {
  constructor(id: string) {
    super(`プロジェクト ${id} が見つかりません`);
    this.name = 'ProjectNotFoundError';
  }
}

// 使用例
try {
  const project = await fetchProject(id);
} catch (error) {
  if (error instanceof ProjectNotFoundError) {
    // 特定のエラー処理
  } else {
    // 一般的なエラー処理
  }
}
```

### Python

```python
# ✅ 適切な例外処理
def get_project(project_id: str) -> Project:
    """プロジェクトを取得"""
    try:
        return Project.objects.get(id=project_id)
    except Project.DoesNotExist:
        raise ValueError(f'プロジェクト {project_id} が見つかりません')
    except Exception as e:
        logger.error(f'プロジェクト取得エラー: {e}')
        raise

# カスタム例外
class ProjectNotFoundError(Exception):
    """プロジェクトが見つからない場合の例外"""
    
    def __init__(self, project_id: str):
        self.project_id = project_id
        super().__init__(f'プロジェクト {project_id} が見つかりません')

# 使用例
try:
    project = get_project(project_id)
except ProjectNotFoundError as e:
    # 特定のエラー処理
    handle_not_found(e)
except Exception as e:
    # 一般的なエラー処理
    handle_error(e)
```

## TypeScript規約

### 型アノテーション

```typescript
// ✅ 明示的な型アノテーション
function add(a: number, b: number): number {
  return a + b;
}

const user: User = {
  id: '123',
  name: 'John Doe',
};

// 型推論が明確な場合は省略可能
const count = 10; // number型と推論される
const name = 'John'; // string型と推論される

// ❌ any型の使用を避ける
function process(data: any) { // 避ける
  return data.something;
}

// ✅ unknown型を使用し、型ガードで絞り込む
function process(data: unknown) {
  if (typeof data === 'object' && data !== null && 'something' in data) {
    return data.something;
  }
}
```

### Interface vs Type

```typescript
// ✅ Interface: オブジェクト形状の定義
interface User {
  id: string;
  name: string;
  email: string;
}

// 拡張可能
interface Admin extends User {
  permissions: string[];
}

// ✅ Type: ユニオン型、交差型
type Status = 'active' | 'inactive' | 'pending';
type ID = string | number;

// 交差型
type AdminUser = User & {
  permissions: string[];
};
```

### Optional Chaining & Nullish Coalescing

```typescript
// ✅ Optional Chaining
const userName = user?.profile?.name;

// ✅ Nullish Coalescing
const displayName = user?.name ?? 'Guest';

// ❌ 古い書き方
const userName = user && user.profile && user.profile.name;
const displayName = user && user.name ? user.name : 'Guest';
```

## Python規約

### 型ヒント

```python
# ✅ 型ヒントの使用
def add(a: int, b: int) -> int:
    return a + b

def get_user(user_id: str) -> User | None:
    try:
        return User.objects.get(id=user_id)
    except User.DoesNotExist:
        return None

# リスト・辞書の型ヒント
def process_items(items: list[str]) -> dict[str, int]:
    return {item: len(item) for item in items}

# Optional型
from typing import Optional

def find_project(name: str) -> Optional[Project]:
    return Project.objects.filter(name=name).first()
```

### リスト内包表記

```python
# ✅ 読みやすいリスト内包表記
active_projects = [p for p in projects if p.status == 'active']

# ✅ 辞書内包表記
project_names = {p.id: p.name for p in projects}

# ❌ 複雑すぎる内包表記（避ける）
result = [
    item.value
    for sublist in data
    if sublist.active
    for item in sublist.items
    if item.valid
]

# ✅ 通常のforループで書く
result = []
for sublist in data:
    if sublist.active:
        for item in sublist.items:
            if item.valid:
                result.append(item.value)
```

## Git規約

### コミットメッセージ

```
# 形式: <type>: <subject>

# Type:
# feat: 新機能
# fix: バグ修正
# docs: ドキュメント
# style: フォーマット
# refactor: リファクタリング
# test: テスト追加
# chore: ビルド・設定変更

# 例:
feat: プロジェクト一覧ページ実装
fix: ログイン時のトークンリフレッシュエラー修正
docs: API設計ガイドライン更新
refactor: プロジェクトサービス層の整理
test: プロジェクト作成のテスト追加

# 詳細説明が必要な場合
feat: プロジェクトフィルター機能追加

ステータス、日付範囲、キーワードでフィルタリング可能に。
TanStack Queryのクエリキーにフィルター条件を含めることで、
キャッシュを適切に管理。
```

### ブランチ命名

```
# 形式: <type>/<description>

# 例:
feature/project-list
feature/user-authentication
bugfix/token-refresh-error
hotfix/security-vulnerability
refactor/api-client
docs/update-guidelines
```

### プルリクエスト

```markdown
## 変更内容
プロジェクト一覧ページの実装

## 変更理由
ユーザーがプロジェクトを一覧表示できるようにする

## 変更点
- プロジェクト一覧ページコンポーネント追加
- プロジェクトAPIクライアント実装
- フィルター機能実装
- ページネーション対応

## テスト
- [ ] 単体テスト追加
- [ ] 統合テスト実施
- [ ] 手動テスト完了

## スクリーンショット
（必要に応じて）
```

---

**Version**: 1.0.0  
**Last Updated**: 2025年11月14日
