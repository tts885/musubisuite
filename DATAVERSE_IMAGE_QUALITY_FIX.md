# Dataverse画像品質問題の解決ガイド

## 🔍 問題の特定

画像がDataverseに保存される際に**自動的に圧縮・リサイズ**されている可能性があります。

### Dataverse画像列の制約

1. **最大画像サイズ**: 添付画像では `10240 KB` (約10MB) に設定されています ✅
2. **完全な画像を保存**: チェックされています ✅
3. **しかし**: Dataverseの画像列(`Image`型)は、**自動的に画像をリサイズ**する可能性があります

## 🎯 解決策

### 方法1: Dataverseの画像列設定を確認・変更

#### 1.1 Power Apps Makerポータルで確認

1. [Power Apps](https://make.powerapps.com) にアクセス
2. 左メニューから **テーブル** を選択
3. `OCRドキュメント` テーブルを開く
4. `アップロードファイル` (cx_filedata) 列を編集
5. **詳細オプション** を展開
6. 以下を確認:
   - ✅ **完全な画像を保存できます**: ONにする
   - ✅ **最大画像サイズ**: `10240 KB` 以上に設定

#### 1.2 重要: 画像列の制約

Dataverseの**画像列(`Image`型)**には以下の制約があります:

- **最大解像度**: 幅・高さともに最大 **144px** までリサイズされる場合がある
- **サムネイル生成**: 自動的にサムネイルが生成される

### 方法2: ファイル列に変更(推奨)

**画像列ではなくファイル列を使用**することで、元の解像度を完全に保持できます。

#### 2.1 新しいファイル列を追加

```xml
<!-- Dataverseテーブル定義 -->
<attribute name="cx_filedata_full">
  <displayname>完全サイズファイル</displayname>
  <type>file</type>
  <maxsizeinKB>32768</maxsizeinKB> <!-- 最大32MB -->
  <description>元の解像度を保持したファイル</description>
</attribute>
```

#### 2.2 コード修正

**ocrDataverseService.ts** を修正:

```typescript
/**
 * ドキュメントを追加（ファイルアップロード）
 */
async createDocument(document: Partial<OcrDocument>, file: File): Promise<OcrDocument> {
  try {
    // ... (既存のコード)
    
    // レコードを作成
    const result = await Cx_ocrdocumentsesService.create(record);
    const documentId = data.cx_ocrdocumentsid;

    // ファイル列にアップロード（画像列ではなく）
    await this.uploadFileToFileColumn(documentId, file);
    
    // ... (残りのコード)
  } catch (error) {
    logger.error('ドキュメントアップロードエラー', error);
    throw error;
  }
}

/**
 * ファイル列にアップロード（高品質）
 */
private async uploadFileToFileColumn(documentId: string, file: File): Promise<void> {
  try {
    const fileBase64 = await this.fileToBase64(file);
    
    // ファイル列用のデータ形式
    const fileData = {
      cx_filedata_full: fileBase64,
      'cx_filedata_full@odata.mediaContentType': file.type
    };

    await Cx_ocrdocumentsesService.update(documentId, fileData);
    
    logger.info('[ファイル列アップロード] 成功', { 
      documentId,
      fileName: file.name,
      fileSize: file.size
    });
  } catch (error) {
    logger.error('ファイル列アップロードエラー', error);
    throw error;
  }
}
```

### 方法3: Base64テキスト列を使用(最も確実)

画像列・ファイル列の制約を完全に回避するため、**長いテキスト列**にBase64を保存します。

#### 3.1 Dataverseテーブルに列を追加

1. Power Apps Makerで `OCRドキュメント` テーブルを開く
2. 新しい列を追加:
   - **列名**: `cx_filedata_base64`
   - **データ型**: **複数行テキスト**
   - **最大文字数**: `1048576` (最大値)
   - **形式**: **テキスト**

#### 3.2 コード修正

```typescript
/**
 * ファイルデータをアップロード（Base64テキスト列）
 */
private async uploadFileData(documentId: string, file: File): Promise<void> {
  try {
    logger.debug('ファイルデータアップロード開始', {
      documentId,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size
    });
    
    const fileBase64 = await this.fileToBase64(file);
    
    logger.info('[Base64変換] 完了', {
      fileName: file.name,
      base64Length: fileBase64.length,
      estimatedSizeMB: (fileBase64.length * 0.75 / 1024 / 1024).toFixed(2),
      originalSizeMB: (file.size / 1024 / 1024).toFixed(2)
    });

    // Base64テキスト列にそのまま保存（リサイズなし）
    const fileData = {
      cx_filedata_base64: fileBase64,  // 長いテキスト列
      cx_filetype: file.type,          // MIMEタイプを別途保存
      cx_filesize: file.size.toString() // ファイルサイズを保存
    };

    await Cx_ocrdocumentsesService.update(documentId, fileData);
    
    logger.info('[Dataverse保存] ファイルデータアップロード成功', { 
      documentId,
      fileName: file.name,
      base64Length: fileBase64.length 
    });
  } catch (error) {
    logger.error('ファイルデータアップロードエラー', { 
      documentId, 
      fileName: file.name,
      error 
    });
    throw new Error(`画像のアップロードに失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
  }
}
```

取得時:

```typescript
// ファイルデータがある場合、Blob URLを生成
if (record.cx_filedata_base64) {  // Base64テキスト列から取得
  try {
    const mimeType = record.cx_filetype || 'image/jpeg';
    const blob = this.base64ToBlob(record.cx_filedata_base64, mimeType);
    
    logger.info('[Blob URL生成] 成功', { 
      fileName: record.cx_filename,
      blobSize: blob.size,
      blobSizeMB: (blob.size / 1024 / 1024).toFixed(2),
      mimeType: blob.type
    });
    
    document.fileUrl = URL.createObjectURL(blob);
  } catch (error) {
    logger.error('[Base64→Blob変換] エラー', error);
  }
}
```

## 🧪 デバッグ手順

### 1. ブラウザコンソールでログを確認

1. ドキュメント詳細ページを開く
2. F12キーを押して開発者ツールを開く
3. **Console** タブを確認
4. 以下のログを探す:

```
[画像サイズ検証] Dataverseから取得した画像の実際のサイズ
{
  fileName: "1011_サンプル請求書２.png",
  width: 144,  // ← これが小さすぎる場合、Dataverseでリサイズされている!
  height: 164,
  blobSize: 201409,
  mimeType: "image/png"
}
```

### 2. Dataverseで直接データを確認

1. [Power Apps](https://make.powerapps.com) にアクセス
2. **データ** > **テーブル** > **OCRドキュメント**
3. レコードを開いて `cx_filedata` の値を確認
4. Base64文字列の長さを確認:
   - **短い** (数千文字) → リサイズされている
   - **長い** (数十万文字) → 元のサイズが保持されている

## ✅ 推奨アクション

1. **即座**: ブラウザコンソールでログを確認して実際の画像サイズを確認
2. **短期**: Dataverseの画像列設定で「完全な画像を保存」が有効か確認
3. **長期**: Base64テキスト列に変更して完全な制御を実現

## 📊 各方法の比較

| 方法 | メリット | デメリット | 推奨度 |
|------|----------|------------|--------|
| **画像列** | 簡単に実装 | 自動リサイズされる可能性 | ❌ |
| **ファイル列** | 元のサイズ保持 | Web API経由でのアクセスが複雑 | ⚠️ |
| **Base64テキスト列** | 完全な制御、リサイズなし | テキスト列のサイズ制限 | ✅ |

## 🔧 次のステップ

1. ブラウザコンソールで画像サイズを確認
2. 実際のサイズが小さい場合、**方法3(Base64テキスト列)**を実装
3. 既存のデータを再アップロード
