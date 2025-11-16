import { Link, useLocation } from "react-router-dom"
import { 
  Home,
  FolderKanban, 
  Boxes, 
  Wrench,
  Settings,
  Plus,
  Moon,
  Sun,
  type LucideIcon 
} from "lucide-react"
import { mockApplications } from "@/data/mockData"
import type { Application } from "@/types"
import { useTheme } from "@/hooks/use-theme"
import { setExplicitHomeNavigation } from "@/hooks/use-route-tracker"

/**
 * アイコン名とLucideIconコンポーネントのマッピング
 * 
 * @constant {Record<string, LucideIcon>} iconMap
 * 
 * @remarks
 * - mockApplicationsのiconプロパティに対応するアイコンコンポーネントを定義します
 * - 新しいアイコンを追加する場合は、ここに登録する必要があります
 */
const iconMap: Record<string, LucideIcon> = {
  Home,
  FolderKanban,
  Boxes,
  Wrench,
}

/**
 * アプリケーションスイッチャーコンポーネント
 * 
 * Plane風の左端に配置される縦型ナビゲーションバーで、
 * 異なるアプリケーション間を切り替えるための機能を提供します。
 * 
 * @component
 * 
 * @description
 * - 左端に固定幅(64px)で配置される縦型ナビゲーションバー
 * - 各アプリケーションをアイコンで表示し、クリックで切り替え可能
 * - 現在アクティブなアプリケーションを視覚的に強調表示
 * - ホバー時にツールチップでアプリケーション名を表示
 * - ダークモード・ライトモードの切り替え機能を提供
 * - デスクトップサイズ(lg以上)でのみ表示
 * 
 * @returns {JSX.Element} アプリケーションスイッチャーUI
 * 
 * @example
 * ```tsx
 * // _layout.tsxなどのレイアウトコンポーネントで使用
 * <div className="flex h-screen">
 *   <AppSwitcher />
 *   <div className="flex-1">
 *     {children}
 *   </div>
 * </div>
 * ```
 * 
 * @remarks
 * - 現在のパスに基づいてアクティブなアプリケーションを自動判定します
 * - ホームアプリケーションは完全一致、その他はプレフィックスマッチで判定します
 * - アクティブなアプリケーションには左側にカラーインジケーターが表示されます
 * - ツールチップはz-index: 9999で最前面に表示されます
 */
export default function AppSwitcher() {
  const location = useLocation()
  const { theme, setTheme } = useTheme()
  
  /**
   * 現在アクティブなアプリケーションを取得します
   * 
   * @returns {Application | undefined} 現在のパスに一致するアプリケーション
   * 
   * @remarks
   * - ルートパス('/')の場合はホームアプリケーションとして判定します
   * - その他のパスはプレフィックスマッチで判定します
   * - 例: '/project-management/projects'は'/project-management'にマッチ
   */
  const getCurrentApp = () => {
    const currentPath = location.pathname
    return mockApplications.find(app => {
      // ホーム画面の判定（ルートパス）
      if (app.path === '/') {
        return currentPath === '/'
      }
      // その他のアプリの判定（パスプレフィックスマッチ）
      return currentPath.startsWith(app.path)
    })
  }

  const currentApp = getCurrentApp()

  /**
   * アプリケーションリンククリック時のハンドラー
   * 
   * @param {Application} app - クリックされたアプリケーション
   * 
   * @remarks
   * ホーム画面への遷移時には明示的なフラグを設定します
   */
  const handleAppClick = (app: Application) => {
    if (app.path === "/") {
      setExplicitHomeNavigation()
    }
  }

  return (
    <div className="hidden lg:flex w-16 bg-sidebar border-r border-sidebar-border flex-col flex-shrink-0 relative z-50">
      {/* App Icons - Top Section - 縦中央揃え */}
      <div className="flex-1 flex flex-col items-center justify-center py-4 gap-2">
        {mockApplications.map((app: Application) => {
          const Icon = iconMap[app.icon]
          const isActive = currentApp?.id === app.id
          
          return (
            <Link
              key={app.id}
              to={app.path}
              onClick={() => handleAppClick(app)}
              className={`
                group relative flex items-center justify-center
                w-11 h-11 rounded-lg
                transition-all duration-200 ease-in-out
                ${isActive 
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm scale-105' 
                  : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground hover:scale-105'
                }
              `}
              title={app.name}
            >
              <Icon className="w-5 h-5" />
              
              {/* Active Indicator - アクティブ時の左側インジケーター */}
              {isActive && (
                <span 
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 rounded-r-full shadow-sm"
                  style={{ backgroundColor: app.color }}
                />
              )}
              
              {/* Tooltip - ホバー時のツールチップ (z-indexを最大に設定してサイドバーより前面に表示) */}
              <span className="absolute left-full ml-3 px-3 py-2 bg-popover text-popover-foreground text-sm font-medium rounded-lg shadow-lg border border-border opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-[9999]">
                {app.name}
              </span>
            </Link>
          )
        })}
      </div>

      {/* Bottom Section - Settings & Theme Toggle */}
      <div className="flex flex-col items-center py-4 gap-2 border-t border-sidebar-border">
        {/* Add New App Button (Future) */}
        <button
          className="flex items-center justify-center w-11 h-11 rounded-lg text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-200 disabled:opacity-20 disabled:cursor-not-allowed group relative"
          title="新しいアプリを追加"
          disabled
        >
          <Plus className="w-5 h-5" />
          
          {/* Tooltip - z-indexを最大に設定 */}
          <span className="absolute left-full ml-3 px-3 py-2 bg-popover text-popover-foreground text-sm font-medium rounded-lg shadow-lg border border-border opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-[9999]">
            新しいアプリを追加
          </span>
        </button>
        
        {/* Settings Button */}
        <Link
          to="/settings"
          className="flex items-center justify-center w-11 h-11 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200 group relative"
          title="設定"
        >
          <Settings className="w-5 h-5" />
          
          {/* Tooltip - z-indexを最大に設定 */}
          <span className="absolute left-full ml-3 px-3 py-2 bg-popover text-popover-foreground text-sm font-medium rounded-lg shadow-lg border border-border opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-[9999]">
            設定
          </span>
        </Link>

        {/* Dark Mode Toggle - 最下部に配置 */}
        <button
          className="flex items-center justify-center w-11 h-11 rounded-lg text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200 group relative mt-2"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          title={theme === "dark" ? "ライトモードに切り替え" : "ダークモードに切り替え"}
        >
          {theme === "dark" ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
          
          {/* Tooltip - z-indexを最大に設定 */}
          <span className="absolute left-full ml-3 px-3 py-2 bg-popover text-popover-foreground text-sm font-medium rounded-lg shadow-lg border border-border opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-[9999]">
            {theme === "dark" ? "ライトモード" : "ダークモード"}
          </span>
        </button>
      </div>
    </div>
  )
}
