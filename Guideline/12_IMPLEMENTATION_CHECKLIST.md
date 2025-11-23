# 実装チェックリスト

## 📋 目的
このチェックリストは、フロントエンド実装時に品質を担保し、再発防止を図るためのガイドラインです。
コードレビューやプルリクエスト前に必ず確認してください。

---

## 🔴 セキュリティチェック

### ✅ デバッグログの除去
- [ ] **本番コードに`console.log`/`console.error`が残っていないか**
  - ❌ 悪い例: `console.log('[DEBUG] User data:', userData)`
  - ✅ 良い例: プロダクションビルドで自動削除される仕組みを導入
  - **対策**: 環境変数でログレベルを制御するLogger utilityを使用

### ✅ ストレージの安全性
- [ ] **localStorageに機密情報を保存していないか**
  - ❌ 避けるべき: トークン、パスワード、個人情報
  - ✅ 許可: UI状態、ユーザー設定（非機密）
  - **対策**: 機密情報はメモリまたは暗号化して保存

### ✅ XSS対策
- [ ] **ユーザー入力を直接DOM挿入していないか**
  - ❌ 悪い例: `dangerouslySetInnerHTML`の無防備な使用
  - ✅ 良い例: Reactのデフォルトエスケープを利用

### ✅ メモリリークの防止
- [ ] **Blob URLを適切にクリーンアップしているか**
  - ❌ 悪い例: `URL.createObjectURL(blob)`をそのまま放置
  - ✅ 良い例: `useEffect`のクリーンアップで`URL.revokeObjectURL()`を実行
  ```typescript
  useEffect(() => {
    const url = URL.createObjectURL(blob)
    return () => URL.revokeObjectURL(url)
  }, [blob])
  ```

---

## ⚡ パフォーマンスチェック

### ✅ 不要な再レンダリングの防止
- [ ] **重い計算処理に`useMemo`を使用しているか**
  - ❌ 悪い例: 毎回フィルタリング/ソートを実行
  - ✅ 良い例: `useMemo(() => items.filter(...), [items, filter])`

- [ ] **コールバック関数に`useCallback`を使用しているか**
  - ❌ 悪い例: `onClick={() => handleClick(id)}`を毎回生成
  - ✅ 良い例: `useCallback(() => handleClick(id), [id])`

### ✅ API呼び出しの最適化
- [ ] **無限ループを引き起こす`useEffect`依存配列がないか**
  - ❌ 悪い例: `useEffect(() => { setState(...) }, [state])`
  - ✅ 良い例: 依存配列を最小限にし、必要な場合のみ更新

- [ ] **不要なポーリングを避けているか**
  - ❌ 悪い例: 30秒ごとに無条件でAPI呼び出し
  - ✅ 良い例: WebSocketまたは必要時のみ取得

### ✅ 画像・メディアの最適化
- [ ] **大きな画像を最適化しているか**
  - ❌ 悪い例: 5MBの画像を直接表示
  - ✅ 良い例: サムネイル生成、lazy loading、WebP形式

---

## 🐛 エラーハンドリングチェック

### ✅ 適切なtry-catch
- [ ] **全ての非同期処理にエラーハンドリングがあるか**
  - ❌ 悪い例: `await api.call()`をtry-catchなしで実行
  - ✅ 良い例:
  ```typescript
  try {
    const data = await api.call()
    return data
  } catch (error) {
    logError(error)
    showUserNotification('エラーが発生しました')
    return fallbackValue
  }
  ```

### ✅ Null安全性
- [ ] **オプショナルチェーンとNull合体演算子を使用しているか**
  - ❌ 悪い例: `user.profile.name` (undefinedでクラッシュ)
  - ✅ 良い例: `user?.profile?.name ?? 'Unknown'`

### ✅ ユーザーへのフィードバック
- [ ] **エラー発生時にユーザーに通知しているか**
  - ❌ 悪い例: `console.error()`だけ
  - ✅ 良い例: トースト通知、エラーバウンダリ

