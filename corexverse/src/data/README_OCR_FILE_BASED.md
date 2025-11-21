# OCR機能 - ファイル単位管理

## 📋 概要

OCR機能はファイル単位でドキュメントを管理し、一覧表示・検索・編集を行います。

## 🎯 主な機能

### 1. ドキュメント一覧 (`/ocr`)
- **テーブル形式**でファイル単位の一覧表示
- **検索機能**: ファイル名・タグで検索
- **フィルター機能**: ステータス別(完了/処理待ち/処理中/失敗)
- **ページネーション**: 20件/ページ
- **表示項目**:
  - ファイル名
  - ステータスバッジ
  - 信頼度(%)
  - ファイルサイズ
  - アップロード日時
  - タグ

### 2. 新規アップロード (`/ocr/upload`)
- 複数ファイル一括アップロード(最大10ファイル)
- ドラッグ&ドロップ対応
- サポートファイル形式: PDF, JPEG, PNG
- 最大ファイルサイズ: 10MB/ファイル

### 3. ドキュメント詳細・編集 (`/ocr/documents/:documentId`)
- **左側**: ドキュメントプレビュー
  - 画像表示
  - バウンディングボックス表示
  - ズーム・回転機能
- **右側**: フィールドエディター
  - OCR抽出フィールド一覧
  - インライン編集
  - 信頼度表示
- **機能**:
  - 変更保存
  - 再処理
  - 未保存警告

## 🗂️ ファイル構成

```
src/
├── data/
│   ├── mockOcrData.ts           # モックデータ(10ドキュメント)
│   └── testimages/              # テスト画像(8ファイル)
│       ├── 請求書サンプル１.png
│       ├── 請求書サンプル２.png
│       ├── 請求書サンプル３.png
│       ├── 請求書サンプル４.png
│       ├── 請求書サンプル５.png
│       ├── 請求書サンプル６.png
│       ├── 1010_サンプル請求書３.jpg
│       └── 1011_サンプル請求書２.png
│
├── pages/
│   ├── ocr-document-list.tsx    # ドキュメント一覧
│   ├── ocr-upload.tsx           # アップロード
│   ├── ocr-document-detail.tsx  # 詳細・編集
│   └── _layout-ocr.tsx          # OCRレイアウト
│
├── components/ocr/
│   ├── OcrSidebar.tsx           # サイドバー(簡素化)
│   ├── OcrFileUpload.tsx        # ファイルアップロード
│   ├── OcrDocumentPreview.tsx   # ドキュメントプレビュー
│   └── OcrResultEditor.tsx      # 結果エディター
│
└── types/index.ts               # 型定義
    ├── OcrDocument              # ドキュメント型
    ├── OcrResult                # OCR結果型
    └── OcrField                 # フィールド型
```

## 📊 データ構造

### OcrDocument (ファイル単位)
```typescript
{
  id: string                    // ドキュメントID
  fileName: string              // ファイル名
  fileType: string              // MIMEタイプ
  fileSize: number              // バイト数
  fileUrl: string               // ファイルURL
  ocrResult: OcrResult | null   // OCR結果
  uploadedBy: string            // アップロード者
  uploadedAt: Date              // アップロード日時
  updatedAt: Date               // 更新日時
  tags: string[]                // タグ配列
}
```

### OcrResult
```typescript
{
  id: string
  documentId: string
  fileName: string
  fields: OcrField[]            // 抽出フィールド配列
  status: 'completed' | 'processing' | 'failed'
  overallConfidence: number     // 全体信頼度(0-1)
  processedAt: Date
}
```

### OcrField
```typescript
{
  id: string
  label: string                 // フィールド名
  value: string                 // 抽出値
  confidence: number            // 信頼度(0-1)
  boundingBox: BoundingBox      // 座標
  type: 'text' | 'date' | 'number'
  isEdited: boolean             // 編集済みフラグ
}
```

## 🚀 ルーティング

| パス | コンポーネント | 説明 |
|------|--------------|------|
| `/ocr` | OcrDocumentListPage | ドキュメント一覧 |
| `/ocr/upload` | OcrUploadPage | 新規アップロード |
| `/ocr/documents/:documentId` | OcrDocumentDetailPage | 詳細・編集 |

## 🎨 UI特徴

### サイドバー (簡素化)
- ドキュメント一覧へのリンク
- 新規アップロードボタン
- 統計情報カード
  - 全ドキュメント数
  - 完了数
  - 処理待ち数

**削除された要素**:
- ステータス別フィルターメニュー → 一覧画面の検索/フィルターに統合

### 一覧画面
- **検索バー**: リアルタイム検索
- **ステータスフィルター**: ドロップダウン選択
- **テーブル表示**: 情報を一目で把握
- **ページネーション**: 大量データ対応

## 🧪 テストデータ

### mockOcrDocuments (10件)
- **完了**: 8件
  - ローカル画像参照(src/data/testimages/)
  - 信頼度: 92-97%
  - 各種請求書サンプル
- **処理待ち**: 2件
  - 請求書_2024_005.pdf
  - 見積書_2024_128.pdf

### ヘルパー関数
```typescript
// 検索
searchDocuments(keyword: string): OcrDocument[]

// ID検索
getDocumentById(docId: string): OcrDocument | undefined

// 統計
getDocumentStats(): { total, completed, pending, processing, failed }

// フィルター
filterDocumentsByStatus(status): OcrDocument[]
filterDocumentsByTag(tag): OcrDocument[]
```

## 🔄 変更点まとめ

### Before (タスクベース)
- OcrTask(バッチ単位) → 複数ドキュメント含む
- カード形式の一覧
- サイドバーにステータスメニュー
- タスク詳細でドキュメント切り替え

### After (ファイルベース) ✅
- OcrDocument(ファイル単位) → 1ファイル = 1エントリ
- テーブル形式の一覧
- サイドバーは簡素化
- 一覧画面に検索/フィルター統合
- ドキュメント直接編集

## 📝 次のステップ

### Backend実装 (Step 2)
1. Django REST API
   ```python
   # models.py
   class OcrDocument(models.Model):
       file = models.FileField()
       file_name = models.CharField()
       ocr_result = models.JSONField(null=True)
       ...
   ```

2. APIエンドポイント
   - `GET /api/ocr/documents/` - 一覧取得
   - `POST /api/ocr/documents/` - アップロード
   - `GET /api/ocr/documents/:id/` - 詳細取得
   - `PATCH /api/ocr/documents/:id/` - 更新
   - `POST /api/ocr/documents/:id/reprocess/` - 再処理

3. Azure AI Document Intelligence統合
   - ファイルアップロード → Azure Storage
   - OCR処理開始 → Document Intelligence API
   - 結果保存 → DB

### 追加機能
- [ ] バッチ操作(複数選択 → 削除/再処理)
- [ ] エクスポート機能(CSV/Excel)
- [ ] タグ管理機能
- [ ] 高度な検索(日付範囲、信頼度範囲)
- [ ] 処理履歴表示

## 🐛 トラブルシューティング

### エラー: モジュールが見つからない
```bash
# キャッシュクリア
npm run dev -- --force
```

### 画像が表示されない
- `src/data/testimages/` にファイルが存在するか確認
- ファイル名が日本語の場合、エンコーディング確認

### TypeScriptエラー
```bash
# 型チェック
npx tsc --noEmit
```
