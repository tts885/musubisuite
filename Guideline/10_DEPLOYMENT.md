# デプロイメントガイドライン

## 📋 目次
- [目的と適用範囲](#目的と適用範囲)
- [環境マトリクス](#環境マトリクス)
- [環境変数とシークレット管理](#環境変数とシークレット管理)
- [フロントエンドのビルドとデプロイ](#フロントエンドのビルドとデプロイ)
- [バックエンドのビルドとデプロイ](#バックエンドのビルドとデプロイ)
- [Power Apps と Dataverse のリリース手順](#power-apps-と-dataverse-のリリース手順)
- [CI/CD パイプライン標準](#cicd-パイプライン標準)
- [インフラストラクチャ構成指針](#インフラストラクチャ構成指針)
- [リリース運用とロールバック](#リリース運用とロールバック)
- [監視・ロギング・メトリクス](#監視ロギングメトリクス)
- [セキュリティとコンプライアンス](#セキュリティとコンプライアンス)
- [デプロイ前チェックリスト](#デプロイ前チェックリスト)

## 目的と適用範囲
- MusubiSuite (フロントエンド) と MusubiSuite Back (Django API)、ならびに Power Platform コンポーネントのデプロイメント標準を定義する。
- 手動／自動デプロイのいずれにも適用し、環境ごとの一貫性、トレーサビリティ、再現性を担保する。
- 本ガイドは Azure を標準ターゲットとし、他クラウドへ展開する場合も同等のコントロールを維持する。

## 環境マトリクス
| 環境 | 目的 | ホスティング | データベース | Power Platform | 認証 | ブランチ運用 |
|------|------|--------------|--------------|----------------|------|---------------|
| Development | 開発者の検証 | ローカル/VNet 内 Azure Static Web Apps (Preview) | SQLite/LocalDB | 試験用 Dataverse Sandbox | ローカル JWT (Debug) | feature/* |
| Staging | 統合テスト | Azure Static Web Apps (Standard) | Azure SQL Database (Basic) | Dataverse Sandbox | Azure AD B2C (Test) | develop | 
| Production | 本番運用 | Azure Static Web Apps (Standard/Enterprise) | Azure SQL Database (General Purpose) | Dataverse Production | Azure AD B2C (Prod) | main |

## 環境変数とシークレット管理
- 必ず `.env.*` ファイルまたは Azure App Configuration、Azure Key Vault で管理し、Git にはコミットしない。
- **命名規則**: フロントエンドは `VITE_` プレフィックスを付与。バックエンドは大文字スネークケース。
- **管理原則**:
  - ステージング以上は Key Vault を正とし、デプロイ時に参照させる。
  - シークレット更新時は チェンジログ を残し、影響システムに通知する。

### フロントエンド必須項目
```env
VITE_API_BASE_URL=https://{api-host}/api
VITE_APP_ENV=development|staging|production
VITE_AUTH_AUTHORITY=https://{b2c-tenant}.b2clogin.com
VITE_AUTH_CLIENT_ID=<public-client-id>
VITE_DATAVERSE_URL=https://{org}.crm.dynamics.com
```

### バックエンド必須項目
```env
SECRET_KEY=<django-secret>
DEBUG=false
ALLOWED_HOSTS=api.example.com
DATABASE_URL=postgresql://user:pass@host:5432/db
CORS_ALLOWED_ORIGINS=https://app.example.com
AZURE_TENANT_ID=<tenant-id>
AZURE_CLIENT_ID=<server-client-id>
AZURE_CLIENT_SECRET=<secret-from-key-vault>
POWER_PLATFORM_URL=https://{org}.crm.dynamics.com
```

## フロントエンドのビルドとデプロイ
1. 依存解決: `npm ci`
2. 型チェック: `npm run type-check`
3. Lint: `npm run lint`
4. ユニットテスト: `npm run test -- --coverage`
5. ビルド: `npm run build`
6. 成果物: `dist/` をアーティファクト化し、Static Web Apps へアップロード
7. CDN/キャッシュ: Static Web Apps のカスタムヘッダーで `Cache-Control` を設定し、ハッシュ化されたアセットを使用
8. エラーページ: `dist/404.html` を配置

## バックエンドのビルドとデプロイ
1. 仮想環境アクティベート: `python -m venv .venv && .\.venv\Scripts\Activate.ps1`
2. 依存解決: `pip install -r requirements.txt`
3. 静的解析: `ruff check .` (導入済みの場合)
4. テスト: `pytest --junitxml=reports/tests.xml`
5. マイグレーション作成: `python manage.py makemigrations --check`
6. マイグレーション適用: `python manage.py migrate`
7. Collectstatic: `python manage.py collectstatic --noinput`
8. WSGI パッケージング: Azure App Service を使用する場合は slot に配置し、`gunicorn config.wsgi --bind 0.0.0.0:$PORT` を起動コマンドに設定
9. SQLite からの移行: 本番は必ず Azure SQL を使用し、`manage.py dumpdata` / `loaddata` でデータ移行を行う

## Power Apps と Dataverse のリリース手順
1. Dataverse ソリューションをエクスポート (Managed)し、Git でバージョン管理 (Power Platform CLI `pac solution export`)
2. 新テーブル/列はまず Staging 環境で検証し、スキーマ変更を Pull Request にまとめる
3. Power Apps Canvas アプリはソリューションに含めて移送し、接続の再構成を行う
4. Dataverse プラグインや Power Automate フローがある場合、接続参照を用いて環境固有の接続文字列を分離
5. デプロイ後は Dataverse テーブルの権限ロールを再設定し、監査ログを確認

## CI/CD パイプライン標準
### 推奨 GitHub Actions ワークフロー構成
```yaml
name: deploy

on:
  push:
    branches: [ main, develop ]
  workflow_dispatch:

jobs:
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - working-directory: musubisuite
        run: |
          npm ci
          npm run lint
          npm run build
      - uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          app_location: musubisuite
          output_location: musubisuite/dist

  backend:
    runs-on: ubuntu-latest
    needs: frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: 3.11
      - working-directory: musubisuite_back
        run: |
          pip install -r requirements.txt
          python manage.py test
      - uses: azure/webapps-deploy@v2
        with:
          app-name: ${{ secrets.AZURE_WEBAPP_NAME }}
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: musubisuite_back
```
- Secrets は GitHub Environments を用い、環境ごとに分離する。
- CI が失敗したコミットはデプロイ禁止。

## インフラストラクチャ構成指針
- **フロントエンド**: Azure Static Web Apps + カスタムドメイン + HTTPS + Azure CDN
- **バックエンド API**: Azure App Service (Linux) または Azure Container Apps
- **データベース**: Azure SQL Database (Staging/Prod)、開発はローカル SQLite
- **ストレージ**: BLOB ストレージをメディアファイル用に確保。`AZURE_STORAGE_CONNECTION_STRING` を使用
- **ネットワーク**: App Service と SQL を同一 VNet に統合。IP 制限 + Private Endpoint を活用
- **監査**: Azure Monitor + Application Insights を全コンポーネントに有効化

## リリース運用とロールバック
1. **事前通知**: リリース 24 時間前に関係者へ通知
2. **デプロイ前ゲーティング**: テスト結果、セキュリティスキャン、アクセプタンスチェックが完了していること
3. **スロット戦略**: App Service は `staging` スロットにデプロイし、スワップで本番化
4. **ロールバック**:
   - フロントエンド: Static Web Apps の以前のリリースへロールバック
   - バックエンド: App Service スロットのスワップ逆実行
   - DB: Point-in-Time Restore (Azure SQL) を利用。マイグレーションは可逆的に設計
5. **リリースノート**: バージョン番号 (SemVer) と変更概要を `docs/releases/` に保管

## 監視・ロギング・メトリクス
- **Application Insights**: リクエスト、失敗、依存関係、トレースを収集。`APPINSIGHTS_INSTRUMENTATIONKEY` を設定
- **Log Analytics Workspace**: フロント/バックエンドのログを統合
- **メトリクス**:
  - API レイテンシー (p95 < 300ms)
  - エラーレート (< 1%)
  - Power Apps API 呼び出し成功率
  - DB DTU/CPU 利用率
- **アラート**: SLA 逸脱時に Teams/メールへ通知

## セキュリティとコンプライアンス
- 機密情報はすべて Key Vault で管理。マネージド ID を活用し、接続文字列をアプリ設定から排除
- TLS 1.2 以上を強制。Custom Domain には Azure-managed 証明書を適用
- App Service のデプロイスロットに IP 制限と Azure AD 認証を適用
- Static Web Apps の API 部に機能フラグを設置し、本番での未公開機能を制御
- セキュリティログを 90 日以上保持し、監査証跡を確保

## デプロイ前チェックリスト
- [ ] すべてのテストスイートが成功している
- [ ] Lint/型チェックが成功している
- [ ] マイグレーションが review 済みで可逆的である
- [ ] 環境変数とシークレットが最新である
- [ ] バージョン番号/リリースノートを更新した
- [ ] 監視アラート設定が有効である
- [ ] Power Apps/Dataverse の接続参照が環境に合わせて更新されている
- [ ] ロールバック手順を確認済みである

---
**Version**: 1.0.0  
**Last Updated**: 2025年11月14日
