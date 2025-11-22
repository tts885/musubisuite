# OCR管理機能 - Dataverse統合完了

## ✅ 完了した作業

### 1. サービス層の実装 (`ocrDataverseService.ts`)

#### メニューセクションCRUD
- ✅ `getMenuSections()` - メニューセクション一覧取得
- ✅ `createMenuSection()` - メニューセクション作成
- ✅ `updateMenuSection()` - メニューセクション更新
- ✅ `deleteMenuSection()` - メニューセクション削除

#### フォルダCRUD
- ✅ `getFolders()` - フォルダ一覧取得(メニューセクションフィルタ対応)
- ✅ `createFolder()` - フォルダ作成
- ✅ `updateFolder()` - フォルダ更新
- ✅ `deleteFolder()` - フォルダ削除

#### 特徴
- 共通CRUDサービス(`DataverseCrudService`)を使用
- 型安全な実装
- エラーハンドリングとログ出力
- モックデータへのフォールバック機能

---

### 2. Reactフックの実装 (`useOcrDataverse.ts`)

#### useMenuSections
- ✅ メニューセクション取得
- ✅ 作成・更新・削除機能
- ✅ 自動リフレッシュ
- ✅ ローディング・エラー状態管理

#### useOcrFolders
- ✅ フォルダ取得(メニューセクションフィルタ対応)
- ✅ 作成・更新・削除機能
- ✅ 自動リフレッシュ
- ✅ ローディング・エラー状態管理

---

### 3. UIコンポーネントの統合 (`OcrSidebar.tsx`)

#### メニューセクション管理
- ✅ メニュー一覧表示(Dataverseから取得)
- ✅ 新規メニュー追加(Dataverseに保存)
- ✅ メニュー名編集(Dataverseに保存)
- ✅ メニュー削除(配下のフォルダも削除)

#### フォルダ管理
- ✅ フォルダ一覧表示(Dataverseから取得)
- ✅ ルートフォルダ追加
- ✅ サブフォルダ追加(2階層まで)
- ✅ フォルダ編集(名前・説明・カラー)
- ✅ フォルダ削除(配下のサブフォルダも削除)
- ✅ 重複チェック

---

## 🚀 セットアップ手順

### ステップ1: Dataverseテーブルをデータソースとして追加

```powershell
# corexverseディレクトリに移動
cd c:\Deployment\MS365\MSCodeApps\Demo\PowerAppsCodeApps\corexverse

# 各テーブルを追加
pac code add-data-source -a dataverse -t cr_ocrmenusections
pac code add-data-source -a dataverse -t cr_ocrfolders
pac code add-data-source -a dataverse -t cr_ocrdocuments
pac code add-data-source -a dataverse -t cr_ocrresults
pac code add-data-source -a dataverse -t cr_ocrfields
```

詳細は [`OCR_DATAVERSE_SETUP_INSTRUCTIONS.md`](./OCR_DATAVERSE_SETUP_INSTRUCTIONS.md) を参照してください。

---

### ステップ2: デフォルトメニューセクションを作成

Power Apps Portalから手動で作成:

