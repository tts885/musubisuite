/**
 * PageFooter - ページフッター共通コンポーネント
 * 
 * アプリケーション全体で使用される統一されたページフッターコンポーネント。
 * 著作権表示、リンク、バージョン情報などを表示します。
 * 
 * @module components/shared/PageFooter
 */

import type { ReactNode } from 'react'

/**
 * PageFooterコンポーネントのプロパティ
 */
interface PageFooterProps {
  /**
   * フッターの左側に表示する内容
   * 通常は著作権表示や会社名
   */
  leftContent?: ReactNode
  
  /**
   * フッターの右側に表示する内容
   * 通常はバージョン情報やリンク
   */
  rightContent?: ReactNode
  
  /**
   * 追加のCSSクラス名
   */
  className?: string
}

/**
 * PageFooterコンポーネント
 * 
 * アプリケーション全体で統一されたページフッターを提供します。
 * 
 * @component
 * @example
 * ```tsx
 * <PageFooter
 *   leftContent={<span>© 2025 CoreXverse</span>}
 *   rightContent={<span>v1.0.0</span>}
 * />
 * ```
 */
export function PageFooter({ 
  leftContent = <span>© 2025 CoreXverse. All rights reserved.</span>, 
  rightContent = <span>Powered by CoreXverse</span>,
  className = '' 
}: PageFooterProps) {
  return (
    <footer className={`border-t bg-card px-8 py-3 flex-shrink-0 ${className}`}>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div>{leftContent}</div>
        <div>{rightContent}</div>
      </div>
    </footer>
  )
}
