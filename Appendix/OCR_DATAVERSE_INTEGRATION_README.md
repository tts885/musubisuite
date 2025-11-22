# OCR管理機能 - Dataverse連動実装ガイド

## 概要

このドキュメントは、OCR管理機能をDataverseと連動させるための実装ガイドです。

## テーブル設計

### 作成済みファイル

**`Dataverse_OCR_Tables.xlsx`** - テーブル設計ドキュメント

**注意:** このExcelファイルは**設計ドキュメント**です。Dataverseに直接インポートすることはできません。
テーブル作成には、[手動作成ガイド](./Dataverse_OCR_Setup_Guide.md)または[CLIデプロイガイド](./Dataverse_CLI_Deployment_Guide.md)を参照してください。

このExcelファイルには以下の8つのシートが含まれています:

#### テーブル定義シート (5つ)

#### 1. OCRメニューセクション (cr_ocrmenusections)

メニューセクション(例: すべてのドキュメント)を管理するテーブルです。

| 列名 | データ型 | 必須 | 説明 |
|------|---------|------|------|
| cr_ocrmenusectionid | GUID | はい | 主キー |
| cr_name | nvarchar(100) | はい | メニューセクション名 |
| cr_description | nvarchar(500) | | 説明 |
| cr_displayorder | int | はい | 表示順序 |
| cr_isdefault | bit | はい | デフォルトメニュー |
| cr_color | nvarchar(20) | | カラーコード |
| createdon | datetime | はい | 作成日時(システム) |
| modifiedon | datetime | はい | 更新日時(システム) |

#### 2. OCRフォルダ (cr_ocrfolders)

フォルダ階層を管理するテーブルです。

| 列名 | データ型 | 必須 | 説明 |
|------|---------|------|------|
| cr_ocrfolderid | GUID | はい | 主キー |
| cr_name | nvarchar(200) | はい | フォルダ名 |
| cr_description | nvarchar(1000) | | フォルダ説明 |
| cr_color | nvarchar(20) | | フォルダ色 |
| cr_parentfolderid | Lookup | | 親フォルダID (自己参照) |
| cr_menusectionid | Lookup | はい | メニューセクションID |
| cr_path | nvarchar(500) | はい | フォルダパス |
| cr_documentcount | int | はい | ドキュメント数 |
| cr_foldercount | int | はい | 子フォルダ数 |
| createdon | datetime | はい | 作成日時(システム) |
| modifiedon | datetime | はい | 更新日時(システム) |

#### 3. OCRドキュメント (cr_ocrdocuments)

アップロードされたドキュメントを管理するテーブルです。

| 列名 | データ型 | 必須 | 説明 |
|------|---------|------|------|
| cr_ocrdocumentid | GUID | はい | 主キー |
| cr_filename | nvarchar(255) | はい | ファイル名 |
| cr_filetype | nvarchar(100) | はい | ファイル形式 |
| cr_filesize | int | はい | ファイルサイズ(バイト) |
| cr_fileurl | nvarchar(2000) | はい | ファイルURL |
| cr_thumbnailurl | nvarchar(2000) | | サムネイルURL |
| cr_folderid | Lookup | | フォルダID |
| cr_projectid | Lookup | | プロジェクトID |
| cr_tags | nvarchar(500) | | タグ(カンマ区切り) |
| cr_uploadedby | Lookup | はい | アップロード者 |
| cr_uploadeddate | datetime | はい | アップロード日時 |
| createdon | datetime | はい | 作成日時(システム) |
| modifiedon | datetime | はい | 更新日時(システム) |

#### 4. OCR処理結果 (cr_ocrresults)

OCR処理の結果情報を管理するテーブルです。

| 列名 | データ型 | 必須 | 説明 |
|------|---------|------|------|
| cr_ocrresultid | GUID | はい | 主キー |
| cr_name | nvarchar(100) | はい | 結果名 |
| cr_documentid | Lookup | はい | ドキュメントID (1:1) |
| cr_status | Picklist | はい | 処理ステータス |
| cr_rawtext | ntext | | 全文テキスト |
| cr_overallconfidence | decimal | はい | 全体信頼度(0.0-1.0) |
| cr_processeddate | datetime | | 処理完了日時 |
| cr_errormessage | nvarchar(1000) | | エラーメッセージ |
| createdon | datetime | はい | 作成日時(システム) |
| modifiedon | datetime | はい | 更新日時(システム) |

#### 5. OCRフィールド (cr_ocrfields)

OCRで検出された個別フィールドを管理するテーブルです。

