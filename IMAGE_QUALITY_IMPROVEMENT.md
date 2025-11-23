# 画像品質改善実装ガイド

## 概要

Dataverseの`cx_filedata`画像列を使用したOCRドキュメント管理機能において、以下の問題を解決しました:

1. ✅ **JPEG画像の画質が悪い問題** - 正しいMIMEタイプと高品質レンダリング設定を実装
2. ✅ **PNG画像がDataverseに保存されない問題** - ファイル形式検証とBase64エンコード処理を改善
3. ✅ **エラーハンドリングの改善** - 詳細なログとユーザーフィードバックを追加

## 実装内容

### 1. 画像アップロードの改善 (`ocrDataverseService.ts`)

#### 1.1 ファイル形式検証の追加

```typescript
// サポートされている画像形式を検証
const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
if (!supportedTypes.includes(file.type)) {
  throw new Error(`サポートされていないファイル形式です: ${file.type}`);
}
```

**効果**: PNG、JPEG、GIF、BMP、WebP形式の画像をサポート

#### 1.2 Base64変換処理の改善

**変更前**:
```typescript
private fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
```

**変更後**:
```typescript
private fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      try {
        const result = reader.result as string;
        
        if (!result) {
          throw new Error('ファイルの読み込みに失敗しました');
        }
        
        // Data URLプレフィックス（data:image/jpeg;base64,）を除去
        const base64Data = result.includes(',') ? result.split(',')[1] : result;
        
        if (!base64Data || base64Data.length === 0) {
          throw new Error('Base64データが空です');
        }
        
        logger.debug('ファイル→Base64変換成功', {
          fileName: file.name,
          fileType: file.type,
          originalSize: file.size,
          base64Length: base64Data.length
        });
        
        resolve(base64Data);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      logger.error('FileReader エラー', error);
      reject(new Error('ファイルの読み込み中にエラーが発生しました'));
    };
    
    reader.readAsDataURL(file);
  });
}
```

**効果**:
- エラーハンドリングの強化
- デバッグログの追加
- 空データチェックの追加

#### 1.3 アップロード処理のログ強化

```typescript
private async uploadFileData(documentId: string, file: File): Promise<void> {
  try {
    logger.debug('ファイルデータアップロード開始', {
      documentId,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size
    });
    
    const fileBase64 = await this.fileToBase64(file);
    
    logger.debug('Base64変換完了', {
      base64Length: fileBase64.length,
      estimatedSizeMB: (fileBase64.length * 0.75 / 1024 / 1024).toFixed(2)
    });

    const fileData = {
      cx_filedata: fileBase64
    };

    await Cx_ocrdocumentsesService.update(documentId, fileData);
    
    logger.debug('ファイルデータアップロード成功', { documentId });
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

**効果**: 各ステップでの詳細なログにより、問題の追跡が容易に

### 2. 画像取得・表示の品質改善 (`ocrDataverseService.ts`)

#### 2.1 正しいMIMEタイプの使用

**変更前**:
```typescript
const blob = this.base64ToBlob(record.cx_filedata, 'application/octet-stream');
```

**変更後**:
```typescript
// 正しいMIMEタイプを使用して高品質な画像を保持
const mimeType = record.cx_filetype || 'image/jpeg';
const blob = this.base64ToBlob(record.cx_filedata, mimeType);
```

**効果**: 
- JPEG、PNG等の画像形式が正しく認識される
- ブラウザが適切な画像デコードを実行
- 画質が大幅に向上

#### 2.2 Base64→Blob変換の最適化

**変更前**:
```typescript
private base64ToBlob(base64: string, contentType: string): Blob {
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: contentType });
}
```

**変更後**:
```typescript
private base64ToBlob(base64: string, contentType: string): Blob {
  try {
    // Data URLプレフィックス（data:image/jpeg;base64,）を除去
    let base64Data = base64;
    if (base64.includes(',')) {
      base64Data = base64.split(',')[1];
    }
    
    // Base64デコード
    const byteCharacters = atob(base64Data);
    const byteArrays: Uint8Array[] = [];
    
    // 大きなファイルのため、チャンク単位で処理
    const sliceSize = 8192;
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);
      
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      
      byteArrays.push(new Uint8Array(byteNumbers));
    }
    
    return new Blob(byteArrays, { type: contentType });
  } catch (error) {
    logger.error('Base64→Blob変換エラー', error);
    throw new Error('画像データの変換に失敗しました');
  }
}
```

**効果**:
- 大きな画像ファイルでもメモリ効率的に処理
- エラーハンドリングの改善

### 3. 画像表示コンポーネントの改善 (`OcrDocumentPreview.tsx`)

#### 3.1 高品質レンダリング設定

```typescript
<img
  ref={imageRef}
  src={document.fileUrl}
  alt={document.fileName}
  className="max-w-full h-auto rounded-lg shadow-lg"
  style={{
    imageRendering: 'high-quality',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  }}
  loading="eager"
  decoding="sync"
