import { Outlet, NavLink, useLocation } from "react-router-dom"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { 
  Calendar,
  ListTodo,
  Users,
  GitBranch,
  FolderKanban,
  Menu,
  X,
  ChevronRight
} from "lucide-react"
import AppSwitcher from "@/components/AppSwitcher"
import { useRouteTracker } from "@/hooks/use-route-tracker"

type LayoutProps = { showHeader?: boolean }

/**
 * プロジェクト管理アプリ用のナビゲーションアイテム
 * Plane風の現代的なUIデザインを採用
 */
const navItems = [
  { 
    path: "/project-management", 
    label: "スプリント", 
    description: "スプリント管理とタイムライン",
    icon: Calendar 
  },
  { 
    path: "/project-management/tasks", 
    label: "タスクボード", 
    description: "カンバンボードで管理",
    icon: ListTodo 
  },
  { 
    path: "/project-management/team", 
    label: "チーム", 
    description: "チームメンバー一覧",
    icon: Users 
  },
  { 
    path: "/project-management/repositories", 
    label: "リポジトリ", 
    description: "Git連携と管理",
    icon: GitBranch 
  },
]

/**
 * プロジェクト管理レイアウトコンポーネント
 * Plane風の現代的なWebUIデザインを採用
 * Wide表示を基本とし、コンパクト表示は使用しない
 */
export default function ProjectManagementLayout({ showHeader = true }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
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
      '/project-management': 'プロジェクト管理',
      '/project-management/tasks': 'タスクボード',
      '/project-management/team': 'チーム',
      '/project-management/repositories': 'リポジトリ',
    }
    
    // 現在のパスに対応する名前を取得
    const currentName = routeNames[location.pathname]
    
    // サブページの場合は親ページも表示
    if (currentName && location.pathname !== '/project-management') {
      return [
        { path: '/project-management', name: 'プロジェクト管理' },
        { path: location.pathname, name: currentName }
      ]
    }
    
    // トップレベルのページの場合は現在のページのみ表示
    return currentName ? [{ path: location.pathname, name: currentName }] : [{ path: '/project-management', name: 'プロジェクト管理' }]
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* App Switcher - Plane風の縦型アプリ切り替え */}
      <AppSwitcher />
      
      {/* Sidebar - Plane風の現代的なサイドバー (折りたたみ時はAppSwitcherと同じ幅) */}
      <aside 
        className={`
          bg-sidebar border-r border-sidebar-border
          transition-all duration-300 ease-in-out
          flex-shrink-0
          ${sidebarCollapsed ? 'w-16' : 'w-72'}
          fixed inset-y-0 left-16 z-40 lg:static
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header with Menu Button - 展開/折りたたみに対応 */}
          <div className={`border-b border-sidebar-border flex items-center ${sidebarCollapsed ? 'h-16 justify-center' : 'h-16 px-4 gap-3'}`}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? "サイドバーを展開" : "サイドバーを折りたたむ"}
              className="flex-shrink-0 hover:bg-sidebar-accent"
            >
              <Menu className="h-5 w-5" />
            </Button>
            {!sidebarCollapsed && (
              <>
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FolderKanban className="w-4 h-4 text-primary" />
                </div>
                <h1 className="text-lg font-bold text-foreground">プロジェクト管理</h1>
              </>
            )}
          </div>
          
          {/* Navigation - Plane風のナビゲーションスタイル */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={sidebarCollapsed ? `${item.label} - ${item.description}` : undefined}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
                    ${sidebarCollapsed ? 'justify-center' : ''}
                    ${isActive 
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm' 
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </NavLink>
              )
            })}
          </nav>

          {/* Footer - サイドバー下部の情報表示エリア */}
          <div className="p-4 border-t border-sidebar-border">
            {!sidebarCollapsed && (
              <div className="text-xs text-sidebar-foreground/50 space-y-1">
                <p className="font-medium">Project Management</p>
                <p>スプリントとタスク管理</p>
              </div>
            )}
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

      {/* Main Content - メインコンテンツエリア */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {showHeader && (
          <header className="h-16 border-b border-border flex items-center bg-background sticky top-0 z-30 shadow-sm">
            <div className="w-full px-8 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                {/* Mobile menu button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden hover:bg-accent"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>

                {/* Breadcrumbs - パンくずリスト */}
                <nav className="flex items-center gap-2 text-sm flex-1">
                  {breadcrumbs.map((crumb, index) => (
                    <div key={crumb.path} className="flex items-center gap-2">
                      {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      {index === breadcrumbs.length - 1 ? (
                        <span className="font-semibold text-foreground">{crumb.name}</span>
                      ) : (
                        <NavLink 
                          to={crumb.path}
                          className="text-muted-foreground hover:text-foreground transition-colors font-medium"
                        >
                          {crumb.name}
                        </NavLink>
                      )}
                    </div>
                  ))}
                </nav>
              </div>

              {/* Right section - ユーザーメニューなどの将来拡張用 */}
              <div className="flex items-center gap-2">
                {/* Placeholder for user menu */}
              </div>
            </div>
          </header>
        )}

        <main className="flex-1 overflow-auto bg-background">
          <div className="w-full h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