| 列名 | データ型 | 必須 | 説明 |
|------|---------|------|------|
| cr_ocrfieldid | GUID | はい | 主キー |
| cr_label | nvarchar(100) | はい | フィールド名 |
| cr_ocrresultid | Lookup | はい | OCR処理結果ID |
| cr_value | nvarchar(2000) | はい | 値 |
| cr_confidence | decimal | はい | 信頼度 |
| cr_fieldtype | Picklist | はい | フィールドタイプ |
| cr_boundingbox_x | int | はい | X座標 |
| cr_boundingbox_y | int | はい | Y座標 |
| cr_boundingbox_width | int | はい | 幅 |
| cr_boundingbox_height | int | はい | 高さ |
| cr_isedited | bit | はい | 編集済み |
| createdon | datetime | はい | 作成日時(システム) |
| modifiedon | datetime | はい | 更新日時(システム) |

#### 補助シート (3つ)

#### 6. リレーションシップ

5つのテーブル間のリレーションシップ定義。

| # | 関係名 | 元テーブル | 先テーブル | タイプ |
|---|--------|-----------|-----------|--------|
| 1 | cr_ocrmenusection_ocrfolders | OCRメニューセクション | OCRフォルダ | 1:N |
| 2 | cr_ocrfolder_parentfolder | OCRフォルダ | OCRフォルダ | 1:N (自己参照) |
| 3 | cr_ocrfolder_ocrdocuments | OCRフォルダ | OCRドキュメント | 1:N |
| 4 | cr_ocrdocument_ocrresult | OCRドキュメント | OCR処理結果 | 1:1 |
| 5 | cr_ocrresult_ocrfields | OCR処理結果 | OCRフィールド | 1:N |

#### 7. ステータス選択肢 (cr_status)

OCR処理結果のステータス値定義。

| 値 | ラベル | 説明 |
|----|-------|------|
| 1 | 処理待ち | OCR処理開始前 |
| 2 | 処理中 | OCR処理実行中 |
| 3 | 完了 | OCR処理完了 |
| 4 | 失敗 | OCR処理失敗 |

#### 8. フィールドタイプ選択肢 (cr_fieldtype)

OCRフィールドのタイプ値定義。

| 値 | ラベル | 説明 |
|----|-------|------|
| 1 | テキスト | 通常のテキスト |
| 2 | 数値 | 数値データ |
| 3 | 日付 | 日付データ |
| 4 | 日時 | 日時データ |
| 5 | メールアドレス | メールアドレス |
| 6 | 電話番号 | 電話番号 |
| 7 | 住所 | 住所データ |

## Dataverseセットアップ手順

**重要:** Dataverseにテーブルをデプロイするには、2つの方法があります。

### 方法1: 手動作成 (初心者向け)

Power Apps Maker Portalを使用したGUIベースのセットアップ手順です。

📖 **詳細ガイド:** [`Dataverse_OCR_Setup_Guide.md`](./Dataverse_OCR_Setup_Guide.md)

