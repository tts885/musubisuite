# Dataverse接続 - Power Apps SDK セットアップガイド

このガイドでは、Power Apps SDK (@microsoft/power-apps)を使用して、フロントエンドから直接Dataverseに接続する方法を説明します。

## 概要

公式のPower Apps Code AppsガイドラインB基づき、以下の方法でDataverse接続を実装します:

- ✅ **フロントエンド直接接続** - バックエンドプロキシ不要
- ✅ **Power Apps SDK使用** - `@microsoft/power-apps` npm パッケージ
- ✅ **PAC CLI統合** - データソース自動生成
- ✅ **型安全** - TypeScript型定義自動生成
- ✅ **公式サポート** - Microsoft公式ガイドライン準拠

## 前提条件

- [x] Power Apps Code Apps SDK (`@microsoft/power-apps`) - インストール済み ✅
- [x] PAC CLI バージョン 1.46以降 - インストール済み ✅
- [ ] Dataverseが有効になっている Power Platform 環境
- [ ] PAC CLIで環境に接続済み

## セットアップ手順

### 1. PAC CLI環境接続の確認

既に認証済みです:

```powershell
# 認証プロファイルを確認
pac auth list

# 出力例:
# Index Active Kind      Name User                         Cloud  Type
# [1]   *      UNIVERSAL      guangdong.chen@accenture.com Public OperatingSystem
```

別の環境に接続する場合:

```powershell
pac auth create --environment <your-environment-url>
```

### 2. Dataverseテーブルをデータソースとして追加

テーブルをデータソースとして追加すると、サービスとモデルが自動生成されます。

```powershell
cd CoreX

# 標準テーブル(account)を追加
pac code add-data-source -a dataverse -t account

# カスタムテーブルを追加
pac code add-data-source -a dataverse -t cr123_project
```

#### 生成されるファイル

```
CoreX/src/
└── generated/
    ├── services/
    │   └── AccountsService.ts    # CRUD操作用サービス
    └── models/
        └── AccountsModel.ts       # 型定義
```

### 3. 生成されたサービスの使用

#### 初期化確認

`App.tsx`で既にPower Apps SDKを初期化しています:

```typescript
import { PowerProvider } from "./providers/power-provider";

export default function App() {
  return (
    <PowerProvider>
      {/* 他のプロバイダー */}
    </PowerProvider>
  );
}
```

#### レコードの取得

```typescript
import { useEffect, useState } from 'react';
import { AccountsService } from './generated/services/AccountsService';
import type { Accounts } from './generated/models/AccountsModel';

function AccountsList() {
  const [accounts, setAccounts] = useState<Accounts[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const result = await AccountsService.getAll({
          select: ['name', 'accountnumber', 'address1_city'],
          filter: "address1_country eq 'Japan'",
          orderBy: ['name asc'],
          top: 50
        });
        
        if (result.data) {
          setAccounts(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch accounts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  if (loading) return <div>読み込み中...</div>;

  return (
    <ul>
      {accounts.map(account => (
        <li key={account.accountid}>
          {account.name} - {account.accountnumber}
        </li>
      ))}
    </ul>
  );
}
```

#### レコードの作成

```typescript
import { AccountsService } from './generated/services/AccountsService';
import type { Accounts } from './generated/models/AccountsModel';

async function createAccount() {
  const newAccount = {
    name: "新規取引先企業",
    accountnumber: "ACC001",
    address1_country: "Japan"
  };

  try {
    const result = await AccountsService.create(newAccount as Omit<Accounts, 'accountid'>);
    
    if (result.data) {
      console.log('Account created:', result.data);
      return result.data;
    }
  } catch (error) {
    console.error('Failed to create account:', error);
    throw error;
  }
}
```

#### 特定のレコード取得

```typescript
async function getAccount(accountId: string) {
  try {
    const result = await AccountsService.get(accountId);
    if (result.data) {
      console.log('Account:', result.data);
      return result.data;
    }
  } catch (error) {
    console.error('Failed to get account:', error);
  }
}
```

#### レコードの更新

```typescript
async function updateAccount(accountId: string) {
  const changes = {
    name: "更新された取引先企業名",
    telephone1: "03-1234-5678"
  };

  try {
    await AccountsService.update(accountId, changes);
    console.log('Account updated successfully');
  } catch (error) {
    console.error('Failed to update account:', error);
  }
}
```

#### レコードの削除

```typescript
async function deleteAccount(accountId: string) {
  try {
    await AccountsService.delete(accountId);
    console.log('Account deleted successfully');
  } catch (error) {
    console.error('Failed to delete account:', error);
  }
}
```

