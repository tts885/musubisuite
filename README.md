# CoreX - 案件管理システム

Modern project management system built with React, TypeScript, and Tailwind CSS for Power Apps.

---

## 概要

CoreXは、案件管理を効率化するためのWebアプリケーションです。FluentSampleの設計パターンを参考に、Shadcn/uiコンポーネントライブラリを使用して構築されています。

## 主な機能

### 🎯 ダッシュボード
- プロジェクトの統計情報表示
- アクティブな案件の進捗確認
- 最近のアクティビティ表示
- ステータス別案件分布チャート

### 📁 案件管理
- 案件の一覧表示とフィルタリング
- DataGridによる高度な検索・ソート機能
- ステータス・優先度別フィルター
- 案件詳細情報の表示
- タスク管理とメンバー割り当て

### 👥 メンバー管理
- チームメンバーの一覧表示
- スキルセットの管理
- 役割と権限の表示

### 🏢 クライアント管理
- クライアント情報の管理
- 連絡先情報の表示
- 関連案件の表示

---

## 技術スタック

### Core
- **Framework**: React 19 + TypeScript
- **Routing**: React Router v7
- **Styling**: Tailwind CSS v4
- **Build Tool**: Vite 7
- **Power Platform**: Power Apps SDK

### UI & Components
- **UI Library**: Shadcn/ui (Radix UI)
- **Icons**: Lucide React
- **Data Visualization**: Recharts
- **Table**: TanStack Table v8

### State & Data
- **State Management**: TanStack Query v5
- **Form Handling**: React Hook Form (ready to add)

---

## セットアップ

### 前提条件
- Node.js 18+
- npm または yarn
- Power Apps CLI (オプション)

### インストール

```bash
# 依存パッケージのインストール
npm install

# 開発サーバーの起動
npm run dev

# ビルド
npm run build
```

## プロジェクト構造

```
CoreX/
├── src/
│   ├── components/ui/       # Shadcn/ui コンポーネント
│   ├── data/mockData.ts     # モックデータ
│   ├── pages/               # ページコンポーネント
│   │   ├── dashboard.tsx
│   │   ├── projects.tsx
│   │   ├── project-detail.tsx
│   │   ├── members.tsx
│   │   └── clients.tsx
│   ├── types/index.ts       # TypeScript型定義
│   └── router.tsx           # ルーティング
└── README.md
```

## API統合

現在はモックデータを使用していますが、実際のAPI統合のための準備が整っています。
`src/data/mockData.ts` を実際のAPI呼び出しに置き換えることで統合可能です。

## 参考プロジェクト

- **FluentSample**: レイアウトとナビゲーション設計