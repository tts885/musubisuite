import { Outlet } from "react-router-dom"
import AppSwitcher from "@/components/AppSwitcher"

/**
 * ホーム画面用レイアウトコンポーネント
 * AppSwitcherのみでサイドバーなしのシンプルなレイアウト
 */
export default function HomeLayout() {

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