## アプリケーションの起動

Power Apps Code Appsとして実行する必要があります:

```powershell
cd CoreX

# Power Apps環境で起動
pac code run
```

または、package.jsonのスクリプトを使用:

```powershell
npm run dev:pac
```

## 接続テスト機能の更新

接続テストページは既に実装済みです。以下の方法でテストできます:

1. `pac code run`でアプリを起動
2. **Settings** → **Power Platform接続** に移動
3. **Dataverse設定** タブを選択
4. 環境URLを入力
5. **接続テスト** ボタンをクリック

### 期待される動作

Power Apps環境で実行されている場合:
- ✅ Power Appsコンテキストが取得される
- ✅ 環境情報(ID、URL、組織名)が表示される
- ✅ 接続成功メッセージ

Power Apps環境外で実行されている場合:
- ⚠️ 「Power Apps環境に接続されていません」エラー
- 💡 `pac code run`で起動するよう案内

## サポートされるシナリオ

### ✅ サポート済み

- レコードのCRUD操作(Create, Read, Update, Delete)
- ODataクエリ機能:
  - `filter` - 条件フィルタリング
  - `select` - フィールド選択
  - `orderBy` - ソート
  - `top` - 件数制限
- ページネーション
- 型安全なTypeScript統合

### ❌ 未サポート

- オプションセットの書式設定値
- ルックアップフィールド(多態性ルックアップ含む)
- Dataverseアクションと関数
- FetchXML
- 代替キー
- スキーマ定義CRUD

## トラブルシューティング

### エラー: "Power Apps環境に接続されていません"

**原因**: `pac code run`で起動していない

**解決方法**:
```powershell
cd CoreX
pac code run
```

### エラー: "pac command not found"

**原因**: PAC CLIがインストールされていない

**解決方法**:
```powershell
# PAC CLIをインストール
dotnet tool install --global Microsoft.PowerApps.CLI.Tool
```

### データソース追加エラー

**原因**: テーブルが存在しない、または権限がない

**解決方法**:
1. Power Platform管理センターでテーブルの存在を確認
2. ユーザーに適切なセキュリティロールが割り当てられているか確認
3. 接続している環境が正しいか確認

```powershell
# 現在の接続を確認
pac auth list

# 別の環境に切り替え
pac auth select --index 1
```

### 型エラー: "Cannot find module './generated/services/...'"

**原因**: `pac code add-data-source`を実行していない

**解決方法**:
```powershell
cd CoreX
pac code add-data-source -a dataverse -t account
```

## ベストプラクティス

### 1. 必要なフィールドのみ選択

```typescript
// ❌ 悪い例 - 全フィールド取得
const accounts = await AccountsService.getAll();

// ✅ 良い例 - 必要なフィールドのみ
const accounts = await AccountsService.getAll({
  select: ['name', 'accountnumber']
});
```

### 2. エラーハンドリング

```typescript
try {
  const result = await AccountsService.getAll();
  if (result.data) {
    // 成功時の処理
  }
} catch (error) {
  console.error('Error:', error);
  // エラー処理
}
```

### 3. 初期化確認

```typescript
useEffect(() => {
  const init = async () => {
    try {
      await initialize(); // Power Apps SDK初期化
      setIsInitialized(true);
    } catch (err) {
      setError('Failed to initialize Power Apps SDK');
    }
  };
  init();
}, []);

useEffect(() => {
  if (!isInitialized) return; // 初期化完了まで待機
  // データ取得処理
}, [isInitialized]);
```

## 参考資料

- [Power Apps Code Apps - Dataverse接続 (公式)](https://learn.microsoft.com/ja-jp/power-apps/developer/code-apps/how-to/connect-to-dataverse)
- [Power Apps SDK (@microsoft/power-apps)](https://www.npmjs.com/package/@microsoft/power-apps)
- [PAC CLI リファレンス](https://learn.microsoft.com/ja-jp/power-platform/developer/cli/introduction)
- [Dataverse Web API リファレンス](https://learn.microsoft.com/ja-jp/power-apps/developer/data-platform/webapi/overview)

## まとめ

✅ **完了した作業**:
- Python/Djangoプロキシ実装を削除
- Power Apps SDKセットアップ確認
- DataverseAdminServiceを新実装に更新
- 接続テスト機能の更新
- ドキュメント作成

⏳ **次のステップ**:
1. `pac code add-data-source`でテーブル追加
2. `pac code run`でアプリ起動
3. 接続テスト実行
4. 生成されたサービスを使用してCRUD操作実装

公式ガイドラインに従った実装により、よりシンプルで保守しやすいアーキテクチャになりました! 🎉
