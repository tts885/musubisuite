# OCR管理 - Dataverse連動 実装ガイド

このドキュメントは、OCR管理機能をDataverseと連動させるための実装手順を説明します。

## 📋 完成したファイル

### 1. テーブル設計ファイル
- ✅ `Dataverse_OCR_Tables.csv` - Dataverseテーブル定義
- ✅ `OCR_Dataverse_Tables_Setup_Guide.md` - セットアップガイド

### 2. サービス層
- ✅ `CoreX/src/services/ocrDataverseService.ts` - Dataverse CRUD操作

### 3. フック層
- ✅ `CoreX/src/hooks/useOcrDataverse.ts` - React統合フック

---

## 🚀 実装手順

### Phase 1: Dataverseテーブル作成

#### ステップ1: Power Apps CLI でログイン

```powershell
cd CoreX

# Dataverse環境にログイン
pac auth create

# 環境一覧を確認
pac auth list
```

#### ステップ2: テーブルをデータソースとして追加

```powershell
# メニューセクションテーブル
pac code add-data-source -a dataverse -t cr_ocrmenusections

# フォルダテーブル
pac code add-data-source -a dataverse -t cr_ocrfolders

# ドキュメントテーブル
pac code add-data-source -a dataverse -t cr_ocrdocuments

# OCR処理結果テーブル
pac code add-data-source -a dataverse -t cr_ocrresults

# OCRフィールドテーブル
pac code add-data-source -a dataverse -t cr_ocrfields
```

**生成されるファイル:**
```
CoreX/
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

---

### Phase 2: サービス層の統合

#### ステップ1: 生成されたサービスをインポート

`src/services/ocrDataverseService.ts` のTODOコメント部分を更新:

```typescript
// Before (モック)
async getFolders(menuSectionId?: string): Promise<OcrFolder[]> {
  try {
    // TODO: 生成されたサービスを使用
    console.log('📁 フォルダ取得 (モック):', menuSectionId);
    return mockData;
  }
}

// After (Dataverse)
import { CrOcrfoldersService } from '@/generated/services/CrOcrfoldersService';

async getFolders(menuSectionId?: string): Promise<OcrFolder[]> {
  try {
    const records = await CrOcrfoldersService.getAll();
    
    const filtered = menuSectionId 
      ? records.filter(r => r.cr_menusectionid === menuSectionId)
      : records;
    
    return filtered.map(this.mapFolder);
  } catch (error) {
    console.error('❌ フォルダ取得エラー:', error);
    throw error;
  }
}
```

#### ステップ2: 全メソッドのDataverse統合

`ocrDataverseService.ts` の以下のメソッドを更新:

1. ✅ `getMenuSections()` → `CrOcrmenusectionsService.getAll()`
2. ✅ `createMenuSection()` → `CrOcrmenusectionsService.create()`
3. ✅ `getFolders()` → `CrOcrfoldersService.getAll()`
4. ✅ `createFolder()` → `CrOcrfoldersService.create()`
5. ✅ `updateFolder()` → `CrOcrfoldersService.update()`
6. ✅ `deleteFolder()` → `CrOcrfoldersService.delete()`
7. ✅ `getDocuments()` → `CrOcrdocumentsService.getAll()`
8. ✅ `createDocument()` → `CrOcrdocumentsService.create()`

---

### Phase 3: フロントエンド統合

#### ステップ1: サイドバーでDataverseフックを使用

`src/components/ocr/OcrSidebar.tsx` を更新:

```typescript
// Before (モックデータ)
import { mockOcrFolders } from '@/data/mockOcrData';
const [folders, setFolders] = useState(mockOcrFolders);

// After (Dataverseフック)
import { useOcrFolders } from '@/hooks/useOcrDataverse';

function OcrSidebar() {
  const { 
    folders, 
    loading, 
    createFolder, 
    updateFolder, 
    deleteFolder 
  } = useOcrFolders('all-docs');

  // 既存のロジックをそのまま使用可能
  const handleAddFolder = async (parentId, menuSection) => {
    await createFolder({
      name: newFolderName,
      description: newFolderDescription,
      color: newFolderColor,
      parentId,
      menuSection,
      path: computePath(parentId, newFolderName)
    });
  };

  if (loading) return <div>読み込み中...</div>;
  
  return (
    // 既存のJSX
  );
}
```

#### ステップ2: ドキュメント一覧でDataverseフックを使用

`src/pages/ocr-document-list.tsx` を更新:

```typescript
// Before (モックデータ)
import { mockOcrDocuments } from '@/data/mockOcrData';

// After (Dataverseフック)
import { useOcrDocuments } from '@/hooks/useOcrDataverse';

function OcrDocumentList() {
  const { folderId } = useParams();
  const { documents, loading } = useOcrDocuments(folderId);

  if (loading) return <div>読み込み中...</div>;

  return (
    <div>
      {documents.map(doc => (
        <DocumentCard key={doc.id} document={doc} />
      ))}
    </div>
  );
}
```

#### ステップ3: アップロードページでDataverseフックを使用

`src/pages/ocr-upload.tsx` を更新:

```typescript
import { useOcrDocuments, useOcrFolders } from '@/hooks/useOcrDataverse';