**手順概要:**
1. [Power Apps Maker Portal](https://make.powerapps.com)にアクセス
2. 各テーブルを手動で作成 (5テーブル)
3. 列を追加 (合計57列)
4. Lookupリレーションシップを設定 (5つの関係)
5. 選択肢(Picklist)を設定 (ステータス、フィールドタイプ)
6. サンプルデータを投入

**メリット:**
- GUI操作のみで完結
- 各ステップを理解しながら進められる
- トラブルシューティングが容易

**所要時間:** 約60分

---

### 方法2: Power Platform CLI (上級者向け)

コマンドラインを使用した自動化デプロイ手順です。

📖 **詳細ガイド:** [`Dataverse_CLI_Deployment_Guide.md`](./Dataverse_CLI_Deployment_Guide.md)

**手順概要:**
1. Power Platform CLI (`pac`) をインストール
2. Dataverse環境に認証
3. ソリューションファイルをパッケージ化
4. `pac solution import` でデプロイ

**メリット:**
- 高速デプロイ (約5分)
- 繰り返し可能で自動化可能
- CI/CDパイプラインへの統合が容易
- バージョン管理が可能

**所要時間:** 約10分 (CLI設定済みの場合は5分)

---

### 方法の選択ガイド

| 条件 | 推奨方法 |
|------|----------|
| 初めてDataverseを使用する | 方法1: 手動作成 |
| 本番環境への定期デプロイが必要 | 方法2: CLI |
| チーム開発で統一されたデプロイが必要 | 方法2: CLI |
| 学習目的で各ステップを理解したい | 方法1: 手動作成 |
| 複数環境(開発/ステージング/本番)がある | 方法2: CLI |

---

### 共通: セキュリティロールの設定

テーブル作成後、セキュリティロールを設定してください。

1. [Power Apps管理センター](https://admin.powerplatform.microsoft.com)にアクセス
2. 対象環境を選択
3. 「設定」→「ユーザー + 権限」→「セキュリティロール」
4. 対象ロールに以下の権限を付与:

| テーブル | 作成 | 読み取り | 書き込み | 削除 |
|---------|------|---------|---------|------|
| OCRメニューセクション | ✓ | ✓ | ✓ | ✓ |
| OCRフォルダ | ✓ | ✓ | ✓ | ✓ |
| OCRドキュメント | ✓ | ✓ | ✓ | ✓ |
| OCR処理結果 | ✓ | ✓ | ✓ | ✓ |
| OCRフィールド | ✓ | ✓ | ✓ | ✓ |

## フロントエンド実装

### アーキテクチャ

```
src/
├── hooks/
│   └── useOcrDataverse.ts          # Dataverse連携Reactフック
├── services/
│   └── ocrDataverseService.ts      # Dataverse API通信サービス
├── components/
│   └── ocr/
│       ├── OcrSidebar.tsx           # サイドバー(Dataverse連動対応)
│       ├── OcrDocumentList.tsx      # ドキュメント一覧
│       └── OcrUpload.tsx            # アップロード
└── types/
    └── index.ts                     # 型定義
```

### 環境変数設定

`.env`ファイルに以下を追加:

```env
# Dataverse環境URL
VITE_DATAVERSE_URL=https://your-org.crm7.dynamics.com

# Power Apps認証
VITE_POWER_APPS_CLIENT_ID=your-client-id
```

### 実装済みフック

#### 1. useMenuSections

メニューセクションの取得・操作を行うフックです。

```typescript
import { useMenuSections } from '@/hooks/useOcrDataverse';

function MyComponent() {
  const { 
    sections,      // メニューセクション配列
    loading,       // ローディング状態
    error,         // エラー
    refresh,       // 再取得
    createSection  // セクション作成
  } = useMenuSections();
  
  return (
    <div>
      {sections.map(section => (
        <div key={section.cr_ocrmenusectionid}>
          {section.cr_name}
        </div>
      ))}
    </div>
  );
}
```

#### 2. useOcrFolders

フォルダの取得・CRUD操作を行うフックです。

```typescript
import { useOcrFolders } from '@/hooks/useOcrDataverse';

function MyComponent() {
  const { 
    folders,       // フォルダ配列
    loading,       // ローディング状態
    error,         // エラー
    refresh,       // 再取得
    createFolder,  // フォルダ作成
    updateFolder,  // フォルダ更新
    deleteFolder   // フォルダ削除
  } = useOcrFolders('menu-section-id');
  
  const handleAdd = async () => {
    await createFolder({
      name: '請求書',
      menuSection: 'all-docs',
      parentId: null,
      color: 'blue'
    });
  };
  
  return <div>...</div>;
}
```

#### 3. useOcrDocuments

ドキュメントの取得・操作を行うフックです。

```typescript
import { useOcrDocuments } from '@/hooks/useOcrDataverse';

function MyComponent() {
  const { 
    documents,      // ドキュメント配列
    loading,        // ローディング状態
    error,          // エラー
    refresh,        // 再取得
    createDocument  // ドキュメント作成
  } = useOcrDocuments(folderId);
  
  return <div>...</div>;
}
```

### サービス層

`ocrDataverseService.ts`は、Dataverse Web APIとの通信を担当します。

**主な機能:**
- メニューセクションのCRUD
- フォルダのCRUD
- ドキュメントのCRUD
- Dataverseレコード型とアプリ型の変換
- 開発環境用モックデータ

**使用例:**

```typescript
import { ocrDataverseService } from '@/services/ocrDataverseService';

// フォルダ取得
const folders = await ocrDataverseService.getFolders('menu-section-id');

// フォルダ作成
const newFolder = await ocrDataverseService.createFolder({
  name: '請求書',
  menuSection: 'all-docs'
});
```

## コンポーネント更新手順

### OcrSidebar.tsx の更新

既存のモックデータベースの実装をDataverse連動に置き換えます。

#### 変更前:

```typescript
const [folders, setFolders] = useState<OcrFolder[]>(mockOcrFolders)
```

#### 変更後:

```typescript
const { folders, createFolder, updateFolder, deleteFolder } = useOcrFolders()
```

### 主な変更点

1. **State管理をフックに移行**
   - `useState`から`useOcrFolders`へ
   - `setFolders`を使わず、`createFolder`等のメソッドを使用

2. **非同期処理への対応**
   - CRUD操作を`async/await`で実装
   - ローディング状態の表示

3. **エラーハンドリング**
   - try-catchでエラーを捕捉
   - ユーザーへのエラーメッセージ表示

## テスト

### 開発環境でのテスト

開発環境では、Dataverse接続なしでモックデータが返されます。

```typescript
// ocrDataverseService.ts
if (import.meta.env.DEV) {
  console.warn('開発環境: モックデータを使用します');
  return this.getMockData(entitySet);
}
```

### 本番環境テスト

1. `.env`にDataverse URLを設定
2. Power Apps認証を設定
3. テーブルが正しく作成されていることを確認
4. アプリを起動してCRUD操作をテスト

## トラブルシューティング

### CORS エラー

**問題:** Dataverse APIへのアクセスでCORSエラーが発生

**解決策:**
1. Power Appsポータルで「設定」→「CORS」を開く
2. アプリのURLをCORS許可リストに追加

### 認証エラー

**問題:** 401 Unauthorized

**解決策:**
1. Azure ADでアプリ登録を確認
2. クライアントIDが正しいか確認
3. 必要なAPI権限が付与されているか確認

### データが表示されない

**問題:** API呼び出しは成功するがデータが表示されない

**解決策:**
1. ブラウザコンソールでレスポンスを確認
2. 型変換が正しく行われているか確認
3. フィルタ条件が正しいか確認

## 次のステップ

### Phase 1: 設計とデプロイガイド ✅完了

- [x] テーブル設計Excelファイル作成 (8シート、5テーブル)
- [x] 手動作成ガイド作成 ([`Dataverse_OCR_Setup_Guide.md`](./Dataverse_OCR_Setup_Guide.md))
- [x] CLIデプロイガイド作成 ([`Dataverse_CLI_Deployment_Guide.md`](./Dataverse_CLI_Deployment_Guide.md))
- [x] フック実装(`useOcrDataverse.ts`)
- [x] サービス層実装(既存の`ocrDataverseService.ts`を活用)

### Phase 2: コンポーネント更新 (進行中)

- [ ] OcrSidebar.tsxのDataverse連動
- [ ] OcrDocumentList.tsxのDataverse連動
- [ ] OcrUpload.tsxのDataverse連動

### Phase 3: 統合テスト

- [ ] フォルダCRUD操作のテスト
- [ ] メニューセクション管理のテスト
- [ ] ドキュメントアップロードのテスト
- [ ] 階層制限のテスト
- [ ] 重複チェックのテスト

### Phase 4: パフォーマンス最適化

- [ ] キャッシング戦略の実装
- [ ] ページネーション実装
- [ ] 遅延ローディングの実装

## 参考資料

### Dataverseドキュメント
- [Dataverse Web API リファレンス](https://learn.microsoft.com/ja-jp/power-apps/developer/data-platform/webapi/overview)
- [Dataverse テーブルの作成](https://learn.microsoft.com/ja-jp/power-apps/maker/data-platform/data-platform-create-entity)
- [列の追加と編集](https://learn.microsoft.com/ja-jp/power-apps/maker/data-platform/create-edit-field-portal)
- [リレーションシップの作成](https://learn.microsoft.com/ja-jp/power-apps/maker/data-platform/data-platform-entity-lookup)

### Power Platform CLI
- [Power Platform CLI ドキュメント](https://learn.microsoft.com/ja-jp/power-platform/developer/cli/introduction)
- [Power Apps ALM ガイド](https://learn.microsoft.com/ja-jp/power-platform/alm/)
- [ソリューションの概念](https://learn.microsoft.com/ja-jp/power-platform/alm/solution-concepts-alm)

### 開発リソース
- [Power Apps Component Framework](https://learn.microsoft.com/ja-jp/power-apps/developer/component-framework/overview)
- [React Query (推奨キャッシング)](https://tanstack.com/query/latest)
- [Power Apps Maker Portal](https://make.powerapps.com)

## 更新履歴

- 2025-01-18: Version 2.0
  - 5テーブル設計に拡張 (OCR処理結果、OCRフィールド追加)
  - 列名プレフィックスを`cr_`に統一
  - 手動作成ガイド追加 ([`Dataverse_OCR_Setup_Guide.md`](./Dataverse_OCR_Setup_Guide.md))
  - CLIデプロイガイド追加 ([`Dataverse_CLI_Deployment_Guide.md`](./Dataverse_CLI_Deployment_Guide.md))
  - Excel設計ドキュメントを8シートに拡張
  
- 2025-01-18: Version 1.0 (初版)
  - 3テーブル設計 (メニューセクション、フォルダ、ドキュメント)
  - フック・サービス層実装完了
  - README作成
