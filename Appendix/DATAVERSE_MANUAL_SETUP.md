# Dataverse OCRテーブル 手動作成ガイド

生成日時: 2025年11月19日 22:46:26

---

## 前提条件

- Power Apps Maker Portal へのアクセス権限
- テーブル作成権限（環境管理者またはシステムカスタマイザー）
- URL: https://make.powerapps.com

---

## 作成手順の概要

全 **5個** のテーブルを作成します:

1. **OCRメニューセクション** (`cr_ocrmenusections`)
2. **OCRフォルダ** (`cr_ocrfolders`)
3. **OCRドキュメント** (`cr_ocrdocuments`)
4. **OCR処理結果** (`cr_ocrresults`)
5. **OCRフィールド** (`cr_ocrfields`)

---

## テーブル 1: OCRメニューセクション

### 基本情報

- **表示名**: OCRメニューセクション
- **複数形の名前**: OCRメニューセクション
- **論理名**: `cr_ocrmenusections`
- **説明**: OCR管理のメニューセクション(すべてのドキュメント等)
- **プライマリ列**: `cr_name`

### ステップ 1: テーブルの作成

1. [Power Apps Maker Portal](https://make.powerapps.com) を開く
2. 左メニューから **Tables** (テーブル) を選択
3. 上部の **+ New table** → **Create new tables** をクリック
4. 以下の情報を入力:

   - **Display name**: `OCRメニューセクション`
   - **Plural name**: `OCRメニューセクション`
   - **Description**: `OCR管理のメニューセクション(すべてのドキュメント等)`

5. **Enable attachments** (添付ファイルを有効化) をオンにする
6. **Save** (保存) をクリック

### ステップ 2: 列の追加

作成したテーブルに **9個の列** を追加します。

#### 列 1: OCRメニューセクションID

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `OCRメニューセクションID`
   - **Data type**: `uniqueidentifier`
   - **Description**: `主キー`

4. **Save** をクリック

#### 列 2: 説明

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `説明`
   - **Data type**: `1行テキスト`
   - **Max length**: `500`
   - **Description**: `メニューセクションの説明`

4. **Save** をクリック

#### 列 3: 表示順序

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `表示順序`
   - **Data type**: `整数`
   - **Description**: `メニューの表示順序`

4. **Save** をクリック

#### 列 4: デフォルトメニュー

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `デフォルトメニュー`
   - **Data type**: `はい/いいえ`
   - **Description**: `デフォルトメニューかどうか(すべてのドキュメント)`

4. **Save** をクリック

#### 列 5: カラー

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `カラー`
   - **Data type**: `1行テキスト`
   - **Max length**: `20`
   - **Description**: `メニューのカラーコード`

4. **Save** をクリック

#### 列 6: 作成者

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `作成者`
   - **Data type**: `参照`
   - **Description**: `作成者(Userテーブル参照)`

4. **Save** をクリック

#### 列 7: 作成日時

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `作成日時`
   - **Data type**: `日付と時刻`
   - **Description**: `作成日時`

4. **Save** をクリック

#### 列 8: 更新日時

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `更新日時`
   - **Data type**: `TRUE`
   - **Description**: `最終更新日時`

4. **Save** をクリック

---

## テーブル 2: OCRフォルダ

### 基本情報

- **表示名**: OCRフォルダ
- **複数形の名前**: OCRフォルダ
- **論理名**: `cr_ocrfolders`
- **説明**: OCRドキュメントを管理する階層構造のフォルダ
- **プライマリ列**: `cr_name`

### ステップ 1: テーブルの作成

1. [Power Apps Maker Portal](https://make.powerapps.com) を開く
2. 左メニューから **Tables** (テーブル) を選択
3. 上部の **+ New table** → **Create new tables** をクリック
4. 以下の情報を入力:

   - **Display name**: `OCRフォルダ`
   - **Plural name**: `OCRフォルダ`
   - **Description**: `OCRドキュメントを管理する階層構造のフォルダ`

5. **Enable attachments** (添付ファイルを有効化) をオンにする
6. **Save** (保存) をクリック

### ステップ 2: 列の追加

作成したテーブルに **12個の列** を追加します。

#### 列 1: OCRフォルダID

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `OCRフォルダID`
   - **Data type**: `uniqueidentifier`
   - **Description**: `主キー`

4. **Save** をクリック

#### 列 2: 説明

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `説明`
   - **Data type**: `1行テキスト`
   - **Max length**: `1000`
   - **Description**: `フォルダの説明`

4. **Save** をクリック

#### 列 3: カラー

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `カラー`
   - **Data type**: `1行テキスト`
   - **Max length**: `20`
   - **Description**: `フォルダのカラーコード(#3b82f6形式)`

4. **Save** をクリック

#### 列 4: 親フォルダID

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `親フォルダID`
   - **Data type**: `参照`
   - **Description**: `親フォルダ(cr_ocrfoldersテーブル参照)`

4. **Save** をクリック

#### 列 5: メニューセクションID

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `メニューセクションID`
   - **Data type**: `参照`
   - **Description**: `所属するメニューセクション(cr_ocrmenusectionsテーブル参照)`

4. **Save** をクリック

#### 列 6: パス

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `パス`
   - **Data type**: `1行テキスト`
   - **Max length**: `500`
   - **Description**: `フォルダパス(/請求書/2024年度)`

4. **Save** をクリック

#### 列 7: ドキュメント数

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `ドキュメント数`
   - **Data type**: `整数`
   - **Description**: `フォルダ内のドキュメント数`

4. **Save** をクリック

#### 列 8: 子フォルダ数

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `子フォルダ数`
   - **Data type**: `整数`
   - **Description**: `子フォルダの数`

4. **Save** をクリック

#### 列 9: 作成者

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `作成者`
   - **Data type**: `参照`
   - **Description**: `作成者(Userテーブル参照)`

4. **Save** をクリック

#### 列 10: 作成日時

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `作成日時`
   - **Data type**: `日付と時刻`
   - **Description**: `作成日時`

4. **Save** をクリック

#### 列 11: 更新日時

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `更新日時`
   - **Data type**: `日付と時刻`
   - **Description**: `最終更新日時`

4. **Save** をクリック

---

## テーブル 3: OCRドキュメント

### 基本情報

- **表示名**: OCRドキュメント
- **複数形の名前**: OCRドキュメント
- **論理名**: `cr_ocrdocuments`
- **説明**: OCR処理対象のドキュメント(請求書、見積書等)
- **プライマリ列**: `cr_filename`

### ステップ 1: テーブルの作成

1. [Power Apps Maker Portal](https://make.powerapps.com) を開く
2. 左メニューから **Tables** (テーブル) を選択
3. 上部の **+ New table** → **Create new tables** をクリック
4. 以下の情報を入力:

   - **Display name**: `OCRドキュメント`
   - **Plural name**: `OCRドキュメント`
   - **Description**: `OCR処理対象のドキュメント(請求書、見積書等)`

5. **Enable attachments** (添付ファイルを有効化) をオンにする
6. **Save** (保存) をクリック

### ステップ 2: 列の追加

作成したテーブルに **13個の列** を追加します。

#### 列 1: OCRドキュメントID

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `OCRドキュメントID`
   - **Data type**: `uniqueidentifier`
   - **Description**: `主キー`

4. **Save** をクリック

#### 列 2: ファイルタイプ

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `ファイルタイプ`
   - **Data type**: `1行テキスト`
   - **Max length**: `100`
   - **Description**: `MIMEタイプ(image/png`

4. **Save** をクリック

#### 列 3: ファイルサイズ

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `ファイルサイズ`
   - **Data type**: `整数`
   - **Description**: `ファイルサイズ(バイト単位)`

4. **Save** をクリック

#### 列 4: ファイルURL

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `ファイルURL`
   - **Data type**: `1行テキスト`
   - **Max length**: `2000`
   - **Description**: `ファイルの保存場所URL`

4. **Save** をクリック

#### 列 5: サムネイルURL

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `サムネイルURL`
   - **Data type**: `1行テキスト`
   - **Max length**: `2000`
   - **Description**: `サムネイル画像URL`

4. **Save** をクリック

#### 列 6: フォルダID

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `フォルダID`
   - **Data type**: `参照`
   - **Description**: `所属フォルダ(cr_ocrfoldersテーブル参照)`

4. **Save** をクリック

#### 列 7: プロジェクトID

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `プロジェクトID`
   - **Data type**: `参照`
   - **Description**: `関連プロジェクト(任意)`

4. **Save** をクリック

#### 列 8: タグ

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `タグ`
   - **Data type**: `1行テキスト`
   - **Max length**: `500`
   - **Description**: `タグ(カンマ区切り)`

4. **Save** をクリック

#### 列 9: アップロード者

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `アップロード者`
   - **Data type**: `参照`
   - **Description**: `アップロード者(Userテーブル参照)`

4. **Save** をクリック

#### 列 10: アップロード日時

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `アップロード日時`
   - **Data type**: `日付と時刻`
   - **Description**: `アップロード日時`

4. **Save** をクリック

#### 列 11: 作成日時

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `作成日時`
   - **Data type**: `日付と時刻`
   - **Description**: `作成日時`

4. **Save** をクリック

#### 列 12: 更新日時

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `更新日時`
   - **Data type**: `日付と時刻`
   - **Description**: `最終更新日時`

4. **Save** をクリック

---

## テーブル 4: OCR処理結果

### 基本情報

- **表示名**: OCR処理結果
- **複数形の名前**: OCR処理結果
- **論理名**: `cr_ocrresults`
- **説明**: OCR処理の結果情報
- **プライマリ列**: `cr_name`

### ステップ 1: テーブルの作成

1. [Power Apps Maker Portal](https://make.powerapps.com) を開く
2. 左メニューから **Tables** (テーブル) を選択
3. 上部の **+ New table** → **Create new tables** をクリック
4. 以下の情報を入力:

   - **Display name**: `OCR処理結果`
   - **Plural name**: `OCR処理結果`
   - **Description**: `OCR処理の結果情報`

5. **Enable attachments** (添付ファイルを有効化) をオンにする
6. **Save** (保存) をクリック

### ステップ 2: 列の追加

作成したテーブルに **14個の列** を追加します。

#### 列 1: OCR処理結果ID

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `OCR処理結果ID`
   - **Data type**: `uniqueidentifier`
   - **Description**: `主キー`

4. **Save** をクリック

#### 列 2: ドキュメントID

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `ドキュメントID`
   - **Data type**: `参照`
   - **Description**: `関連ドキュメント(cr_ocrdocumentsテーブル参照)`

4. **Save** をクリック

#### 列 3: 処理ステータス

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `処理ステータス`
   - **Data type**: `選択肢`
   - **Description**: `ステータス(pending/processing/completed/failed)`

4. **Save** をクリック

#### 列 4: 全文テキスト

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `全文テキスト`
   - **Data type**: `複数行テキスト`
   - **Description**: `OCRで抽出された全文テキスト`

4. **Save** をクリック

#### 列 5: 全体信頼度

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `全体信頼度`
   - **Data type**: `10進数`
   - **Description**: `全体の信頼度スコア(0.0-1.0)`

4. **Save** をクリック

#### 列 6: 処理完了日時

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `処理完了日時`
   - **Data type**: `日付と時刻`
   - **Description**: `OCR処理完了日時`

4. **Save** をクリック

#### 列 7: エラーメッセージ

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `エラーメッセージ`
   - **Data type**: `1行テキスト`
   - **Max length**: `1000`
   - **Description**: `エラー発生時のメッセージ`

4. **Save** をクリック

#### 列 8: 作成日時

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `作成日時`
   - **Data type**: `日付と時刻`
   - **Description**: `作成日時`

4. **Save** をクリック

#### 列 9: 更新日時

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `更新日時`
   - **Data type**: `日付と時刻`
   - **Description**: `最終更新日時`

4. **Save** をクリック

#### 列 10: 1

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `1`
   - **Data type**: `pending`

4. **Save** をクリック

#### 列 11: 2

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `2`
   - **Data type**: `processing`

4. **Save** をクリック

#### 列 12: 3

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `3`
   - **Data type**: `completed`

4. **Save** をクリック

#### 列 13: 4

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `4`
   - **Data type**: `failed`

4. **Save** をクリック

---

## テーブル 5: OCRフィールド

### 基本情報

- **表示名**: OCRフィールド
- **複数形の名前**: OCRフィールド
- **論理名**: `cr_ocrfields`
- **説明**: OCRで検出された個別フィールド(氏名、住所、金額等)
- **プライマリ列**: `cr_label`

### ステップ 1: テーブルの作成

1. [Power Apps Maker Portal](https://make.powerapps.com) を開く
2. 左メニューから **Tables** (テーブル) を選択
3. 上部の **+ New table** → **Create new tables** をクリック
4. 以下の情報を入力:

   - **Display name**: `OCRフィールド`
   - **Plural name**: `OCRフィールド`
   - **Description**: `OCRで検出された個別フィールド(氏名、住所、金額等)`

5. **Enable attachments** (添付ファイルを有効化) をオンにする
6. **Save** (保存) をクリック

### ステップ 2: 列の追加

作成したテーブルに **20個の列** を追加します。

#### 列 1: OCRフィールドID

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `OCRフィールドID`
   - **Data type**: `uniqueidentifier`
   - **Description**: `主キー`

4. **Save** をクリック

#### 列 2: OCR処理結果ID

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `OCR処理結果ID`
   - **Data type**: `参照`
   - **Description**: `関連OCR処理結果(cr_ocrresultsテーブル参照)`

4. **Save** をクリック

#### 列 3: 値

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `値`
   - **Data type**: `1行テキスト`
   - **Max length**: `2000`
   - **Description**: `検出されたテキスト値`

4. **Save** をクリック

#### 列 4: 信頼度

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `信頼度`
   - **Data type**: `10進数`
   - **Description**: `フィールドの信頼度スコア(0.0-1.0)`

4. **Save** をクリック

#### 列 5: フィールドタイプ

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `フィールドタイプ`
   - **Data type**: `選択肢`
   - **Description**: `フィールドの種類(text/number/date/email等)`

4. **Save** をクリック

#### 列 6: X座標

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `X座標`
   - **Data type**: `整数`
   - **Description**: `画像上のX座標`

4. **Save** をクリック

#### 列 7: Y座標

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `Y座標`
   - **Data type**: `整数`
   - **Description**: `画像上のY座標`

4. **Save** をクリック

#### 列 8: 幅

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `幅`
   - **Data type**: `整数`
   - **Description**: `バウンディングボックスの幅`

4. **Save** をクリック

#### 列 9: 高さ

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `高さ`
   - **Data type**: `整数`
   - **Description**: `バウンディングボックスの高さ`

4. **Save** をクリック

#### 列 10: 編集済み

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `編集済み`
   - **Data type**: `はい/いいえ`
   - **Description**: `ユーザーによって編集されたか`

4. **Save** をクリック

#### 列 11: 作成日時

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `作成日時`
   - **Data type**: `日付と時刻`
   - **Description**: `作成日時`

4. **Save** をクリック

#### 列 12: 更新日時

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `更新日時`
   - **Data type**: `日付と時刻`
   - **Description**: `最終更新日時`

4. **Save** をクリック

#### 列 13: 1

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `1`
   - **Data type**: `text`

4. **Save** をクリック

#### 列 14: 2

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `2`
   - **Data type**: `number`

4. **Save** をクリック

#### 列 15: 3

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `3`
   - **Data type**: `date`

4. **Save** をクリック

#### 列 16: 4

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `4`
   - **Data type**: `日付と時刻`

4. **Save** をクリック

#### 列 17: 5

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `5`
   - **Data type**: `email`

4. **Save** をクリック

#### 列 18: 6

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `6`
   - **Data type**: `phone`

4. **Save** をクリック

#### 列 19: 7

1. テーブル詳細画面で **Columns** タブを選択
2. **+ New column** をクリック
3. 以下の情報を入力:

   - **Display name**: `7`
   - **Data type**: `address`

4. **Save** をクリック

---

## 完了後の確認

すべてのテーブルが作成されたら、以下を確認してください:

1. **Tables** 一覧で全テーブルが表示されること
2. 各テーブルで列が正しく作成されていること
3. 必須項目が正しく設定されていること

## 次のステップ

テーブル作成後、以下のPythonスクリプトでサンプルデータを挿入できます:

```powershell
python insert_sample_data.py
```

---

生成元CSV: `Dataverse_OCR_Tables.csv`
