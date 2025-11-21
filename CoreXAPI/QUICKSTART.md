# CoreXAPI - Quick Start Guide

## セットアップ手順

### 1. 仮想環境のアクティベート (既に完了)
```powershell
.\venv\Scripts\Activate.ps1
```

### 2. スーパーユーザーの作成
```powershell
python manage.py createsuperuser
```

プロンプトに従って以下を入力:
- Username: admin
- Email: admin@example.com
- Password: (任意のパスワード)

### 3. 開発サーバーの起動
```powershell
python manage.py runserver
```

サーバーは http://127.0.0.1:8000/ で起動します。

## アクセス先

- **Admin管理画面**: http://127.0.0.1:8000/admin/
- **API ドキュメント (Swagger)**: http://127.0.0.1:8000/api/docs/
- **API ドキュメント (ReDoc)**: http://127.0.0.1:8000/api/redoc/
- **API エンドポイント**: http://127.0.0.1:8000/api/

## 主なAPIエンドポイント

### 認証
- POST http://127.0.0.1:8000/api/auth/token/ - ログイン (JWT取得)
- POST http://127.0.0.1:8000/api/auth/token/refresh/ - トークン更新

### リソース
- http://127.0.0.1:8000/api/clients/ - クライアント管理
- http://127.0.0.1:8000/api/members/ - メンバー管理
- http://127.0.0.1:8000/api/projects/ - プロジェクト管理
- http://127.0.0.1:8000/api/tasks/ - タスク管理
- http://127.0.0.1:8000/api/activities/ - アクティビティログ

## フロントエンドとの連携

フロントエンド(CoreX)のAPIベースURLを以下に設定:
```
http://127.0.0.1:8000/api/
```

CORS設定により、以下のオリジンからのアクセスが許可されています:
- http://localhost:5173 (Vite開発サーバー)
- http://localhost:3000

## 次のステップ

1. Admin管理画面でテストデータを作成
2. API ドキュメントでエンドポイントを確認
3. フロントエンドからAPIを呼び出す