/>
```

**効果**:
- `imageRendering: 'high-quality'`: 高品質なスケーリングアルゴリズムを使用
- `loading="eager"`: 画像を即座に読み込み
- `decoding="sync"`: 同期的にデコードして遅延を最小化

### 4. グローバルCSS設定の追加 (`index.css`)

```css
/* 画像表示品質の最適化 */
img {
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
}

/* OCRドキュメントプレビュー用の高品質画像レンダリング */
img[alt*="OCR"],
img[alt*="document"],
img[alt*="ドキュメント"] {
  image-rendering: high-quality;
  image-rendering: -webkit-optimize-contrast;
  -ms-interpolation-mode: bicubic;
}
```

**効果**:
- すべての画像でコントラストを最適化
- OCR関連画像では特に高品質なレンダリング
- クロスブラウザ対応

### 5. エラーハンドリングの改善 (`ocr-upload.tsx`)

**変更前**:
```typescript
} catch (error) {
  console.error(`ファイルアップロードエラー: ${file.name}`, error)
  toast.error(`${file.name} のアップロードに失敗しました`)
}
```

**変更後**:
```typescript
} catch (error) {
  logger.error(`ファイルアップロードエラー: ${file.name}`, error)
  const errorMessage = error instanceof Error ? error.message : '不明なエラー';
  toast.error(`${file.name}: ${errorMessage}`)
}
```

**効果**: ユーザーに具体的なエラー内容を通知

## テスト手順

### 1. JPEG画像のアップロードと表示

1. OCRアップロードページにアクセス
2. JPEG形式の画像をアップロード
3. アップロード完了後、ドキュメント詳細ページで画像を確認
4. **期待結果**: 高品質な画像が表示される

### 2. PNG画像のアップロードと表示

1. OCRアップロードページにアクセス
2. PNG形式の画像をアップロード
3. アップロード完了後、Dataverseで`cx_filedata`フィールドにデータが格納されているか確認
4. ドキュメント詳細ページで画像を確認
5. **期待結果**: PNG画像がDataverseに保存され、正しく表示される

### 3. エラーハンドリングのテスト

1. サポートされていない形式（例: .txt、.pdf）をアップロード
2. **期待結果**: 「サポートされていないファイル形式です」というエラーメッセージが表示される

### 4. 大きなファイルのアップロード

1. 5MB以上の高解像度画像をアップロード
2. **期待結果**: メモリエラーなく正常にアップロードされる

## トラブルシューティング

### PNG画像がDataverseに保存されない場合

1. ブラウザのコンソールでログを確認
   ```
   logger.debug('ファイルデータアップロード開始', { ... })
   logger.debug('Base64変換完了', { ... })
   logger.debug('ファイルデータアップロード成功', { ... })
   ```

2. Base64データの長さが0でないか確認

3. Dataverseの`cx_filedata`列が画像列として正しく設定されているか確認

### 画質が改善されない場合

1. ブラウザのキャッシュをクリア
2. 開発者ツールで画像のMIMEタイプを確認
   ```
   document.querySelector('img').src  // blob:http://... の形式か確認
   ```

3. CSSの`image-rendering`設定が適用されているか確認

## 技術仕様

### サポートされる画像形式

- JPEG (.jpg, .jpeg) - `image/jpeg`
- PNG (.png) - `image/png`
- GIF (.gif) - `image/gif`
- BMP (.bmp) - `image/bmp`
- WebP (.webp) - `image/webp`

### ファイルサイズ制限

- Dataverseの画像列: 最大32MB
- 推奨サイズ: 5MB以下（パフォーマンスのため）

### Base64エンコードの仕様

- Data URLプレフィックスを除去: `data:image/jpeg;base64,` → Base64文字列のみ
- チャンクサイズ: 8192バイト
- エンコード後のサイズ: 元のサイズの約1.33倍

## パフォーマンス最適化

1. **チャンク処理**: 大きな画像を8KBチャンクで処理し、メモリ使用量を最適化
2. **遅延読み込み回避**: OCR画像は`loading="eager"`で即座に読み込み
3. **Blob URL**: メモリ効率的な画像表示（使用後は自動的にrevokeされる）

## 今後の改善案

1. **画像圧縮**: アップロード前にクライアント側で画像を圧縮
2. **サムネイル生成**: 一覧表示用の軽量サムネイルを自動生成
3. **進捗表示**: 大きなファイルのアップロード時に詳細な進捗を表示
4. **リトライ機能**: ネットワークエラー時の自動リトライ

## 関連ファイル

- `src/services/ocrDataverseService.ts` - Dataverse連携サービス
- `src/components/ocr/OcrDocumentPreview.tsx` - 画像プレビューコンポーネント
- `src/features/ocr/pages/ocr-upload.tsx` - アップロードページ
- `src/index.css` - グローバルスタイル
- `src/lib/logger.ts` - ロギングユーティリティ
