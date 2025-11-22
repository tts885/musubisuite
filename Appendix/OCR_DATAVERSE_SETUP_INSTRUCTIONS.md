# OCR管理機能 - Dataverse統合セットアップ手順

このドキュメントは、OCR管理機能をDataverseと統合するための手順を説明します。

## 📋 前提条件

1. ✅ DataverseにOCRテーブルが作成済み
   - `cr_ocrmenusections` (OCRメニューセクション)
   - `cr_ocrfolders` (OCRフォルダ)
   - `cr_ocrdocuments` (OCRドキュメント)
   - `cr_ocrresults` (OCR処理結果)
   - `cr_ocrfields` (OCRフィールド)

2. Power Apps CLI (`pac`) がインストール済み
3. Dataverse環境に接続済み

---

## 🚀 セットアップ手順

### ステップ1: Dataverseテーブルをデータソースとして追加

Power Apps Code Appsプロジェクトに、OCR管理用のDataverseテーブルをデータソースとして追加します。

#### ターミナルで以下のコマンドを実行:

```powershell
# corexverseディレクトリに移動
cd c:\Deployment\MS365\MSCodeApps\Demo\PowerAppsCodeApps\corexverse

# メニューセクションテーブルを追加
pac code add-data-source -a dataverse -t cr_ocrmenusections

# フォルダテーブルを追加
pac code add-data-source -a dataverse -t cr_ocrfolders

# ドキュメントテーブルを追加
pac code add-data-source -a dataverse -t cr_ocrdocuments

# OCR処理結果テーブルを追加
pac code add-data-source -a dataverse -t cr_ocrresults

# OCRフィールドテーブルを追加
pac code add-data-source -a dataverse -t cr_ocrfields
```

#### 生成されるファイル:

```
corexverse/
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

### ステップ2: サービス実装の更新

データソース追加後、`ocrDataverseService.ts`の実装を更新して、生成されたサービスを使用するようにします。

この作業は自動的に行われます(次のステップで実装します)。

---

### ステップ3: デフォルトデータの投入

初回セットアップ時に、デフォルトのメニューセクション「すべてのドキュメント」を作成します。

**方法1: Power Apps Portalから手動作成**

1. [Power Apps Portal](https://make.powerapps.com/) にアクセス
2. 「テーブル」→「cr_ocrmenusections」を開く
3. 「+ 新規」をクリックして以下のレコードを作成:
   - **名前 (cr_name):** すべてのドキュメント
   - **表示順序 (cr_displayorder):** 1
   - **デフォルト (cr_isdefault):** はい
   - **カラー (cr_color):** #3b82f6

**方法2: コマンドラインから作成 (今後実装予定)**

```typescript
// デフォルトデータ投入スクリプト(今後実装)
npm run seed:ocr
```

---

## ✅ セットアップ確認

以下の確認を行ってください:

### 1. スキーマファイルが生成されているか確認

```powershell
# corexverseディレクトリで実行
ls .power/schemas/dataverse/
```

期待される出力:
```
cr_ocrmenusections.Schema.json
cr_ocrfolders.Schema.json
cr_ocrdocuments.Schema.json
cr_ocrresults.Schema.json
cr_ocrfields.Schema.json
```

### 2. 生成されたモデルとサービスを確認

```powershell
# モデル確認
ls src/generated/models/CrOcr*.ts

# サービス確認
ls src/generated/services/CrOcr*.ts
```

### 3. アプリケーションを起動

```powershell
pac code run
```

ブラウザでアプリケーションが起動したら、OCR管理ページにアクセスして動作を確認します。

---

## 🔧 トラブルシューティング

### エラー: "Table 'cr_ocrmenusections' not found"

**原因:** Dataverseにテーブルが作成されていない

**解決策:**
1. Power Apps Portalでテーブルが存在するか確認
2. `Dataverse_OCR_Tables.csv`を使用してテーブルをインポート
3. 手動でテーブルを作成

### エラー: "pac: command not found"

**原因:** Power Apps CLIがインストールされていない

**解決策:**
```powershell
# Power Apps CLIをインストール
dotnet tool install --global Microsoft.PowerApps.CLI.Tool
```

### エラー: "Authentication failed"

**原因:** Dataverse環境に接続されていない

**解決策:**
```powershell
# Dataverse環境に接続
pac auth create --environment <環境URL>

# 接続確認
pac auth list
```

---

## 📚 参考資料

- [OCR管理システム - Dataverse テーブル設定ガイド](./OCR_Dataverse_Tables_Setup_Guide.md)
- [OCR管理 - Dataverse連動 実装ガイド](./OCR_Dataverse_Implementation_Guide.md)
- [Dataverse CRUD 共通サービス設計](./Archi/dataverse-crud-common-service.html)

---

## 次のステップ

データソース追加が完了したら、以下のドキュメントを参照して実装を進めてください:

1. **サービス実装の更新** - `ocrDataverseService.ts`を更新
2. **コンポーネント統合** - `OcrSidebar.tsx`をDataverseと統合
3. **テストとデバッグ** - 動作確認とエラー修正

---

**最終更新日:** 2025年11月21日
