import { Outlet, useLocation } from "react-router-dom"
import { useState, useEffect } from "react"
import MainLayout from "@/layouts/MainLayout"
import MatterManagementSidebar from "@/components/MatterManagementSidebar"
import { useRouteTracker } from "@/hooks/use-route-tracker"

type LayoutProps = { showHeader?: boolean }

/**
 * 案件管理レイアウトコンポーネント
 * MainLayoutを使用した統一されたレイアウト
 */
export default function Layout({ showHeader = true }: LayoutProps) {
  // localStorageから初期状態を読み込み、デフォルトはfalse(展開)
  // 全アプリで共通のキーを使用
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('app-sidebar-collapsed')
    return saved ? JSON.parse(saved) : false
  })
  const location = useLocation()
  
  // ルート追跡機能を有効化
  useRouteTracker()

  // サイドバーの状態が変更されたらlocalStorageに保存
  // 全アプリで共通のキーを使用して状態を共有
  useEffect(() => {
    localStorage.setItem('app-sidebar-collapsed', JSON.stringify(sidebarCollapsed))
  }, [sidebarCollapsed])

  /**
   * パンくずリストの生成
   * 現在のルートに基づいて適切なパンくずリストを返す
   */
  const getBreadcrumbs = () => {
    const routeNames: Record<string, string> = {
      '/dashboard': 'ダッシュボード',
      '/dashboard/projects': '案件一覧',
    }
    
    // 現在のパスに対応する名前を取得
    const currentName = routeNames[location.pathname]
    
    // サブページの場合は親ページも表示
    if (currentName && location.pathname !== '/dashboard') {
      return [
        { path: '/dashboard', name: 'ダッシュボード' },
        { path: location.pathname, name: currentName }
      ]
    }
    
    // トップレベルのページの場合は現在のページのみ表示
    return currentName ? [{ path: location.pathname, name: currentName }] : [{ path: '/dashboard', name: 'ダッシュボード' }]
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <MainLayout
      sidebar={
        <MatterManagementSidebar
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
        />
      }
      sidebarCollapsed={sidebarCollapsed}
      sidebarFooter={<span>CoreXverse v1.0 © 2025 All rights reserved</span>}
      showHeader={showHeader}
      breadcrumbs={breadcrumbs}
      footerLeftContent={<span>© 2025 CoreXverse - 案件管理システム</span>}
      footerRightContent={<span>Powered by CoreXverse</span>}
    >
      <Outlet />
    </MainLayout>
  )
}