---

## 🎨 UI/UXチェック

### ✅ アクセシビリティ
- [ ] **全てのボタンに適切な`aria-label`があるか**
  ```typescript
  <button aria-label="ドキュメントを削除" onClick={handleDelete}>
    <Trash2 />
  </button>
  ```

- [ ] **キーボード操作に対応しているか**
  - Tab、Enter、Escapeキーで操作可能

- [ ] **カラーコントラストが十分か**
  - WCAG AA基準: 4.5:1以上

### ✅ ローディング状態
- [ ] **全ての非同期処理にローディング表示があるか**
  - ✅ スピナー、スケルトン、プログレスバーを統一

### ✅ レスポンシブデザイン
- [ ] **モバイル、タブレット、デスクトップで動作確認したか**

---

## 📦 コード品質チェック

### ✅ DRY原則（Don't Repeat Yourself）
- [ ] **同じロジックが複数箇所にコピーされていないか**
  - ✅ 共通ロジックはカスタムフック、ユーティリティ関数に抽出

### ✅ 命名規則
- [ ] **変数、関数、コンポーネント名が明確か**
  - ❌ 悪い例: `data`, `temp`, `x`
  - ✅ 良い例: `filteredDocuments`, `handleDocumentDelete`, `OcrDocumentList`

### ✅ Magic Numberの排除
- [ ] **ハードコードされた数値を定数化しているか**
  ```typescript
  // ❌ 悪い例
  setInterval(fetch, 30000)
  
  // ✅ 良い例
  const POLLING_INTERVAL_MS = 30_000
  setInterval(fetch, POLLING_INTERVAL_MS)
  ```

### ✅ TypeScript型定義
- [ ] **`any`型を使用していないか**
  - ✅ 適切な型定義、またはGenericsを使用

- [ ] **型定義とコメントが一致しているか**

---

## 🗂️ アーキテクチャチェック

### ✅ 関心の分離
- [ ] **ビジネスロジックがUIコンポーネントから分離されているか**
  - ❌ 悪い例: ページコンポーネントに100行のロジック
  - ✅ 良い例: カスタムフック、サービス層に分離

### ✅ 状態管理
- [ ] **複数の`useState`をuseReducerに統合できないか**
  - 目安: 5個以上の関連する状態 → useReducerを検討

### ✅ 依存関係
- [ ] **循環依存が発生していないか**
  - ツール: `madge`で検証可能

---

## 🧪 テストチェック

### ✅ ユニットテスト
- [ ] **重要なロジックにテストがあるか**
  - 目標: カバレッジ80%以上

### ✅ 統合テスト
- [ ] **主要なユーザーフローをテストしているか**

---

## 🚀 デプロイ前チェック

### ✅ ビルドエラー
- [ ] **`npm run build`が成功するか**
- [ ] **型エラーが残っていないか (`npm run type-check`)**

### ✅ Lint/Format
- [ ] **ESLintエラーが0件か**
- [ ] **Prettierでフォーマット済みか**

### ✅ 未使用コードの削除
- [ ] **未使用のimport、変数、関数を削除したか**

### ✅ 環境変数
- [ ] **APIエンドポイントなどがハードコードされていないか**
  - ✅ `.env`ファイルで管理

---

## 📝 ドキュメンテーション

### ✅ コメント
- [ ] **複雑なロジックにコメントがあるか**
- [ ] **TODOコメントが残っていないか（または課題管理に移行したか）**

### ✅ README
- [ ] **新機能を追加した場合、READMEを更新したか**

---

## 🔄 レビュー後のアクション

### ✅ 指摘事項の対応
- [ ] **全てのレビューコメントに対応したか**
- [ ] **対応内容を明確にコミットメッセージに記載したか**

---

## 🎯 今回の改善項目（2025年11月23日時点）

