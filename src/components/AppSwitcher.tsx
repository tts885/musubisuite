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

// アイコンマッピング
const iconMap: Record<string, LucideIcon> = {
  Home,
  FolderKanban,
  Boxes,
  Wrench,
}

/**
 * Plane風のアプリスイッチャー
 * 左端の縦型ナビゲーションで異なるアプリケーション間を切り替え
 * 現代的なWebUIデザインを採用し、ダークモードに完全対応
 * デスクトップのみ表示、モバイルでは非表示
 */
export default function AppSwitcher() {
  const location = useLocation()
  const { theme, setTheme } = useTheme()
  
  // 現在のアプリを判定
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
        
        {/* Settings Button (Future) */}
        <button
          className="flex items-center justify-center w-11 h-11 rounded-lg text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-200 disabled:opacity-20 disabled:cursor-not-allowed group relative"
          title="設定"
          disabled
        >
          <Settings className="w-5 h-5" />
          
          {/* Tooltip - z-indexを最大に設定 */}
          <span className="absolute left-full ml-3 px-3 py-2 bg-popover text-popover-foreground text-sm font-medium rounded-lg shadow-lg border border-border opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-[9999]">
            設定
          </span>
        </button>

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
