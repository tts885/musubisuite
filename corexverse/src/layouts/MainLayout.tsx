/**
 * メインレイアウトコンポーネント
 * 
 * アプリケーション全体の共通レイアウトを提供します。
 * - AppSwitcher (左端の縦型ナビゲーション)
 * - Sidebar (各アプリケーション固有のサイドバー)
 * - Header (ページヘッダー)
 * - Footer (サイドバーフッター)
 * - Main Content (メインコンテンツエリア)
 * 
 * @component
 */

import { useState } from 'react'
import type { ReactNode } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import AppSwitcher from '@/components/AppSwitcher'

interface MainLayoutProps {
  /** サイドバーの内容 */
  sidebar: ReactNode
  /** サイドバーフッターの内容 (省略時はデフォルト) */
  sidebarFooter?: ReactNode
  /** ページフッターの内容 (省略時はフッターなし) */
  pageFooter?: ReactNode
  /** メインコンテンツ */
  children: ReactNode
  /** サイドバーの初期表示状態 (モバイル用) */
  defaultSidebarOpen?: boolean
}

/**
 * メインレイアウトコンポーネント
 * 
 * @example
 * ```tsx
 * <MainLayout
 *   sidebar={<OcrSidebar />}
 *   sidebarFooter={<span>OCR Engine: Azure AI</span>}
 * >
 *   <YourPageContent />
 * </MainLayout>
 * ```
 */
export default function MainLayout({
  sidebar,
  sidebarFooter,
  pageFooter,
  children,
  defaultSidebarOpen = false,
}: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(defaultSidebarOpen)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* App Switcher - 左端の縦型ナビゲーション */}
      <AppSwitcher />

      {/* Sidebar - アプリケーション固有のサイドバー */}
      <aside
        className={`
          w-72
          bg-sidebar border-r border-sidebar-border 
          transition-all duration-300 ease-in-out
          flex-shrink-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          fixed lg:relative
          inset-y-0 left-16 lg:left-0
          z-40
        `}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto">
            {sidebar}
          </div>

          {/* Footer - サイドバー下部の情報表示エリア */}
          <div className="px-4 py-3 border-t bg-card text-xs text-muted-foreground flex items-center gap-4 flex-shrink-0">
            {sidebarFooter || <span>CoreXverse v1.0</span>}
          </div>
        </div>
      </aside>

      {/* Mobile overlay - モバイル表示時のオーバーレイ */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Mobile Header - モバイル時のヘッダー (ハンバーガーメニュー) */}
        <div className="lg:hidden flex items-center h-16 px-4 border-b border-border bg-card">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="ml-4 text-lg font-semibold">CoreXverse</h1>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto">
            {children}
          </div>
          {/* Page Footer - ページフッター (オプション) */}
          {pageFooter && pageFooter}
        </div>
      </main>
    </div>
  )
}
