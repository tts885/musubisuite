/**
 * 設定ページ (メインレイアウト)
 * 
 * システムの設定と管理を一元化するページです。
 * サイドバーナビゲーションで各設定セクションに切り替えます。
 * 
 * @module pages/settings
 */

import { useState, useEffect } from "react"
import { Link, Outlet, useLocation } from "react-router-dom"
import { 
  Settings as SettingsIcon,
  Users,
  Building2,
  Shield,
  Bell,
  Palette,
  Database,
  Plug,
  FileText,
  Info,
  Menu,
  Brain,
  List
} from "lucide-react"
import { cn } from "@/lib/utils"
import AppSwitcher from "@/components/AppSwitcher"
import { Button } from "@/components/ui/button"

/**
 * ナビゲーション項目の型定義
 */
interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}

/**
 * ナビゲーションセクションの型定義
 */
interface NavSection {
  title: string
  items: NavItem[]
}

/**
 * 設定ページのナビゲーション構成
 */
const navigationSections: NavSection[] = [
  {
    title: "マスタ管理",
    items: [
      {
        title: "ユーザー管理",
        href: "/settings/users",
        icon: Users,
        description: "システムユーザーの作成、編集、権限管理"
      },
      {
        title: "クライアント管理",
        href: "/settings/clients",
        icon: Building2,
        description: "クライアント情報の管理"
      },
      {
        title: "契約管理",
        href: "/settings/contracts",
        icon: FileText,
        description: "クライアントの契約情報を管理"
      },
      {
        title: "コードマスタ管理",
        href: "/settings/codemasters",
        icon: List,
        description: "ドロップダウンリスト項目の管理"
      }
    ]
  },
  {
    title: "システム設定",
    items: [
      {
        title: "AI設定",
        href: "/settings/ai",
        icon: Brain,
        description: "AI機能の設定と管理"
      },
      {
        title: "認証・セキュリティ",
        href: "/settings/security",
        icon: Shield,
        description: "認証設定とセキュリティ管理"
      },
      {
        title: "通知設定",
        href: "/settings/notifications",
        icon: Bell,
        description: "通知の設定と管理"
      },
      {
        title: "外観・テーマ",
        href: "/settings/appearance",
        icon: Palette,
        description: "テーマとUI設定"
      }
    ]
  },
  {
    title: "統合設定",
    items: [
      {
        title: "Dataverse接続",
        href: "/settings/dataverse",
        icon: Database,
        description: "Dataverse接続設定"
      },
      {
        title: "API設定",
        href: "/settings/api",
        icon: Plug,
        description: "API接続と設定"
      }
    ]
  },
  {
    title: "その他",
    items: [
      {
        title: "システムログ",
        href: "/settings/logs",
        icon: FileText,
        description: "システムログの表示"
      },
      {
        title: "バージョン情報",
        href: "/settings/about",
        icon: Info,
        description: "アプリケーション情報"
      }
    ]
  }
]

/**
 * 設定ページコンポーネント
 * 
 * サイドバーナビゲーション付きのレイアウトを提供します。
 * 各設定セクションは Outlet でレンダリングされます。
 * 
 * @component
 * @returns {JSX.Element} 設定ページ
 * 
 * @example
 * ```tsx
 * // router.tsx
 * {
 *   path: "settings",
 *   element: <SettingsPage />,
 *   children: [
 *     { path: "users", element: <UsersSettingsPage /> },
 *     { path: "clients", element: <ClientsSettingsPage /> }
 *   ]
 * }
 * ```
 * 
 * @remarks
 * - サイドバーは固定幅280px
 * - アクティブなナビゲーション項目はハイライト表示
 * - レスポンシブ対応（モバイルではサイドバーは隠れる）
 */
export default function SettingsPage() {
  const location = useLocation()
  
  // サイドバーの折りたたみ状態を管理（全アプリで共通のlocalStorageキーを使用）
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('app-sidebar-collapsed')
    return saved ? JSON.parse(saved) : false
  })

  // サイドバーの状態が変更されたらlocalStorageに保存
  useEffect(() => {
    localStorage.setItem('app-sidebar-collapsed', JSON.stringify(sidebarCollapsed))
  }, [sidebarCollapsed])
  
  // 現在のパスがナビゲーション項目と一致するか判定
  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + "/")
  }

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* App Switcher - 親画面に戻るためのアプリ切り替え */}
      <AppSwitcher />
      
      {/* サイドバーナビゲーション */}
      <aside 
        className={cn(
          "border-r border-border bg-card flex-shrink-0 overflow-y-auto transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "w-16" : "w-72"
        )}
      >
        {/* ヘッダー */}
        <div className={cn(
          "border-b border-border flex items-center",
          sidebarCollapsed ? "h-16 justify-center" : "h-16 px-4 gap-3"
        )}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? "サイドバーを展開" : "サイドバーを折りたたむ"}
            className="flex-shrink-0 hover:bg-accent"
          >
            <Menu className="h-5 w-5" />
          </Button>
          {!sidebarCollapsed && (
            <>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <SettingsIcon className="w-4 h-4 text-primary" />
              </div>
              <h1 className="text-lg font-bold text-foreground">設定</h1>
            </>
          )}
        </div>

        {/* ナビゲーションメニュー */}
        <nav className="p-4 space-y-6">
          {navigationSections.map((section) => (
            <div key={section.title}>
              {/* セクションタイトル */}
              {!sidebarCollapsed && (
                <h2 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {section.title}
                </h2>
              )}
              
              {/* ナビゲーション項目 */}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      title={sidebarCollapsed ? `${item.title} - ${item.description}` : undefined}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                        sidebarCollapsed && "justify-center",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {!sidebarCollapsed && <span>{item.title}</span>}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* メインコンテンツエリア */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
