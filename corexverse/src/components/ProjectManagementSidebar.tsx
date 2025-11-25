import { NavLink, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { 
  Calendar,
  ListTodo,
  Users,
  GitBranch,
  FolderKanban,
  Menu
} from "lucide-react"

/**
 * プロジェクト管理アプリ用のナビゲーションアイテム
 * 現代的なUIデザインを採用
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

interface ProjectManagementSidebarProps {
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  onNavigate?: () => void
}

/**
 * プロジェクト管理サイドバーコンポーネント
 * MainLayoutと組み合わせて使用
 */
export default function ProjectManagementSidebar({ 
  sidebarCollapsed, 
  setSidebarCollapsed,
  onNavigate 
}: ProjectManagementSidebarProps) {
  const location = useLocation()

  return (
    <>
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
      
      {/* Navigation - ナビゲーション */}
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
              onClick={onNavigate}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </NavLink>
          )
        })}
      </nav>
    </>
  )
}
