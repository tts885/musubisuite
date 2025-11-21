# OCR管理システム - Dataverse テーブル設定ガイド

このドキュメントは、OCR管理機能をDataverseと連動させるためのテーブル設定手順を説明します。

## 📋 目次

1. [テーブル構成概要](#テーブル構成概要)
2. [テーブル詳細設計](#テーブル詳細設計)
3. [Dataverseへのインポート手順](#dataverseへのインポート手順)
4. [実装手順](#実装手順)

---

## テーブル構成概要

OCR管理システムは以下の5つのテーブルで構成されます:

```
cr_ocrmenusections (メニューセクション)
    ↓ 1:N
cr_ocrfolders (フォルダ) ←┐ 
    ↓ 1:N                 │ 親子関係(自己参照)
    └───────────────────┘
    ↓ 1:N
cr_ocrdocuments (ドキュメント)
    ↓ 1:1
cr_ocrresults (OCR処理結果)
    ↓ 1:N
cr_ocrfields (OCRフィールド)
```

### テーブル一覧

| テーブル論理名 | 表示名 | 説明 | 主キー |
|---|---|---|---|
| `cr_ocrmenusections` | OCRメニューセクション | メニューセクション管理 | `cr_ocrmenusectionid` |
| `cr_ocrfolders` | OCRフォルダ | 階層構造のフォルダ | `cr_ocrfolderid` |
| `cr_ocrdocuments` | OCRドキュメント | アップロードされたファイル | `cr_ocrdocumentid` |
| `cr_ocrresults` | OCR処理結果 | OCR処理結果情報 | `cr_ocrresultid` |
| `cr_ocrfields` | OCRフィールド | 検出されたフィールド | `cr_ocrfieldid` |

---

## テーブル詳細設計

### 1. cr_ocrmenusections (OCRメニューセクション)

**用途:** サイドバーのメニューセクション(「すべてのドキュメント」等)を管理

| カラム名 | 型 | 必須 | 説明 |
|---|---|---|---|
| `cr_ocrmenusectionid` | GUID | ✓ | 主キー |
| `cr_name` | string(100) | ✓ | メニュー名 |
| `cr_description` | string(500) | - | 説明 |
| `cr_displayorder` | integer | ✓ | 表示順序 |
| `cr_isdefault` | boolean | ✓ | デフォルトメニューか |
| `cr_color` | string(20) | - | カラーコード |
| `cr_createdby` | lookup | ✓ | 作成者 |
| `createdon` | datetime | ✓ | 作成日時 |
| `modifiedon` | datetime | ✓ | 更新日時 |

**デフォルトデータ:**
```json
{
  "cr_name": "すべてのドキュメント",
  "cr_displayorder": 1,
  "cr_isdefault": true,
  "cr_color": "#3b82f6"
}
```

---

### 2. cr_ocrfolders (OCRフォルダ)

**用途:** ドキュメントを整理する階層構造のフォルダ(2階層まで)

| カラム名 | 型 | 必須 | 説明 |
|---|---|---|---|
| `cr_ocrfolderid` | GUID | ✓ | 主キー |
| `cr_name` | string(200) | ✓ | フォルダ名 |
| `cr_description` | string(1000) | - | 説明 |
| `cr_color` | string(20) | - | カラーコード |
| `cr_parentfolderid` | lookup | - | 親フォルダID(自己参照) |
| `cr_menusectionid` | lookup | ✓ | メニューセクションID |
| `cr_path` | string(500) | ✓ | フォルダパス |
| `cr_documentcount` | integer | ✓ | ドキュメント数 |
| `cr_foldercount` | integer | ✓ | 子フォルダ数 |
| `cr_createdby` | lookup | ✓ | 作成者 |
| `createdon` | datetime | ✓ | 作成日時 |
| `modifiedon` | datetime | ✓ | 更新日時 |

**階層制限:** 最大2階層まで(親→子)
- `cr_parentfolderid` が `null` → ルートフォルダ
- `cr_parentfolderid` が設定されている → サブフォルダ

**サンプルデータ:**
```json
// ルートフォルダ
{
  "cr_name": "請求書",
  "cr_parentfolderid": null,
  "cr_path": "/請求書",
  "cr_menusectionid": "{menu-section-id}",
  "cr_color": "#3b82f6"
}

// サブフォルダ
{
  "cr_name": "2024年度",
  "cr_parentfolderid": "{parent-folder-id}",
  "cr_path": "/請求書/2024年度",
  "cr_menusectionid": "{menu-section-id}",
  "cr_color": "#3b82f6"
}
```

---

### 3. cr_ocrdocuments (OCRドキュメント)

**用途:** アップロードされたOCR対象ドキュメント

| カラム名 | 型 | 必須 | 説明 |
|---|---|---|---|
| `cr_ocrdocumentid` | GUID | ✓ | 主キー |
| `cr_filename` | string(255) | ✓ | ファイル名 |
| `cr_filetype` | string(100) | ✓ | MIMEタイプ |
| `cr_filesize` | integer | ✓ | ファイルサイズ(byte) |
| `cr_fileurl` | string(2000) | ✓ | ファイルURL |
| `cr_thumbnailurl` | string(2000) | - | サムネイルURL |
| `cr_folderid` | lookup | - | フォルダID |
| `cr_projectid` | lookup | - | プロジェクトID |
| `cr_tags` | string(500) | - | タグ(カンマ区切り) |
| `cr_uploadedby` | lookup | ✓ | アップロード者 |
| `cr_uploadeddate` | datetime | ✓ | アップロード日時 |
| `createdon` | datetime | ✓ | 作成日時 |
| `modifiedon` | datetime | ✓ | 更新日時 |

**対応ファイル形式:**
- `image/png`
- `image/jpeg`
- `application/pdf`

---

### 4. cr_ocrresults (OCR処理結果)

**用途:** OCR処理の結果情報

| カラム名 | 型 | 必須 | 説明 |
|---|---|---|---|
| `cr_ocrresultid` | GUID | ✓ | 主キー |
| `cr_name` | string(100) | ✓ | 結果名 |
| `cr_documentid` | lookup | ✓ | ドキュメントID |
| `cr_status` | picklist | ✓ | 処理ステータス |
| `cr_rawtext` | memo | - | 全文テキスト |
| `cr_overallconfidence` | decimal | ✓ | 全体信頼度(0.0-1.0) |
| `cr_processeddate` | datetime | - | 処理完了日時 |
| `cr_errormessage` | string(1000) | - | エラーメッセージ |
| `createdon` | datetime | ✓ | 作成日時 |
| `modifiedon` | datetime | ✓ | 更新日時 |

**ステータス(cr_status):**
| 値 | ラベル | 説明 |
|---|---|---|
| 1 | pending | 処理待ち |
| 2 | processing | 処理中 |
| 3 | completed | 完了 |
| 4 | failed | 失敗 |

---

### 5. cr_ocrfields (OCRフィールド)

**用途:** OCRで検出された個別フィールド(氏名、金額等)

| カラム名 | 型 | 必須 | 説明 |
|---|---|---|---|
| `cr_ocrfieldid` | GUID | ✓ | 主キー |
| `cr_ocrresultid` | lookup | ✓ | OCR処理結果ID |
| `cr_label` | string(100) | ✓ | フィールド名 |
| `cr_value` | string(2000) | ✓ | 検出値 |
| `cr_confidence` | decimal | ✓ | 信頼度(0.0-1.0) |
| `cr_fieldtype` | picklist | ✓ | フィールドタイプ |
| `cr_boundingbox_x` | integer | ✓ | X座標 |
| `cr_boundingbox_y` | integer | ✓ | Y座標 |
| `cr_boundingbox_width` | integer | ✓ | 幅 |
| `cr_boundingbox_height` | integer | ✓ | 高さ |
| `cr_isedited` | boolean | ✓ | 編集済みか |
| `createdon` | datetime | ✓ | 作成日時 |
| `modifiedon` | datetime | ✓ | 更新日時 |

**フィールドタイプ(cr_fieldtype):**
| 値 | ラベル | 説明 |
|---|---|---|
| 1 | text | テキスト |
| 2 | number | 数値 |
| 3 | date | 日付 |
| 4 | datetime | 日時 |
| 5 | email | メールアドレス |
| 6 | phone | 電話番号 |
| 7 | address | 住所 |

---

## Dataverseへのインポート手順

### 方法1: Power Apps CLI を使用

```powershell
# 1. Power Apps CLI でログイン
pac auth create

# 2. データソースとして追加
pac code add-data-source -a dataverse -t cr_ocrmenusections
pac code add-data-source -a dataverse -t cr_ocrfolders
pac code add-data-source -a dataverse -t cr_ocrdocuments
pac code add-data-source -a dataverse -t cr_ocrresults
pac code add-data-source -a dataverse -t cr_ocrfields

# 3. スキーマファイルが生成される
# .power/schemas/dataverse/*.Schema.json
```

### 方法2: Power Apps ポータルから手動作成

1. **Power Apps ポータルにアクセス**
   - https://make.powerapps.com にアクセス
   - 環境を選択

2. **テーブルを作成**
   - 「テーブル」→「新しいテーブル」→「空のテーブル」
   - 上記の設計に従ってカラムを追加

3. **リレーションシップを設定**
   - 「リレーションシップ」タブでルックアップ列を設定

### 方法3: Solution Package (推奨)

```powershell
# 1. ソリューションを作成
pac solution init --publisher-name "YourCompany" --publisher-prefix "cr"

# 2. テーブルをソリューションに追加
pac solution add-reference --path ".power/schemas"

# 3. ソリューションをDataverseにデプロイ
pac solution import --path "OcrManagementSolution.zip"
```

---

## 実装手順

### ステップ1: Dataverseテーブル作成

```powershell
cd musubisuite

# 環境URLを設定
$env:DATAVERSE_ENVIRONMENT_URL = "https://your-org.crm.dynamics.com/"

# テーブルを追加
pac code add-data-source -a dataverse -t cr_ocrmenusections
pac code add-data-source -a dataverse -t cr_ocrfolders
pac code add-data-source -a dataverse -t cr_ocrdocuments
pac code add-data-source -a dataverse -t cr_ocrresults
pac code add-data-source -a dataverse -t cr_ocrfields
```

**生成されるファイル:**
```
musubisuite/
├── .power/
│   └── schemas/
│       └── dataverse/
│           ├── cr_ocrmenusections.Schema.json
│           ├── cr_ocrfolders.Schema.json
│           ├── cr_ocrdocuments.Schema.json
│           ├── cr_ocrresults.Schema.json
│           └── cr_ocrfields.Schema.json
└── src/
    └── generated/
        ├── models/
        │   ├── CrOcrmenusection.ts
        │   ├── CrOcrfolder.ts
        │   ├── CrOcrdocument.ts
        │   ├── CrOcrresult.ts
        │   └── CrOcrfield.ts
        └── services/
            ├── CrOcrmenusectionsService.ts
            ├── CrOcrfoldersService.ts
            ├── CrOcrdocumentsService.ts
            ├── CrOcrresultsService.ts
            └── CrOcrfieldsService.ts
```

### ステップ2: サービス層の実装

`src/services/ocrDataverseService.ts` を作成:

```typescript
import { CrOcrmenusectionsService } from '@/generated/services/CrOcrmenusectionsService';
import { CrOcrfoldersService } from '@/generated/services/CrOcrfoldersService';
import { CrOcrdocumentsService } from '@/generated/services/CrOcrdocumentsService';
import type { OcrFolder, OcrDocument, OcrResult } from '@/types';

export class OcrDataverseService {
  // メニューセクション取得
  async getMenuSections() {
    const records = await CrOcrmenusectionsService.getAll();
    return records.map(this.mapMenuSection);
  }

  // フォルダ取得
  async getFolders(menuSectionId: string) {
    const records = await CrOcrfoldersService.getAll();
    return records
      .filter(r => r.cr_menusectionid === menuSectionId)
      .map(this.mapFolder);
  }

  // フォルダ追加
  async createFolder(folder: Partial<OcrFolder>) {
    const record = {
      cr_name: folder.name,
      cr_description: folder.description,
      cr_color: folder.color,
      cr_parentfolderid: folder.parentId,
      cr_menusectionid: folder.menuSection,
      cr_path: folder.path,
      cr_documentcount: 0,
      cr_foldercount: 0,
    };
    
    const created = await CrOcrfoldersService.create(record);
    return this.mapFolder(created);
  }

  // ドキュメント取得
  async getDocuments(folderId?: string) {
    const records = await CrOcrdocumentsService.getAll();
    
    if (folderId) {
      return records
        .filter(r => r.cr_folderid === folderId)
        .map(this.mapDocument);
    }
    
    return records.map(this.mapDocument);
  }

  // マッピング関数
  private mapFolder(record: any): OcrFolder {
    return {
      id: record.cr_ocrfolderid,
      name: record.cr_name,
      description: record.cr_description,
      color: record.cr_color,
      parentId: record.cr_parentfolderid,
      menuSection: record.cr_menusectionid,
      path: record.cr_path,
      documentCount: record.cr_documentcount,
      folderCount: record.cr_foldercount,
      createdAt: new Date(record.createdon),
      updatedAt: new Date(record.modifiedon),
      createdBy: record.cr_createdby,
    };
  }

  private mapDocument(record: any): OcrDocument {
    // マッピング実装
  }
}
```

### ステップ3: フロントエンド統合

既存のモック実装をDataverseサービスに置き換え:

```typescript
// Before (モック)
import { mockOcrFolders } from '@/data/mockOcrData';

// After (Dataverse)
import { OcrDataverseService } from '@/services/ocrDataverseService';

const ocrService = new OcrDataverseService();
const folders = await ocrService.getFolders(menuSectionId);
```

### ステップ4: 環境変数設定

`.env.local` に追加:

```env
VITE_DATAVERSE_ENVIRONMENT_URL=https://your-org.crm.dynamics.com/
VITE_DATAVERSE_CLIENT_ID=your-client-id
```

---

## 次のステップ

1. ✅ **テーブル設計完了** (このドキュメント)
2. ⏳ **Dataverseテーブル作成** (`pac code add-data-source`)
3. ⏳ **サービス実装** (`ocrDataverseService.ts`)
4. ⏳ **フロントエンド統合** (モック → Dataverse)
5. ⏳ **テスト & デプロイ**

---

## 参考リンク

- [Power Apps Code Apps - Dataverse連携](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/how-to/connect-to-dataverse)
- [Dataverse Web API リファレンス](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/overview)
- [Power Apps CLI リファレンス](https://learn.microsoft.com/en-us/power-platform/developer/cli/reference/code)
