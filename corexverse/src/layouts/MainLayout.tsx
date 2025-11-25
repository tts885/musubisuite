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

interface Breadcrumb {
  path: string
  name: string
}

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
  /** サイドバーの折りたたみ状態 (デスクトップ用) */
  sidebarCollapsed?: boolean
  /** ヘッダーを表示するか */
  showHeader?: boolean
  /** パンくずリスト */
  breadcrumbs?: Breadcrumb[]
  /** フッター左側コンテンツ */
  footerLeftContent?: ReactNode
  /** フッター右側コンテンツ */
  footerRightContent?: ReactNode
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
  sidebarCollapsed = false,
  showHeader = true,
  breadcrumbs = [],
  footerLeftContent,
  footerRightContent,
}: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(defaultSidebarOpen)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* App Switcher - 左端の縦型ナビゲーション */}
      <AppSwitcher />

      {/* Sidebar - アプリケーション固有のサイドバー */}
      <aside
        className={`
          ${sidebarCollapsed ? 'w-16' : 'w-72'}
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
          <div className={`h-[52px] px-4 border-t bg-card text-xs text-muted-foreground flex items-center gap-4 flex-shrink-0 ${sidebarCollapsed ? 'justify-center' : ''}`}>
            {!sidebarCollapsed && (sidebarFooter || <span>CoreXverse v1.0</span>)}
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

        {/* Desktop Header - デスクトップ時のヘッダー (パンくずリスト) */}
        {showHeader && breadcrumbs && breadcrumbs.length > 0 && (
          <header className="hidden lg:flex h-16 border-b border-border items-center bg-background px-8">
            <nav className="flex items-center gap-2 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.path} className="flex items-center gap-2">
                  {index > 0 && <span className="text-muted-foreground">/</span>}
                  {index === breadcrumbs.length - 1 ? (
                    <span className="font-semibold text-foreground">{crumb.name}</span>
                  ) : (
                    <a 
                      href={crumb.path}
                      className="text-muted-foreground hover:text-foreground transition-colors font-medium"
                    >
                      {crumb.name}
                    </a>
                  )}
                </div>
              ))}
            </nav>
          </header>
        )}

        {/* Page Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto">
            {children}
          </div>
          {/* Page Footer - ページフッター (オプション) */}
          {pageFooter ? pageFooter : (footerLeftContent || footerRightContent) && (
            <footer className="h-[52px] border-t border-border bg-card px-8 flex items-center">
              <div className="flex items-center justify-between text-xs text-muted-foreground w-full">
                <div>{footerLeftContent}</div>
                <div>{footerRightContent}</div>
              </div>
            </footer>
          )}
        </div>
      </main>
    </div>
  )
}
