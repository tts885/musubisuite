# コードマスタ統合ガイドライン

## 概要

このドキュメントでは、アプリケーション全体でコードマスタを統合し、動的なドロップダウン選択肢を実現するための設計と実装方法を説明します。

## 目次

1. [アーキテクチャ概要](#アーキテクチャ概要)
2. [コードマスタサービス](#コードマスタサービス)
3. [実装パターン](#実装パターン)
4. [クライアント管理での実装例](#クライアント管理での実装例)
5. [ベストプラクティス](#ベストプラクティス)
6. [バックエンドデータ管理](#バックエンドデータ管理)

---

## アーキテクチャ概要

### 設計原則

1. **単一データソース**: コードマスタが全てのドロップダウン選択肢の唯一の情報源
2. **キャッシング**: API呼び出しを最小化するための自動キャッシュ機構
3. **型安全性**: TypeScriptによる完全な型定義
4. **再利用性**: 共通サービスパターンによる簡単な統合

### システム構成

```
Frontend (React + TypeScript)
├── services/
│   └── codemaster.ts          # コードマスタサービス (共通処理)
├── pages/
│   └── settings/
│       ├── clients.tsx         # クライアント管理 (実装例)
│       └── codemasters.tsx     # コードマスタ管理
└── components/
    └── shared/
        └── CodeMasterSelect.tsx # 共通コンポーネント (今後実装)

Backend (Django + DRF)
├── masters/
│   ├── models.py               # CodeCategory, CodeMaster
│   ├── views.py                # API エンドポイント
│   ├── serializers.py          # シリアライザ
│   └── management/
│       └── commands/
│           └── create_industry_master.py  # 初期データ作成
```

---

## コードマスタサービス

### サービス仕様

**ファイル**: `musubisuite/src/services/codemaster.ts`

#### 主要機能

1. **自動キャッシング**: 5分間のTTLで自動的にデータをキャッシュ
2. **カテゴリ管理**: カテゴリ一覧、詳細取得
3. **コード取得**: 単一/複数カテゴリのコード取得
4. **CRUD操作**: コード・カテゴリの作成、更新、削除
5. **並び替え**: ドラッグ&ドロップによる並び順変更

#### 型定義

```typescript
export interface CodeMaster {
  id: number;
  category: string;           // カテゴリコード
  code: string;               // コード値
  name: string;               // 表示名 (日本語)
  name_en: string;            // 英語名
  description: string;        // 説明
  sort_order: number;         // 並び順
  is_active: boolean;         // 有効フラグ
  color?: string;             // 色 (オプション)
  icon?: string;              // アイコン (オプション)
  parent_code?: string;       // 親コード (階層構造用)
  metadata?: Record<string, any>; // メタデータ
  created_at: string;
  updated_at: string;
}

export interface CodeCategory {
  code: string;               // カテゴリコード
  name: string;               // カテゴリ名
  description: string;        // 説明
  is_system: boolean;         // システムカテゴリフラグ
  sort_order: number;         // 並び順
  is_active: boolean;         // 有効フラグ
  codes_count: number;        // 所属コード数
}
```

#### 主要メソッド

```typescript
// カテゴリコードから所属コードを取得 (最頻出)
async getCodesByCategory(categoryCode: string): Promise<CodeMaster[]>

// 複数カテゴリのコードを一括取得
async getBulkCodes(categories: string[]): Promise<Record<string, CodeMaster[]>>

// カテゴリ一覧取得
async getCategories(): Promise<CodeCategory[]>

// カテゴリ詳細取得 (コード含む)
async getCategoryWithCodes(categoryCode: string): Promise<CodeCategoryWithCodes>

// キャッシュクリア
clearCache(): void
clearCacheFor(key: string): void
```

---

## 実装パターン

### パターン1: 基本実装 (推奨)

単一カテゴリのコードを取得してドロップダウンに表示する標準パターン。

```typescript
import { codeMasterService, type CodeMaster } from "@/services/codemaster"

export default function MyComponent() {
  // 1. 状態管理
  const [codes, setCodes] = useState<CodeMaster[]>([])
  const [selectedValue, setSelectedValue] = useState<string>("")

  // 2. データ取得
  useEffect(() => {
    fetchCodes()
  }, [])

  const fetchCodes = async () => {
    try {
      const data = await codeMasterService.getCodesByCategory('industry')
      setCodes(data.filter(item => item.is_active))
    } catch (error) {
      console.error("コードマスタ取得エラー:", error)
      setCodes([]) // エラー時は空配列
    }
  }

  // 3. ラベル取得ヘルパー
  const getLabel = (code: string) => {
    const item = codes.find(c => c.code === code)
    return item ? item.name : code
  }

  // 4. UIレンダリング
  return (
    <Select 
      value={selectedValue} 
      onValueChange={setSelectedValue}
      disabled={codes.length === 0}
    >
      <SelectTrigger>
        <SelectValue 
          placeholder={codes.length === 0 
            ? "データがありません" 
            : "選択してください"
          } 
        />
      </SelectTrigger>
      <SelectContent>
        {codes.map((item) => (
          <SelectItem key={item.code} value={item.code}>
            {item.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
```

### パターン2: 複数カテゴリ一括取得

複数のドロップダウンで異なるカテゴリを使用する場合。

```typescript
const [masterData, setMasterData] = useState<Record<string, CodeMaster[]>>({})

useEffect(() => {
  fetchAllCodes()
}, [])

const fetchAllCodes = async () => {
  try {
    const data = await codeMasterService.getBulkCodes([
      'industry',
      'project_status',
      'priority'
    ])
    setMasterData(data)
  } catch (error) {
    console.error("コードマスタ一括取得エラー:", error)
  }
}

// 使用例
<Select>
  {masterData['industry']?.map(item => (
    <SelectItem key={item.code} value={item.code}>
      {item.name}
    </SelectItem>
  ))}
</Select>
```

### パターン3: アイコン・カラー付き

視覚的な要素を含むドロップダウン。

```typescript
<Select>
  {codes.map((item) => (
    <SelectItem key={item.code} value={item.code}>
      <div className="flex items-center gap-2">
        {item.icon && <span>{item.icon}</span>}
        <span 
          className="w-3 h-3 rounded-full" 
          style={{ backgroundColor: item.color }}
        />
        <span>{item.name}</span>
      </div>
    </SelectItem>
  ))}
</Select>
```

---

## クライアント管理での実装例

### 実装内容

クライアント管理画面 (`musubisuite/src/pages/settings/clients.tsx`) で業種ドロップダウンをコードマスタと統合しました。

#### 実装手順

**1. インポート追加**

```typescript
import { codeMasterService, type CodeMaster } from "@/services/codemaster"
```

**2. 状態管理追加**

```typescript
const [industries, setIndustries] = useState<CodeMaster[]>([])
```

**3. データ取得処理**

```typescript
useEffect(() => {
  fetchClients()
  fetchIndustries()
}, [])

const fetchIndustries = async () => {
  try {
    const data = await codeMasterService.getCodesByCategory('industry')
    console.log("業種マスタデータ:", data)
    setIndustries(data.filter(item => item.is_active))
  } catch (error) {
    console.error("業種マスタ取得エラー:", error)
    setIndustries([])
  }
}
```

**4. ラベル取得関数を動的化**

```typescript
// 変更前: ハードコード
const getIndustryLabel = (industry: string) => {
  const industryMap: Record<string, string> = {
    it: "IT・通信",
    manufacturing: "製造",
    // ... ハードコードされた値
  }
  return industryMap[industry] || "その他"
}

// 変更後: コードマスタから動的取得
const getIndustryLabel = (industryCode: string) => {
  const industry = industries.find(item => item.code === industryCode)
  return industry ? industry.name : industryCode
}
```

**5. ドロップダウンを動的化**

```typescript
// 新規登録ダイアログ
<Select 
  value={formData.industry || ''} 
  onValueChange={(value) => setFormData(prev => ({...prev, industry: value}))}
  disabled={industries.length === 0}
>
  <SelectTrigger>
    <SelectValue 
      placeholder={industries.length === 0 
        ? "業種マスタデータがありません" 
        : "選択してください"
      } 
    />
  </SelectTrigger>
  <SelectContent>
    {industries.map((industry) => (
      <SelectItem key={industry.code} value={industry.code}>
        {industry.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>

// 編集ダイアログ (同様の実装)

// フィルタドロップダウン
<Select value={industryFilter} onValueChange={setIndustryFilter}>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="業種フィルター" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">すべての業種</SelectItem>
    {industries.map((industry) => (
      <SelectItem key={industry.code} value={industry.code}>
        {industry.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

#### 変更前後の比較

| 項目 | 変更前 | 変更後 |
|------|--------|--------|
| データソース | ハードコード (12個の選択肢) | コードマスタAPI |
| 管理方法 | コード変更が必要 | 管理画面から追加/編集/削除 |
| 拡張性 | 低い (開発者のみ) | 高い (管理者が自由に管理) |
| 一貫性 | 画面ごとに異なる可能性 | システム全体で統一 |
| 多言語対応 | 困難 | name_en フィールドで対応可能 |

---

## ベストプラクティス

### 1. エラーハンドリング

```typescript
const fetchCodes = async () => {
  try {
    const data = await codeMasterService.getCodesByCategory('category_code')
    setCodes(data.filter(item => item.is_active))
  } catch (error) {
    console.error("コードマスタ取得エラー:", error)
    // エラー時は空配列を設定し、UIを無効化
    setCodes([])
    // 必要に応じてトースト通知
    // toast.error("データの取得に失敗しました")
  }
}
```

### 2. 空データ対応

```typescript
// Select コンポーネントを無効化
<Select disabled={codes.length === 0}>
  <SelectTrigger>
    <SelectValue 
      placeholder={codes.length === 0 
        ? "データがありません" 
        : "選択してください"
      } 
    />
  </SelectTrigger>
  <SelectContent>
    {codes.map((item) => (
      <SelectItem key={item.code} value={item.code}>
        {item.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

### 3. アクティブフラグフィルタリング

```typescript
// 常に is_active = true のみを表示
const data = await codeMasterService.getCodesByCategory('category_code')
setCodes(data.filter(item => item.is_active))
```

### 4. キャッシュ管理

```typescript
// データ更新後はキャッシュをクリア
const handleCreate = async () => {
  await createSomething()
  codeMasterService.clearCacheFor('codes:category_code')
  await fetchCodes() // 再取得
}
```

### 5. ローディング状態

```typescript
const [loading, setLoading] = useState(false)

const fetchCodes = async () => {
  try {
    setLoading(true)
    const data = await codeMasterService.getCodesByCategory('category_code')
    setCodes(data.filter(item => item.is_active))
  } catch (error) {
    console.error(error)
  } finally {
    setLoading(false)
  }
}

// UI
{loading ? <Spinner /> : <Select>...</Select>}
```

### 6. デバッグログ

```typescript
const fetchCodes = async () => {
  try {
    const data = await codeMasterService.getCodesByCategory('category_code')
    console.log(`[CodeMaster] ${category_code}:`, data) // デバッグ用
    setCodes(data.filter(item => item.is_active))
  } catch (error) {
    console.error(`[CodeMaster Error] ${category_code}:`, error)
  }
}
```

---

## バックエンドデータ管理

### データベーススキーマ

#### CodeCategory テーブル

| カラム | 型 | 説明 |
|--------|-----|------|
| code | VARCHAR(50) PK | カテゴリコード (例: 'industry') |
| name | VARCHAR(100) | カテゴリ名 (例: '業種') |
| description | TEXT | 説明 |
| is_system | BOOLEAN | システムカテゴリフラグ |
| sort_order | INTEGER | 表示順 |
| is_active | BOOLEAN | 有効フラグ |

#### CodeMaster テーブル

| カラム | 型 | 説明 |
|--------|-----|------|
| id | INTEGER PK | 主キー |
| category_id | VARCHAR(50) FK | カテゴリコード |
| code | VARCHAR(50) | コード値 (例: 'it') |
| name | VARCHAR(100) | 表示名 (例: 'IT・通信') |
| name_en | VARCHAR(100) | 英語名 |
| description | TEXT | 説明 |
| sort_order | INTEGER | 表示順 |
| is_active | BOOLEAN | 有効フラグ |
| color | VARCHAR(20) | カラーコード (オプション) |
| icon | VARCHAR(50) | アイコン名 (オプション) |
| parent_code | VARCHAR(50) | 親コード (階層構造用) |
| metadata | JSONB | メタデータ |
| created_at | TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | 更新日時 |

### 初期データ作成

#### 管理コマンド作成

**ファイル**: `musubisuite_back/masters/management/commands/create_industry_master.py`

```python
from django.core.management.base import BaseCommand
from masters.models import CodeCategory, CodeMaster


class Command(BaseCommand):
    help = '業種マスタデータを作成します'

    def handle(self, *args, **options):
        # カテゴリ作成
        category, created = CodeCategory.objects.get_or_create(
            code='industry',
            defaults={
                'name': '業種',
                'description': 'クライアントの業種分類',
                'is_system': False,
                'sort_order': 10,
                'is_active': True,
            }
        )
        
        # コード作成
        industries = [
            {'code': 'it', 'name': 'IT・通信', 'name_en': 'IT & Telecommunications', 'sort_order': 0},
            {'code': 'manufacturing', 'name': '製造', 'name_en': 'Manufacturing', 'sort_order': 10},
            {'code': 'finance', 'name': '金融', 'name_en': 'Finance', 'sort_order': 20},
            # ... 他の業種
        ]

        for industry_data in industries:
            CodeMaster.objects.get_or_create(
                category=category,
                code=industry_data['code'],
                defaults={
                    'name': industry_data['name'],
                    'name_en': industry_data['name_en'],
                    'sort_order': industry_data['sort_order'],
                    'is_active': True,
                }
            )
```

#### 実行方法

```bash
# Pythonターミナルで実行
cd musubisuite_back
python manage.py create_industry_master
```

### API エンドポイント

#### カテゴリのコード一覧取得

```
GET /api/codemasters/by_category/?category=industry
```

**レスポンス例**:
```json
[
  {
    "id": 1,
    "category": "industry",
    "code": "it",
    "name": "IT・通信",
    "name_en": "IT & Telecommunications",
    "description": "IT・通信業",
    "sort_order": 0,
    "is_active": true,
    "color": null,
    "icon": null,
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  }
]
```

#### 複数カテゴリ一括取得

```
GET /api/codemasters/bulk/?categories=industry,project_status,priority
```

**レスポンス例**:
```json
{
  "industry": [...],
  "project_status": [...],
  "priority": [...]
}
```

---

## 今後の拡張

### 共通コンポーネント化

再利用性を高めるため、共通コンポーネントを作成予定。

```typescript
// musubisuite/src/components/shared/CodeMasterSelect.tsx
interface CodeMasterSelectProps {
  category: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function CodeMasterSelect({ 
  category, 
  value, 
  onChange,
  placeholder = "選択してください",
  disabled = false
}: CodeMasterSelectProps) {
  const [codes, setCodes] = useState<CodeMaster[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchCodes()
  }, [category])

  const fetchCodes = async () => {
    try {
      setLoading(true)
      const data = await codeMasterService.getCodesByCategory(category)
      setCodes(data.filter(item => item.is_active))
    } catch (error) {
      console.error(`[CodeMasterSelect] ${category}:`, error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || loading}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {codes.map((item) => (
          <SelectItem key={item.code} value={item.code}>
            {item.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// 使用例
<CodeMasterSelect
  category="industry"
  value={formData.industry}
  onChange={(value) => setFormData(prev => ({...prev, industry: value}))}
/>
```

### カスタムフック化

```typescript
// musubisuite/src/hooks/use-code-master.ts
export function useCodeMaster(category: string) {
  const [codes, setCodes] = useState<CodeMaster[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetchCodes()
  }, [category])

  const fetchCodes = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await codeMasterService.getCodesByCategory(category)
      setCodes(data.filter(item => item.is_active))
    } catch (err) {
      setError(err as Error)
      setCodes([])
    } finally {
      setLoading(false)
    }
  }

  const getLabel = useCallback((code: string) => {
    const item = codes.find(c => c.code === code)
    return item ? item.name : code
  }, [codes])

  return { codes, loading, error, getLabel, refetch: fetchCodes }
}

// 使用例
const { codes: industries, loading, getLabel } = useCodeMaster('industry')
```

---

## まとめ

### 実装済み機能

- ✅ コードマスタサービス (`codemaster.ts`)
- ✅ 自動キャッシング機構
- ✅ クライアント管理での業種統合
- ✅ バックエンド初期データ作成コマンド
- ✅ エラーハンドリングと空データ対応

### 利点

1. **運用性向上**: 管理画面からデータを追加・編集可能
2. **一貫性**: システム全体で統一されたマスタデータ
3. **拡張性**: 新しいカテゴリを簡単に追加可能
4. **パフォーマンス**: キャッシング機構による高速化
5. **保守性**: 共通処理により重複コード削減

### 適用推奨箇所

以下の画面でも同様のパターンで統合可能:

- プロジェクト管理: ステータス、優先度、種別
- タスク管理: ステータス、優先度、タイプ
- メンバー管理: 役割、部署
- 活動記録: 活動タイプ、カテゴリ

---

## 関連ドキュメント

- [02_FRONTEND_GUIDELINE.md](./02_FRONTEND_GUIDELINE.md) - フロントエンド開発ガイドライン
- [03_BACKEND_GUIDELINE.md](./03_BACKEND_GUIDELINE.md) - バックエンド開発ガイドライン
- [04_API_DESIGN.md](./04_API_DESIGN.md) - API設計ガイドライン
- [06_CODING_STANDARDS.md](./06_CODING_STANDARDS.md) - コーディング規約

---

**最終更新**: 2025年11月17日  
**バージョン**: 1.0.0  
**作成者**: Development Team
