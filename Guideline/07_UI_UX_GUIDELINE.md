# UI/UXガイドライン

## 📋 目次
- [デザイン原則](#デザイン原則)
- [デザインシステム](#デザインシステム)
- [コンポーネントライブラリ](#コンポーネントライブラリ)
- [レイアウト設計](#レイアウト設計)
- [カラーシステム](#カラーシステム)
- [タイポグラフィ](#タイポグラフィ)
- [アクセシビリティ](#アクセシビリティ)
- [レスポンシブデザイン](#レスポンシブデザイン)

## デザイン原則

### 1. 一貫性（Consistency）
すべてのページで統一されたデザイン言語を使用

### 2. 明瞭性（Clarity）
ユーザーが直感的に理解できるインターフェース

### 3. フィードバック（Feedback）
すべてのアクションに対して適切なフィードバックを提供

### 4. 効率性（Efficiency）
最小限のクリックで目的を達成できる設計

### 5. 許容性（Forgiveness）
エラーを防ぎ、簡単に回復できる仕組み

## デザインシステム

### Shadcn/ui ベース

本プロジェクトは**Shadcn/ui**をベースとしたデザインシステムを採用

#### 特徴
- **Radix UIプリミティブ**: アクセシブルな基盤
- **Tailwind CSS**: ユーティリティファーストスタイリング
- **カスタマイズ可能**: プロジェクトに合わせた調整が容易
- **コピー&ペースト**: コンポーネントをプロジェクトに直接追加

#### コンポーネントのインストール

```powershell
# 個別コンポーネント追加
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add form

# 複数コンポーネント同時追加
npx shadcn-ui@latest add button card dialog form input label
```

## コンポーネントライブラリ

### 基本コンポーネント

#### Button（ボタン）
```typescript
import { Button } from '@/components/ui/button';

// バリアント
<Button variant="default">Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// サイズ
<Button size="default">Default</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Icon /></Button>

// 状態
<Button disabled>Disabled</Button>
<Button loading>Loading...</Button>
```

#### Card（カード）
```typescript
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>プロジェクト名</CardTitle>
    <CardDescription>プロジェクトの説明</CardDescription>
  </CardHeader>
  <CardContent>
    <p>コンテンツ</p>
  </CardContent>
  <CardFooter>
    <Button>アクション</Button>
  </CardFooter>
</Card>
```

#### Dialog（ダイアログ）
```typescript
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

<Dialog>
  <DialogTrigger asChild>
    <Button>ダイアログを開く</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>タイトル</DialogTitle>
      <DialogDescription>説明</DialogDescription>
    </DialogHeader>
    <div>{/* コンテンツ */}</div>
  </DialogContent>
</Dialog>
```

#### Form（フォーム）
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const form = useForm({
  resolver: zodResolver(projectSchema),
  defaultValues: {
    name: '',
    description: '',
  },
});

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="name"
      render={({ field }) => (
        <FormItem>
          <FormLabel>プロジェクト名</FormLabel>
          <FormControl>
            <Input placeholder="プロジェクト名を入力" {...field} />
          </FormControl>
          <FormDescription>
            プロジェクトの名称を入力してください
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
    <Button type="submit">作成</Button>
  </form>
</Form>
```

### 通知・フィードバック

#### Toast（Sonner）
```typescript
import { toast } from 'sonner';

// 成功
toast.success('プロジェクトを作成しました');

// エラー
toast.error('作成に失敗しました');

// 情報
toast.info('処理中です...');

// 警告
toast.warning('この操作は取り消せません');

// カスタム
toast('カスタムメッセージ', {
  description: '詳細情報',
  action: {
    label: 'やり直す',
    onClick: () => retry(),
  },
});

// Promise
toast.promise(createProject(data), {
  loading: '作成中...',
  success: 'プロジェクトを作成しました',
  error: '作成に失敗しました',
});
```

#### Loading States
```typescript
// スピナー
import { Loader2 } from 'lucide-react';

<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  処理中...
</Button>

// スケルトン
import { Skeleton } from '@/components/ui/skeleton';

<div className="space-y-2">
  <Skeleton className="h-4 w-[250px]" />
  <Skeleton className="h-4 w-[200px]" />
</div>
```

## レイアウト設計

### グリッドシステム

```typescript
// Flexboxレイアウト
<div className="flex items-center justify-between">
  <div>左</div>
  <div>右</div>
</div>

// Gridレイアウト
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card />
  <Card />
  <Card />
</div>

// コンテナ
<div className="container mx-auto px-4 py-6">
  {/* コンテンツ */}
</div>
```

### スペーシング

```typescript
// マージン
m-0  m-1  m-2  m-4  m-6  m-8  m-12  m-16

// パディング
p-0  p-1  p-2  p-4  p-6  p-8  p-12  p-16

// ギャップ
gap-0  gap-1  gap-2  gap-4  gap-6  gap-8

// 推奨スペーシングスケール
- 基本単位: 4px (0.25rem)
- 小: 8px (0.5rem)
- 中: 16px (1rem)
- 大: 24px (1.5rem)
- 特大: 32px (2rem)
```

## カラーシステム

### テーマカラー

```css
/* globals.css */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... */
}
```

### カラー使用例

```typescript
// 背景色
<div className="bg-background">
<div className="bg-card">
<div className="bg-primary">

// テキスト色
<p className="text-foreground">
<p className="text-muted-foreground">
<p className="text-primary">

// ボーダー
<div className="border border-border">
```

### セマンティックカラー

```typescript
// 成功
<div className="bg-green-500 text-white">

// エラー
<div className="bg-destructive text-destructive-foreground">

// 警告
<div className="bg-yellow-500 text-white">

// 情報
<div className="bg-blue-500 text-white">
```

## タイポグラフィ

### フォントファミリー

```css
/* globals.css */
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", 
               Roboto, "Helvetica Neue", Arial, sans-serif;
}

code, pre {
  font-family: "Courier New", Courier, monospace;
}
```

### テキストスタイル

```typescript
// 見出し
<h1 className="text-4xl font-bold">見出し1</h1>
<h2 className="text-3xl font-semibold">見出し2</h2>
<h3 className="text-2xl font-medium">見出し3</h3>

// 本文
<p className="text-base">通常テキスト</p>
<p className="text-sm text-muted-foreground">小さいテキスト</p>

// 強調
<strong className="font-semibold">太字</strong>
<em className="italic">斜体</em>

// リンク
<a className="text-primary underline hover:text-primary/80">
  リンク
</a>
```

### テキストサイズスケール

```
text-xs   (0.75rem / 12px)
text-sm   (0.875rem / 14px)
text-base (1rem / 16px)
text-lg   (1.125rem / 18px)
text-xl   (1.25rem / 20px)
text-2xl  (1.5rem / 24px)
text-3xl  (1.875rem / 30px)
text-4xl  (2.25rem / 36px)
```

## アクセシビリティ

### WCAG 2.1 AA準拠

#### 1. キーボードナビゲーション
```typescript
// フォーカス可能な要素
<button className="focus:outline-none focus:ring-2 focus:ring-ring">
  ボタン
</button>

// タブインデックス
<div tabIndex={0}>フォーカス可能</div>
```

#### 2. セマンティックHTML
```typescript
// ✅ 適切なHTML要素
<nav>
  <ul>
    <li><a href="/projects">プロジェクト</a></li>
  </ul>
</nav>

<main>
  <article>
    <h1>タイトル</h1>
    <p>コンテンツ</p>
  </article>
</main>

// ❌ 避けるべき
<div onClick={handleClick}>ボタン</div> // buttonを使用
```

#### 3. ARIA属性
```typescript
// ラベル
<button aria-label="閉じる">
  <X />
</button>

// 説明
<input
  type="text"
  aria-describedby="email-description"
/>
<p id="email-description">メールアドレスを入力してください</p>

// 状態
<button aria-pressed={isActive}>
  トグル
</button>

// ライブリージョン
<div role="alert" aria-live="assertive">
  エラーメッセージ
</div>
```

#### 4. カラーコントラスト
```
最小コントラスト比:
- 通常テキスト: 4.5:1
- 大きいテキスト: 3:1
- UIコンポーネント: 3:1
```

#### 5. 代替テキスト
```typescript
// 画像
<img src="logo.png" alt="MusubiSuite ロゴ" />

// アイコン（装飾的）
<ChevronRight aria-hidden="true" />

// アイコン（意味あり）
<Search aria-label="検索" />
```

## レスポンシブデザイン

### ブレークポイント

```typescript
// Tailwind CSSブレークポイント
sm: 640px   // タブレット縦
md: 768px   // タブレット横
lg: 1024px  // デスクトップ小
xl: 1280px  // デスクトップ大
2xl: 1536px // デスクトップ特大
```

### レスポンシブユーティリティ

```typescript
// モバイルファースト
<div className="
  text-sm        // モバイル: 14px
  md:text-base   // タブレット: 16px
  lg:text-lg     // デスクトップ: 18px
">

// グリッド
<div className="
  grid
  grid-cols-1      // モバイル: 1列
  md:grid-cols-2   // タブレット: 2列
  lg:grid-cols-3   // デスクトップ: 3列
  gap-4
">

// 表示/非表示
<div className="hidden md:block">
  デスクトップのみ表示
</div>

<div className="block md:hidden">
  モバイルのみ表示
</div>
```

### モバイル最適化

```typescript
// タッチターゲット最小サイズ: 44x44px
<button className="min-h-[44px] min-w-[44px] p-2">
  <Icon />
</button>

// スクロール可能なコンテンツ
<div className="overflow-x-auto">
  <table className="min-w-full">
    {/* ... */}
  </table>
</div>

// モバイルメニュー
<Sheet>
  <SheetTrigger asChild>
    <Button variant="ghost" size="icon">
      <Menu />
    </Button>
  </SheetTrigger>
  <SheetContent>
    <nav>{/* メニュー項目 */}</nav>
  </SheetContent>
</Sheet>
```

### パフォーマンス

```typescript
// 画像最適化
<img
  src="image.jpg"
  alt="説明"
  loading="lazy"
  width={400}
  height={300}
/>

// コンテンツの遅延読み込み
import { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

<Suspense fallback={<LoadingSpinner />}>
  <HeavyComponent />
</Suspense>
```

---

**Version**: 1.0.0  
**Last Updated**: 2025年11月14日
