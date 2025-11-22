# OCR状態永続化実装完了

## 📋 実装概要

OCRメニュー画面の状態を永続化し、ページリロード(F5)後も状態を保持する機能を実装しました。

## ✅ 完了した作業

### 1. Zustand状態管理ストアの作成

**ファイル**: `corexverse/src/stores/ocrStateStore.ts`

#### 永続化される状態
- **expandedFolders**: 展開されているフォルダ・メニューセクションのIDセット
- **sidebarCollapsed**: サイドバーの折りたたみ状態
- **selectedFolderId**: 最後に選択されたフォルダID

#### ストレージ
- **localStorageキー**: `ocr-state-storage`
- **永続化方法**: Zustand persistミドルウェア
- **Set型の処理**: 配列に変換して保存し、読み込み時にSetに復元

#### 提供される関数
```typescript
- toggleFolder(folderId: string): フォルダの展開/折りたたみ切り替え
- expandFolders(folderIds: string[]): 複数フォルダを一括展開
- resetExpandedFolders(): 展開状態をリセット
- setSidebarCollapsed(collapsed: boolean): サイドバー折りたたみ状態設定
- setSidebarOpen(open: boolean): サイドバー表示状態設定(モバイル用)
- setSelectedFolderId(folderId: string | null): 選択フォルダID設定
- reset(): 全状態をリセット
```

### 2. コンポーネントの更新

#### 2.1 OcrSidebar.tsx
**変更内容**:
- Zustandストアから状態を取得
- localStorageの直接操作を削除
- 選択中のフォルダの親階層を自動展開する機能を追加

**主な機能**:
```typescript
// 選択中のフォルダの親階層を自動展開
useEffect(() => {
  if (selectedFolderId && folders.length > 0) {
    const currentFolder = folders.find(f => f.id === selectedFolderId)
    if (currentFolder) {
      // 親階層のIDを収集
      const parentIds: string[] = []
      let parentId = currentFolder.parentId
      
      while (parentId) {
        parentIds.push(parentId)
        const parentFolder = folders.find(f => f.id === parentId)
        parentId = parentFolder?.parentId || null
      }
      
      // メニューセクションIDも追加
      if (currentFolder.menuSection) {
        parentIds.push(currentFolder.menuSection)
      }
      
      // 親階層を全て展開
      if (parentIds.length > 0) {
        expandFolders(parentIds)
      }
    }
  }
}, [selectedFolderId, folders, expandFolders])
```

#### 2.2 ocr-document-list.tsx
**変更内容**:
- URLパラメータからフォルダIDを取得
- 選択されたフォルダIDをストアに保存
- ページリロード時にURLパラメータを復元

**主な機能**:
```typescript
// URLパラメータが変更されたらフォルダフィルターを更新し、ストアに保存
useEffect(() => {
  if (urlFolderId) {
    setFolderFilter(urlFolderId)
    setSelectedFolderIdInStore(urlFolderId)
  } else {
    setFolderFilter('all')
    setSelectedFolderIdInStore(null)
  }
}, [urlFolderId, setSelectedFolderIdInStore])
```

#### 2.3 ocr-upload.tsx
**変更内容**:
- ストアから最後に選択されたフォルダIDを取得
- URLパラメータを優先し、なければストアの値を使用
- フォルダ選択時にストアに保存

**主な機能**:
```typescript
// URLパラメータからフォルダIDを取得（優先度: URLパラメータ > ストア）
const urlFolderId = searchParams.get('folder')
const initialFolderId = urlFolderId || storedFolderId || ''

// フォルダ選択が変更されたらストアに保存
useEffect(() => {
  if (selectedFolderId) {
    setSelectedFolderIdInStore(selectedFolderId)
  }
}, [selectedFolderId, setSelectedFolderIdInStore])
```

#### 2.4 _layout-ocr.tsx
**変更内容**:
- Zustandストアで状態管理を行うため、ローカルstateとpropsを削除
- シンプルな実装に変更

### 3. 依存関係の追加

**インストール済みパッケージ**:
```json
{
  "zustand": "^5.0.2"
}
```

## 🎯 実装の動作仕様

### 1. メニューセクションの展開状態
- メニューセクションを展開/折りたたむ
- ページリロード(F5)後も展開状態を保持
- デフォルトで「すべてのドキュメント」のみ展開

### 2. フォルダの展開状態
- フォルダを展開/折りたたむ
- ページリロード(F5)後も展開状態を保持
- 新規フォルダ追加時、親フォルダを自動展開

### 3. 選択中のフォルダ
- フォルダを選択すると、その親階層が自動的に展開される
- ページリロード(F5)後も選択状態を保持
- URLパラメータに反映される (`/ocr?folder=xxx`)

### 4. サイドバーの折りたたみ状態
- サイドバーを折りたたむ/展開する
- ページリロード(F5)後も状態を保持
- モバイル表示にも対応

## 🧪 動作確認手順

### テストケース1: メニュー展開状態の保持
1. OCR画面を開く
2. 任意のメニューセクションを展開
3. ページをリロード(F5)
4. **期待結果**: 展開していたメニューが展開されたまま

### テストケース2: フォルダ選択状態の保持
1. OCR画面を開く
2. 任意のフォルダを選択（フォルダツリーを展開して深い階層のフォルダを選択）
3. ページをリロード(F5)
4. **期待結果**: 
   - 選択していたフォルダが選択されたまま
   - 親階層のフォルダ・メニューが全て展開されている
   - URLパラメータに `?folder=xxx` が保持されている