### 修正完了項目
- [x] セキュリティ: console.logの削除またはLogger utility化
  - ✅ `src/lib/logger.ts`を作成し、環境に応じたログ制御を実装
  - ✅ ocrDataverseService.ts, ocr-document-list.tsx, ocr-document-detail.tsxでloggerに置き換え
- [x] セキュリティ: Blob URLのメモリリーク対策
  - ✅ OcrDocumentPreview.tsxにuseEffectクリーンアップ処理を追加
  - ✅ URL.revokeObjectURL()でBlob URLを適切に解放
- [x] エラーハンドリング: try-catchの適切な実装
  - ✅ `src/lib/errorHandler.ts`を作成し、統一的なエラー処理を提供
  - ✅ safeAsync, handleApiError, retryAsync関数を実装
- [x] パフォーマンス: useMemo/useCallbackの活用
  - ✅ ocr-document-list.tsxのgetFilteredDocumentsをuseMemoに変更
  - ✅ handleBulkDownload, handleBulkArchiveをuseCallbackに変更
- [x] コード重複: 共通ロジックの抽出（フォルダツリー構築、削除ロジック）
  - ✅ `src/hooks/useFolderTree.ts`を作成し、フォルダツリー構築ロジックを共通化
  - ✅ useFolderTree, useFolderAndDescendants, useFolderAncestors関数を提供
- [x] Null安全性: オプショナルチェーンの追加
  - ✅ ocr-document-detail.tsxでdocument.ocrResult?.fields?.lengthに修正
  - ✅ Null合体演算子(??)を適切に使用
- [x] 型定義: any型の排除、型の強化
  - ✅ 未使用パラメータに`_`プレフィックスを追加
- [x] アクセシビリティ: aria-label、role属性の追加
  - ✅ OcrDocumentPreview.tsxの全ボタンにaria-label追加
  - ✅ ズームイン/アウト、回転、ダウンロードボタンに適切なラベル設定
- [x] Magic Number: 定数化
  - ✅ `src/config/constants.ts`を作成し、全ての定数を一元管理
  - ✅ PAGINATION, POLLING_INTERVALS, FILE_UPLOAD, TIMEOUTSなど網羅
- [x] 未使用import: 削除
  - ✅ ocrDataverseService.tsのhandleApiErrorを削除

### 修正したファイル一覧
1. **新規作成**
   - `Guideline/12_IMPLEMENTATION_CHECKLIST.md` - 実装チェックリスト
   - `src/lib/logger.ts` - ログユーティリティ
   - `src/lib/errorHandler.ts` - エラーハンドリングユーティリティ
   - `src/config/constants.ts` - 定数管理
   - `src/hooks/useFolderTree.ts` - フォルダツリー共通フック

2. **修正済み**
   - `src/services/ocrDataverseService.ts` - console.logをloggerに置き換え
   - `src/features/ocr/pages/ocr-document-list.tsx` - useMemo/useCallback追加、logger導入
   - `src/features/ocr/pages/ocr-document-detail.tsx` - logger導入、Null安全性強化
   - `src/components/ocr/OcrDocumentPreview.tsx` - メモリリーク対策、アクセシビリティ改善

### 今後の改善予定
- [ ] WebSocketによるリアルタイム更新（ポーリング削減）
- [ ] 画像最適化（サムネイル生成、WebP対応）
- [ ] E2Eテストの追加
- [ ] Storybookによるコンポーネントカタログ
- [ ] 残りのconsole.logをloggerに置き換え（landing.tsx, AppSwitcher.tsx等）
- [ ] useReducerへの移行（複雑なページの状態管理）

---

## 📚 参考資料

- [React Best Practices](https://react.dev/learn)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Web Accessibility Guidelines (WCAG)](https://www.w3.org/WAI/WCAG21/quickref/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

**最終更新**: 2025年11月23日
**メンテナンス**: 新規機能追加時、このチェックリストも更新すること