function OcrUpload() {
  const { folders } = useOcrFolders('all-docs');
  const { createDocument } = useOcrDocuments();

  const handleUpload = async (files: File[]) => {
    for (const file of files) {
      // ファイルをアップロード (Azure Blob Storage等)
      const fileUrl = await uploadToStorage(file);
      
      // Dataverseに登録
      await createDocument({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileUrl: fileUrl,
        folderId: selectedFolderId,
        tags: ['アップロード'],
      });
    }
  };

  return (
    // 既存のJSX
  );
}
```

---

### Phase 4: 環境変数設定

#### `.env.local` に追加

```env
# Dataverse設定
VITE_DATAVERSE_ENVIRONMENT_URL=https://your-org.crm.dynamics.com/
VITE_DATAVERSE_CLIENT_ID=your-client-id

# Azure Blob Storage (ファイルアップロード用)
VITE_AZURE_STORAGE_ACCOUNT=your-storage-account
VITE_AZURE_STORAGE_CONTAINER=ocr-documents
```

---

### Phase 5: デフォルトデータ投入

#### デフォルトメニューセクションの作成

```typescript
// scripts/seedOcrData.ts
import { ocrDataverseService } from '@/services/ocrDataverseService';

async function seedDefaultData() {
  // デフォルトメニューセクション作成
  const defaultSection = await ocrDataverseService.createMenuSection({
    cr_name: 'すべてのドキュメント',
    cr_description: 'すべてのOCRドキュメント',
    cr_displayorder: 1,
    cr_isdefault: true,
    cr_color: '#3b82f6',
  });

  console.log('✅ デフォルトメニューセクション作成完了:', defaultSection);

  // サンプルフォルダ作成
  const folder1 = await ocrDataverseService.createFolder({
    name: '請求書',
    description: '取引先からの請求書類',
    color: '#3b82f6',
    menuSection: defaultSection.cr_ocrmenusectionid,
    parentId: null,
    path: '/請求書',
  });

  console.log('✅ サンプルフォルダ作成完了:', folder1);
}

seedDefaultData();
```

実行:
```powershell
npx tsx scripts/seedOcrData.ts
```

---

## 🧪 テスト手順

### 1. メニューセクション取得テスト

```typescript
// src/test/ocrDataverseService.test.ts
import { ocrDataverseService } from '@/services/ocrDataverseService';

test('メニューセクション取得', async () => {
  const sections = await ocrDataverseService.getMenuSections();
  expect(sections.length).toBeGreaterThan(0);
  expect(sections[0].cr_name).toBe('すべてのドキュメント');
});
```

### 2. フォルダCRUDテスト

```typescript
test('フォルダCRUD', async () => {
  // 作成
  const created = await ocrDataverseService.createFolder({
    name: 'テストフォルダ',
    menuSection: 'all-docs',
    parentId: null,
    path: '/テストフォルダ',
  });
  expect(created.name).toBe('テストフォルダ');

  // 更新
  const updated = await ocrDataverseService.updateFolder(created.id, {
    name: '更新済みフォルダ',
  });
  expect(updated.name).toBe('更新済みフォルダ');

  // 削除
  await ocrDataverseService.deleteFolder(created.id);
  const folders = await ocrDataverseService.getFolders();
  expect(folders.find(f => f.id === created.id)).toBeUndefined();
});
```

### 3. ドキュメント作成テスト

```typescript
test('ドキュメント作成', async () => {
  const doc = await ocrDataverseService.createDocument({
    fileName: 'test.pdf',
    fileType: 'application/pdf',
    fileSize: 1024,
    fileUrl: '/uploads/test.pdf',
    folderId: 'folder_1',
  });
  
  expect(doc.fileName).toBe('test.pdf');
  expect(doc.fileType).toBe('application/pdf');
});
```

---

## 📊 実装進捗

| フェーズ | タスク | 状態 |
|---|---|---|
| **Phase 1** | Dataverseテーブル作成 | ⏳ 要実施 |
| | - テーブル設計完了 | ✅ 完了 |
| | - pac code add-data-source 実行 | ⏳ 要実施 |
| **Phase 2** | サービス層統合 | ⏳ 要実施 |
| | - ocrDataverseService実装 | ✅ 完了 |
| | - 生成サービス統合 | ⏳ 要実施 |
| **Phase 3** | フロントエンド統合 | ⏳ 要実施 |
| | - useOcrDataverse実装 | ✅ 完了 |
| | - OcrSidebar統合 | ⏳ 要実施 |
| | - ocr-document-list統合 | ⏳ 要実施 |
| | - ocr-upload統合 | ⏳ 要実施 |
| **Phase 4** | 環境変数設定 | ⏳ 要実施 |
| **Phase 5** | デフォルトデータ投入 | ⏳ 要実施 |
| **Phase 6** | テスト | ⏳ 要実施 |

---

## 🎯 次のステップ

### 1. Dataverseテーブル作成 (優先度: 最高)

```powershell
pac code add-data-source -a dataverse -t cr_ocrmenusections
pac code add-data-source -a dataverse -t cr_ocrfolders
pac code add-data-source -a dataverse -t cr_ocrdocuments
pac code add-data-source -a dataverse -t cr_ocrresults
pac code add-data-source -a dataverse -t cr_ocrfields
```

### 2. 生成されたサービスを統合 (優先度: 高)

`ocrDataverseService.ts` の全TODOコメントを実装

### 3. フロントエンド統合 (優先度: 中)

既存のモック実装をDataverseフックに置き換え

### 4. テスト & デバッグ (優先度: 中)

各機能が正常に動作するか確認

---

## 📚 参考資料

- [Power Apps CLI リファレンス](https://learn.microsoft.com/en-us/power-platform/developer/cli/reference/code)
- [Dataverse Web API](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/overview)
- [Power Apps Code Apps - Dataverse連携](https://learn.microsoft.com/en-us/power-apps/developer/code-apps/how-to/connect-to-dataverse)