### テストケース3: アップロード画面からの復帰
1. OCR画面でフォルダAを選択
2. 「新規アップロード」をクリック
3. アップロード画面が表示される
4. ブラウザの戻るボタンまたはサイドバーから戻る
5. **期待結果**: フォルダAが選択されたまま、展開状態も保持

### テストケース4: 異なる画面でのリロード
1. プロジェクト管理画面を開く
2. ページをリロード(F5)
3. OCR画面に移動
4. **期待結果**: OCRの展開状態が保持されている

### テストケース5: サイドバー折りたたみ状態の保持
1. サイドバーを折りたたむ（アイコンのみ表示）
2. ページをリロード(F5)
3. **期待結果**: サイドバーが折りたたまれたまま

## 📝 技術詳細

### Zustand persistミドルウェアの設定

```typescript
persist(
  (set) => ({
    // ストアの実装
  }),
  {
    name: 'ocr-state-storage', // localStorageキー
    
    // 永続化する状態の選択
    partialize: (state) => ({
      expandedFolders: Array.from(state.expandedFolders),
      sidebarCollapsed: state.sidebarCollapsed,
      selectedFolderId: state.selectedFolderId,
    }),
    
    // カスタムストレージエンジン（Set型の変換処理）
    storage: {
      getItem: (name) => {
        const str = localStorage.getItem(name)
        if (!str) return null
        
        const { state } = JSON.parse(str)
        
        // expandedFolders配列をSetに変換
        if (state.expandedFolders && Array.isArray(state.expandedFolders)) {
          state.expandedFolders = new Set(state.expandedFolders)
        } else {
          state.expandedFolders = new Set(['all-docs'])
        }
        
        return { state }
      },
      setItem: (name, value) => {
        const str = JSON.stringify(value)
        localStorage.setItem(name, str)
      },
      removeItem: (name) => {
        localStorage.removeItem(name)
      },
    },
  }
)
```

### Set型の永続化処理

**課題**: JavaScriptのSet型はJSON.stringifyで正しくシリアライズされない

**解決策**:
1. 保存時: `Array.from(set)` で配列に変換
2. 読み込み時: `new Set(array)` でSetに復元
3. カスタムstorageエンジンで変換処理を実装

### 親階層の自動展開アルゴリズム

```typescript
// 選択中のフォルダから親を辿って階層を収集
const parentIds: string[] = []
let parentId = currentFolder.parentId

while (parentId) {
  parentIds.push(parentId)
  const parentFolder = folders.find(f => f.id === parentId)
  parentId = parentFolder?.parentId || null
}

// メニューセクションIDも追加
if (currentFolder.menuSection) {
  parentIds.push(currentFolder.menuSection)
}

// 一括で展開
expandFolders(parentIds)
```

## 🔧 開発ガイドライン準拠

### 状態管理 (02_FRONTEND_GUIDELINE.md)
✅ **Zustand (クライアント状態)**
- persistミドルウェアを使用したlocalStorage連携
- 適切な状態の分離（サーバー状態はTanStack Query、クライアント状態はZustand）

### コーディング規約 (06_CODING_STANDARDS.md)
✅ **コメント**: 全て丁寧な日本語で記述
✅ **命名規則**: camelCase、PascalCaseを適切に使用
✅ **関数設計**: 単一責任の原則、適切な関数の長さ
✅ **TypeScript**: 明示的な型定義、型ガードの活用

### ファイル構造
✅ **stores/**: 状態管理ストア用ディレクトリ
✅ **モジュール化**: 各コンポーネントの責任を分離

## 📊 LocalStorage構造

```json
{
  "ocr-state-storage": {
    "state": {
      "expandedFolders": ["all-docs", "menu-1", "folder-1"],
      "sidebarCollapsed": false,
      "selectedFolderId": "folder-1"
    }
  }
}
```

## 🚀 今後の拡張可能性

### 追加可能な永続化状態
1. **検索キーワード**: 一覧画面の検索文字列
2. **フィルター条件**: ステータスフィルター、日付範囲
3. **ソート順**: 並び替え条件
4. **表示設定**: 一覧/グリッド表示切り替え
5. **ページネーション**: 現在のページ番号

### 実装例（検索キーワードの永続化）
```typescript
// ocrStateStore.tsに追加
interface OcrStateStore {
  // 既存の状態
  expandedFolders: Set<string>
  // ...
  
  // 新規追加
  searchKeyword: string
  setSearchKeyword: (keyword: string) => void
}

// 永続化設定に追加
partialize: (state) => ({
  expandedFolders: Array.from(state.expandedFolders),
  sidebarCollapsed: state.sidebarCollapsed,
  selectedFolderId: state.selectedFolderId,
  searchKeyword: state.searchKeyword, // 追加
}),
```

## 🎉 まとめ

- ✅ OCRメニュー画面の状態を完全に永続化
- ✅ ページリロード(F5)後も全ての状態を保持
- ✅ 選択中のフォルダの親階層を自動展開
- ✅ 開発ガイドライン完全準拠
- ✅ 型安全な実装
- ✅ 拡張性の高い設計

---

**実装日**: 2025年11月22日  
**実装者**: GitHub Copilot  
**関連ファイル**:
- `corexverse/src/stores/ocrStateStore.ts` (新規作成)
- `corexverse/src/components/ocr/OcrSidebar.tsx` (更新)
- `corexverse/src/pages/ocr-document-list.tsx` (更新)
- `corexverse/src/pages/ocr-upload.tsx` (更新)
- `corexverse/src/pages/_layout-ocr.tsx` (更新)