1. [Power Apps Portal](https://make.powerapps.com/) にアクセス
2. 「テーブル」→「cr_ocrmenusections」を開く
3. 「+ 新規」をクリックして以下のレコードを作成:
   - **名前 (cr_name):** すべてのドキュメント
   - **表示順序 (cr_displayorder):** 1
   - **デフォルト (cr_isdefault):** はい
   - **カラー (cr_color):** #3b82f6

---

### ステップ3: アプリケーションを起動

```powershell
pac code run
```

ブラウザで `http://localhost:8080/ocr` にアクセスして動作を確認します。

---

## 🧪 動作確認手順

### 1. メニューセクション管理

#### メニュー追加
1. サイドバー下部の「新しいメニューを追加」をクリック
2. メニュー名を入力(例: "プロジェクト管理")
3. 「追加」をクリック
4. Dataverseに保存されることを確認

#### メニュー編集
1. メニューの右側の「⋮」メニューをクリック
2. 「名前を変更」を選択
3. 新しい名前を入力
4. 「保存」をクリック
5. Dataverseで更新されることを確認

#### メニュー削除
1. メニューの右側の「⋮」メニューをクリック
2. 「削除」を選択
3. 確認ダイアログで「OK」
4. Dataverseから削除されることを確認

---

### 2. フォルダ管理

#### ルートフォルダ追加
1. メニューセクションの右側の「+」ボタンをクリック
2. フォルダ名、説明、カラーを入力
3. 「追加」をクリック
4. Dataverseに保存されることを確認

#### サブフォルダ追加
1. フォルダの右側の「⋮」メニューをクリック
2. 「サブフォルダを追加」を選択
3. フォルダ情報を入力
4. 「追加」をクリック
5. 親フォルダ配下に表示されることを確認

#### フォルダ編集
1. フォルダの右側の「⋮」メニューをクリック
2. 「編集」を選択
3. フォルダ情報を変更
4. 「保存」をクリック
5. Dataverseで更新されることを確認

#### フォルダ削除
1. フォルダの右側の「⋮」メニューをクリック
2. 「削除」を選択
3. 確認ダイアログで「OK」
4. Dataverseから削除されることを確認

---

### 3. 階層制限チェック

#### 2階層制限の確認
1. ルートフォルダ(例: "請求書")を作成
2. サブフォルダ(例: "2024年度")を作成
3. サブフォルダの「⋮」メニューを開く
4. **「サブフォルダを追加」が表示されない**ことを確認
5. アラートメッセージが表示されることを確認

---

### 4. 重複チェック

#### 同一階層での重複チェック
1. ルートフォルダ「テストフォルダ」を作成
2. 同じメニューセクションで再度「テストフォルダ」を作成しようとする
3. **「同じ階層に同じ名前のフォルダが既に存在します」**というアラートが表示されることを確認

---

## 📊 データベース構造

### cr_ocrmenusections (メニューセクション)
```
cr_ocrmenusectionid (主キー)
cr_name (名前)
cr_description (説明)
cr_displayorder (表示順序)
cr_isdefault (デフォルト)
cr_color (カラー)
createdon (作成日時)
modifiedon (更新日時)
```

### cr_ocrfolders (フォルダ)
```
cr_ocrfolderid (主キー)
cr_name (名前)
cr_description (説明)
cr_color (カラー)
cr_parentfolderid (親フォルダID - 自己参照)
cr_menusectionid (メニューセクションID - 外部キー)
cr_path (パス)
cr_documentcount (ドキュメント数)
cr_foldercount (フォルダ数)
cr_createdby (作成者)
createdon (作成日時)
modifiedon (更新日時)
```

---

## 🔧 トラブルシューティング

### エラー: "Table 'cr_ocrmenusections' not found"

**原因:** Dataverseにテーブルが作成されていない、またはデータソースが追加されていない

**解決策:**
1. Power Apps Portalでテーブルの存在を確認
2. `pac code add-data-source` コマンドを実行
3. `src/generated/services/` に生成されたサービスを確認

---

### エラー: メニューやフォルダが表示されない

**原因:** Dataverseにデータが存在しない、または取得エラー

**解決策:**
1. ブラウザの開発者ツールでコンソールログを確認
2. モックデータが返されているか確認(⚠️マーク)
3. デフォルトメニューセクションを手動作成

---

### エラー: 作成・更新・削除が失敗する

**原因:** Dataverseへの権限不足、またはネットワークエラー

**解決策:**
1. Power Apps環境に正しく接続されているか確認
   ```powershell
   pac auth list
   ```
2. ユーザーにテーブルへの適切な権限があるか確認
3. ブラウザの開発者ツールでネットワークエラーを確認

---

## 📚 関連ドキュメント

- [OCR_DATAVERSE_SETUP_INSTRUCTIONS.md](./OCR_DATAVERSE_SETUP_INSTRUCTIONS.md) - セットアップ手順
- [OCR_Dataverse_Tables_Setup_Guide.md](./OCR_Dataverse_Tables_Setup_Guide.md) - テーブル設計ガイド
- [OCR_Dataverse_Implementation_Guide.md](./OCR_Dataverse_Implementation_Guide.md) - 実装ガイド
- [Archi/dataverse-crud-common-service.html](./Archi/dataverse-crud-common-service.html) - 共通CRUDサービス設計

---

## 🎯 次のステップ

### Phase 1: ドキュメント管理の実装
- [ ] ドキュメント一覧表示
- [ ] ドキュメントアップロード(Dataverseに登録)
- [ ] ドキュメント詳細表示
- [ ] ドキュメント削除

### Phase 2: OCR処理結果の統合
- [ ] OCR処理結果の取得
- [ ] フィールド一覧の表示
- [ ] フィールド編集機能

### Phase 3: 検索とフィルタリング
- [ ] フォルダ検索
- [ ] ドキュメント検索
- [ ] タグによるフィルタリング

### Phase 4: パフォーマンス最適化
- [ ] ページネーション実装
- [ ] キャッシュ機能
- [ ] バックグラウンド同期

---

## 📝 実装ファイル一覧

### サービス層
- `src/services/ocrDataverseService.ts` - OCR管理Dataverseサービス
- `src/services/dataverseCrudService.ts` - 共通CRUDサービス

### フック層
- `src/hooks/useOcrDataverse.ts` - OCR管理Reactフック

### コンポーネント層
- `src/components/ocr/OcrSidebar.tsx` - OCRサイドバー

### 型定義
- `src/types/index.ts` - OcrFolder, OcrDocument, OcrResult型

---

**最終更新日:** 2025年11月21日
**ステータス:** ✅ 完了
