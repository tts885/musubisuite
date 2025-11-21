/**
 * OCRレイアウト
 * 
 * OCRアプリケーション専用のレイアウトコンポーネント。
 * Plane風の現代的なWebUIデザインを採用
 * 
 * @component
 * 
 * @returns {JSX.Element} OCRレイアウトUI
 */

import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import AppSwitcher from '@/components/AppSwitcher'
import OcrSidebar from '../components/ocr/OcrSidebar'

export default function OcrLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  // localStorageから初期状態を読み込み、デフォルトはfalse(展開)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('app-sidebar-collapsed')
    return saved ? JSON.parse(saved) : false
  })

  // サイドバーの状態が変更されたらlocalStorageに保存
  useEffect(() => {
    localStorage.setItem('app-sidebar-collapsed', JSON.stringify(sidebarCollapsed))
  }, [sidebarCollapsed])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* AppSwitcher - 左端固定 */}
      <AppSwitcher />

      {/* OCRサイドバー - ナビゲーション */}
      <OcrSidebar 
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* メインコンテンツエリア */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
