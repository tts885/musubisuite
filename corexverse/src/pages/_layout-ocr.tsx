/**
 * OCRレイアウト
 * 
 * OCRアプリケーション専用のレイアウトコンポーネント。
 * 現代的なWebUIデザインを採用
 * 
 * Zustandストアで状態管理を行うため、localStorageの直接操作は不要。
 * 
 * @component
 * 
 * @returns {JSX.Element} OCRレイアウトUI
 */

import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import AppSwitcher from '@/components/AppSwitcher'
import OcrSidebar from '../components/ocr/OcrSidebar'
import { useOcrStateStore } from '@/stores/ocrStateStore'
import { useRouteTracker } from '@/hooks/use-route-tracker'

export default function OcrLayout() {
  const location = useLocation()
  const state = useOcrStateStore()
  
  // ルート追跡フック
  useRouteTracker()
  
  // ロケーション変更を監視(必要に応じてデバッグ用)
  useEffect(() => {
    // ロケーション変更時の処理が必要な場合はここに追加
  }, [location, state])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* AppSwitcher - 左端固定 */}
      <AppSwitcher />

      {/* OCRサイドバー - ナビゲーション */}
      <OcrSidebar />

      {/* メインコンテンツエリア */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
