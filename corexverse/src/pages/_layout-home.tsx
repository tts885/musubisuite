import { Outlet } from "react-router-dom"
import AppSwitcher from "@/components/AppSwitcher"
import { useRouteTracker } from "@/hooks/use-route-tracker"

/**
 * ホーム画面用レイアウトコンポーネント
 * AppSwitcherのみでサイドバーなしのシンプルなレイアウト
 */
export default function HomeLayout() {
  // ルート追跡フック
  useRouteTracker()

  return (
    <div className="flex h-screen bg-background">
      {/* AppSwitcher - 左端の固定位置 */}
      <AppSwitcher />

      {/* メインコンテンツエリア - サイドバーなし */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
