# フロントエンドとバックエンドの連携ガイド

## 概要

musubisuiteフロントエンドとmusubisuite_backバックエンドが連携して動作するように設定されました。

## セットアップ

### 1. バックエンド (Django)

```powershell
cd musubisuite_back
# 仮想環境がまだ有効でない場合
..\. venv\Scripts\Activate.ps1
# サーバーを起動
python manage.py runserver
```

バックエンドは `http://127.0.0.1:8000` で起動します。

### 2. フロントエンド (Vite + React)

```powershell
cd musubisuite
npm run dev
```

フロントエンドは `http://localhost:5173` で起動します。

## テストデータの作成

### Django管理画面でクライアントを作成

1. `http://127.0.0.1:8000/admin/` にアクセス
2. スーパーユーザーでログイン (username: admin)
3. "Clients" セクションで "Add" をクリック
4. 以下のようなテストデータを作成:

```
会社名: テスト株式会社
担当者名: 山田太郎
メールアドレス: yamada@test.com
電話番号: 03-1234-5678
業種: IT・通信
```

複数のクライアントを作成しておくと、フロントエンドのドロップダウンで選択できます。

## 新規案件の作成フロー

1. フロントエンドの案件一覧ページ (`http://localhost:5173/dashboard/projects`) にアクセス
2. 右上の「新規案件」ボタンをクリック
3. フォームに以下の情報を入力:
   - 案件名 (必須)
   - 説明
   - クライアント (必須) - Django管理画面で作成したクライアントを選択
   - ステータス
   - 優先度
   - 予算
   - 開始日
   - 期限 (必須)
4. 「作成」ボタンをクリック

### 動作

- フロントエンドから `POST http://127.0.0.1:8000/api/projects/` にデータが送信されます
- Djangoバックエンドでプロジェクトが作成されます
- 成功すると、成功メッセージ (toast) が表示されます
- ローカルの状態も更新され、一覧に新しい案件が表示されます

## API エンドポイント

### クライアント

- `GET /api/clients/` - クライアント一覧
- `POST /api/clients/` - クライアント作成
- `GET /api/clients/{id}/` - クライアント詳細
- `PATCH /api/clients/{id}/` - クライアント更新
- `DELETE /api/clients/{id}/` - クライアント削除

### プロジェクト

- `GET /api/projects/` - プロジェクト一覧
- `POST /api/projects/` - プロジェクト作成
- `GET /api/projects/{id}/` - プロジェクト詳細
- `PATCH /api/projects/{id}/` - プロジェクト更新
- `DELETE /api/projects/{id}/` - プロジェクト削除

## トラブルシューティング

### CORS エラー

CORSエラーが発生する場合、バックエンドの `config/settings.py` で以下を確認:

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
```

### 認証エラー

開発環境では認証を無効にしています。本番環境では認証を有効にする必要があります。

### データが表示されない

1. Djangoサーバーが起動していることを確認
2. ブラウザのコンソールでエラーをチェック
3. Django管理画面でデータが存在することを確認

## 今後の拡張

- [ ] JWT認証の実装
- [ ] プロジェクト一覧のAPI取得
- [ ] プロジェクト更新機能
- [ ] タスク管理機能
- [ ] メンバー管理機能
- [ ] ファイルアップロード機能
