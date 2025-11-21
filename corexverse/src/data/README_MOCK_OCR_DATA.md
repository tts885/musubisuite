# OCR機能 モックデータ

OCR機能のテストと開発に使用するモックデータです。

## 📊 データ構造

### タスク一覧 (6件)

| タスクID | タスク名 | ステータス | ドキュメント数 | 作成日時 |
|---------|---------|-----------|--------------|---------|
| task_1 | 2024年1月 請求書バッチ | 完了 | 1/1 | 2024-01-15 10:20 |
| task_2 | 納品書・見積書 一括処理 | 完了 | 2/2 | 2024-01-15 10:50 |
| task_3 | 週次請求書処理_2024/01/16 | 処理中 | 1/5 | 2024-01-16 09:00 |
| task_4 | 2024年12月分 請求書 | 待機中 | 0/3 | 2024-01-16 14:00 |
| task_5 | 経費精算書_スキャンエラー対応 | 失敗 | 0/2 | 2024-01-15 15:00 |
| task_6 | 契約書類_2024年度 | キャンセル | 1/4 | 2024-01-14 10:00 |

### ドキュメント (4件)

1. **請求書_2024_001.pdf**
   - サイズ: 245,678 bytes
   - 状態: OCR完了
   - 信頼度: 96%
   - フィールド数: 10

2. **納品書_2024_045.pdf**
   - サイズ: 198,432 bytes
   - 状態: OCR完了
   - 信頼度: 94%
   - フィールド数: 6

3. **見積書_2024_128.pdf**
   - サイズ: 212,345 bytes
   - 状態: OCR完了
   - 信頼度: 95%
   - フィールド数: 5

4. **請求書_2024_002.pdf**
   - サイズ: 256,789 bytes
   - 状態: 処理待ち
   - OCR結果: なし

## 📝 OCRフィールド例

### 請求書フィールド (10項目)

| フィールド | 値 | 信頼度 | タイプ |
|-----------|-----|--------|--------|
| 請求書番号 | INV-2024-001 | 98% | text |
| 発行日 | 2024年1月15日 | 95% | date |
| 請求先会社名 | 株式会社サンプル商事 | 97% | text |
| 郵便番号 | 100-0001 | 92% | text |
| 住所 | 東京都千代田区千代田1-1-1 | 94% | text |
| 電話番号 | 03-1234-5678 | 96% | text |
| 小計 | ¥850,000 | 99% | number |
| 消費税(10%) | ¥85,000 | 98% | number |
| 合計金額 | ¥935,000 | 99% | number |
| 支払期限 | 2024年2月15日 | 93% | date |

### 納品書フィールド (6項目)

- 納品書番号: DEL-2024-045
- 納品日: 2024年1月10日
- 納品先: 株式会社テクノロジー
- 商品名: ノートパソコン ThinkPad X1
- 数量: 5台
- 備考: 初期設定済み、保証書同梱

### 見積書フィールド (5項目)

- 見積書番号: QUO-2024-128
- 見積日: 2024年1月5日
- 有効期限: 2024年2月5日
- 件名: システム開発業務委託
- 見積金額: ¥3,500,000

## 📊 統計情報

```typescript
{
  total: 6,        // 全タスク数
  pending: 1,      // 待機中
  processing: 1,   // 処理中
  completed: 2,    // 完了
  failed: 1,       // 失敗
  cancelled: 1,    // キャンセル
}
```

## 🎯 使用方法

### タスク一覧ページ

```typescript
import { mockOcrTasks } from '@/data/mockOcrData'

// 全タスクを表示
const tasks = mockOcrTasks

// ステータスでフィルター
import { getTasksByStatus } from '@/data/mockOcrData'
const completedTasks = getTasksByStatus('completed')

// 検索
import { searchTasks } from '@/data/mockOcrData'
const searchResults = searchTasks('請求書')
```

### タスク詳細ページ

```typescript
import { getTaskById } from '@/data/mockOcrData'

// タスクIDから取得
const task = getTaskById('task_1')

// ドキュメントとOCR結果にアクセス
if (task) {
  const documents = task.documents
  const firstDoc = documents[0]
  const ocrResult = firstDoc.ocrResult
  const fields = ocrResult?.fields
}
```

### 統計情報

```typescript
import { getTaskStatsByStatus } from '@/data/mockOcrData'

const stats = getTaskStatsByStatus()
console.log(`完了: ${stats.completed}件`)
console.log(`処理中: ${stats.processing}件`)
```

## 🔧 カスタマイズ

モックデータをカスタマイズする場合は、以下のファイルを編集してください:

- `src/data/mockOcrData.ts` - すべてのモックデータ

### 新しいタスクを追加

```typescript
export const mockOcrTasks: OcrTask[] = [
  // 既存のタスク...
  {
    id: 'task_7',
    name: '新しいタスク',
    status: 'pending',
    documents: [],
    totalDocuments: 1,
    processedDocuments: 0,
    failedDocuments: 0,
    createdBy: 'user_001',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]
```

## 🖼️ ダミー画像

実際の帳票画像をテストする場合は、以下のようなダミー画像を使用してください:

- プレースホルダー: `https://placehold.co/800x1100/png?text=Invoice`
- ダミーPDF: Public Domainの請求書テンプレート

## 📌 注意事項

- このモックデータはフロントエンド開発とテスト専用です
- 本番環境では実際のAPIエンドポイントを使用してください
- バウンディングボックスの座標は800x1100pxの画像を基準としています
- 信頼度は0.0〜1.0の範囲で設定されています

## 🚀 Backend統合

Backend実装後の移行手順:

1. `ocrService.ts`のTODOコメントを解除
2. API呼び出しを有効化
3. モックデータのインポートを削除
4. 実際のAPIレスポンスを使用

```typescript
// Before (Mock)
const tasks = mockOcrTasks

// After (API)
const { data: tasks } = await ocrService.listTasks()
```
