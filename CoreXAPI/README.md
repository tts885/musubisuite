# CoreXAPI

CoreX案件管理システムのDjango REST Frameworkバックエンド

## 概要

このプロジェクトは、React + TypeScriptで構築されたフロントエンド（CoreX）のバックエンドAPIを提供します。

### 主な機能

- **案件管理**: プロジェクトの作成、更新、削除、進捗管理
- **クライアント管理**: 顧客情報の管理
- **タスク管理**: タスクの作成、割り当て、ステータス管理
- **メンバー管理**: チームメンバーの管理
- **アクティビティログ**: プロジェクト活動の履歴追跡
- **REST API**: フロントエンドとの統合用API
- **JWT認証**: トークンベースの認証システム
- **自動API ドキュメント**: Swagger UI / ReDoc

## 技術スタック

- **Framework**: Django 5.0
- **API**: Django REST Framework 3.14
- **認証**: Simple JWT
- **データベース**: SQLite (開発用) / PostgreSQL (本番用)
- **CORS**: django-cors-headers
- **API Doc**: drf-spectacular
- **Python**: 3.12+

## プロジェクト構造

```
CoreXAPI/
├── config/                 # プロジェクト設定
│   ├── settings.py        # Django設定
│   ├── urls.py           # URLルーティング
│   └── wsgi.py           # WSGI設定
├── clients/              # クライアント管理アプリ
│   ├── models.py
│   ├── serializers.py
│   └── views.py
├── members/              # メンバー管理アプリ
│   ├── models.py
│   ├── serializers.py
│   └── views.py
├── projects/             # プロジェクト管理アプリ
│   ├── models.py
│   ├── serializers.py
│   └── views.py
├── tasks/                # タスク管理アプリ
│   ├── models.py
│   ├── serializers.py
│   └── views.py
├── activities/           # アクティビティログアプリ
│   ├── models.py
│   ├── serializers.py
│   └── views.py
├── manage.py
├── requirements.txt
└── .env.example
```

## セットアップ

### 1. 仮想環境の作成とアクティベート

```powershell
# 仮想環境の作成
python -m venv venv

# アクティベート (Windows)
.\venv\Scripts\Activate.ps1

# アクティベート (Mac/Linux)
source venv/bin/activate
```

### 2. 依存パッケージのインストール

```powershell
pip install -r requirements.txt
```

### 3. 環境変数の設定

`.env.example`を`.env`にコピーして、必要に応じて編集:

```powershell
cp .env.example .env
```

### 4. データベースのマイグレーション

```powershell
# マイグレーションファイルの作成
python manage.py makemigrations

# マイグレーションの適用
python manage.py migrate
```

### 5. スーパーユーザーの作成

```powershell
python manage.py createsuperuser
```

### 6. 開発サーバーの起動

```powershell
python manage.py runserver
```

サーバーは `http://127.0.0.1:8000/` で起動します。

## API エンドポイント

### 認証

- `POST /api/auth/token/` - JWTトークン取得
- `POST /api/auth/token/refresh/` - トークン更新
- `POST /api/auth/token/verify/` - トークン検証

### リソース

- `GET/POST /api/clients/` - クライアント一覧/作成
- `GET/PUT/PATCH/DELETE /api/clients/{id}/` - クライアント詳細/更新/削除
- `GET/POST /api/members/` - メンバー一覧/作成
- `GET/PUT/PATCH/DELETE /api/members/{id}/` - メンバー詳細/更新/削除
- `GET/POST /api/projects/` - プロジェクト一覧/作成
- `GET/PUT/PATCH/DELETE /api/projects/{id}/` - プロジェクト詳細/更新/削除
- `GET /api/projects/{id}/attachments/` - プロジェクトの添付ファイル
- `GET /api/projects/{id}/comments/` - プロジェクトのコメント
- `GET /api/projects/dashboard_stats/` - ダッシュボード統計
- `GET/POST /api/tasks/` - タスク一覧/作成
- `GET/PUT/PATCH/DELETE /api/tasks/{id}/` - タスク詳細/更新/削除
- `GET /api/activities/` - アクティビティログ一覧

### API ドキュメント

- Swagger UI: `http://127.0.0.1:8000/api/docs/`
- ReDoc: `http://127.0.0.1:8000/api/redoc/`
- OpenAPI Schema: `http://127.0.0.1:8000/api/schema/`

### 管理画面

- Django Admin: `http://127.0.0.1:8000/admin/`

## フロントエンドとの統合

### CORS設定

フロントエンド（CoreX）のURLは`settings.py`の`CORS_ALLOWED_ORIGINS`に設定されています:

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Vite default port
    "http://localhost:3000",
]
```

### JWT認証フロー

1. ユーザー名とパスワードで `/api/auth/token/` にPOSTしてトークンを取得
2. レスポンスから `access` と `refresh` トークンを取得
3. APIリクエストのヘッダーに `Authorization: Bearer {access_token}` を含める
4. トークン期限切れ時は `refresh` トークンで `/api/auth/token/refresh/` から新しいトークンを取得

## データモデル

### Client (クライアント)
- 会社名、担当者名、連絡先、業種など

### Member (メンバー)
- ユーザー情報、役割、部署、スキルなど

### Project (案件)
- 案件名、説明、ステータス、優先度、予算、進捗など
- クライアントとの関連
- メンバーの割り当て

### Task (タスク)
- タイトル、説明、ステータス、優先度、期限など
- プロジェクトとの関連
- 担当者の割り当て

### ActivityLog (アクティビティログ)
- ユーザーアクション、説明、タイムスタンプ

## 開発

### マイグレーションの作成

モデルを変更した後:

```powershell
python manage.py makemigrations
python manage.py migrate
```

### 静的ファイルの収集

```powershell
python manage.py collectstatic
```

### テストの実行

```powershell
python manage.py test
```

## 本番環境へのデプロイ

### 環境変数の設定

- `DEBUG=False` に設定
- `SECRET_KEY` を安全なランダム文字列に変更
- `ALLOWED_HOSTS` に本番ドメインを追加
- データベース設定をPostgreSQLに変更

### Gunicornでの起動

```bash
gunicorn config.wsgi:application --bind 0.0.0.0:8000
```

## ライセンス

Proprietary - CoreX Project

## サポート

問題が発生した場合は、プロジェクトのIssueトラッカーに報告してください。
