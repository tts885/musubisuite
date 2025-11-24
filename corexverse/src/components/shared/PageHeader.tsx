/**
 * PageHeader - ページヘッダー共通コンポーネント
 * 
 * 案件管理、プロジェクト管理、OCR管理などの一覧画面で使用される
 * 統一されたページヘッダーコンポーネント
 * 
 * @module components/shared/PageHeader
 */

import type { ReactNode } from 'react'

/**
 * PageHeaderコンポーネントのプロパティ
 */
interface PageHeaderProps {
  /**
   * ページタイトル（例: "案件一覧", "プロジェクト一覧", "ドキュメント"）
   */
  title: string
  
  /**
   * 説明文（例: "全50件の案件を管理"）
   * オプショナル - 指定しない場合は表示されません
   */
  description?: string | ReactNode
  
  /**
   * ヘッダー右側に配置するアクション要素
   * 通常は「新規作成」ボタンなど
   */
  action?: ReactNode
  
  /**
   * 追加のCSSクラス名
   */
  className?: string
}

/**
 * PageHeaderコンポーネント
 * 
 * アプリケーション全体で統一されたページヘッダーを提供します。
 * 
 * @component
 * @example
 * ```tsx
 * <PageHeader
 *   title="案件一覧"
 *   description={
 *     <>
 *       全<span className="font-semibold text-foreground">{count}</span>件の案件を管理
 *     </>
 *   }
 *   action={
 *     <Button onClick={handleCreate}>
 *       <Plus className="mr-2 h-5 w-5" />
 *       新規案件
 *     </Button>
 *   }
 * />
 * ```
 */
export function PageHeader({ title, description, action, className = '' }: PageHeaderProps) {
  return (
    <div className={`flex items-start justify-between ${className}`}>
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="text-lg text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  )
}
