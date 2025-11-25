/**
 * OCRレイアウト
 * 
 * OCRアプリケーション専用のレイアウトコンポーネント。
 * 共通レイアウト(MainLayout)を使用して一貫性のあるUIを提供。
 * 
 * @component
 * 
 * @returns {JSX.Element} OCRレイアウトUI
 */

import { Outlet } from 'react-router-dom'
import { useState, useEffect } from 'react'
import MainLayout from '@/layouts/MainLayout'
import OcrSidebar from '@/components/ocr/OcrSidebar'
import OcrSettingsDialog from '@/components/ocr/OcrSettingsDialog'
import { useRouteTracker } from '@/hooks/use-route-tracker'

export default function OcrLayout() {
  // ルート追跡フック
  useRouteTracker()
  
  // localStorageから初期状態を読み込み、デフォルトはfalse(展開)
  // 全アプリで共通のキーを使用
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('app-sidebar-collapsed')
    return saved ? JSON.parse(saved) : false
  })
  
  // サイドバーの状態が変更されたらlocalStorageに保存
  // 全アプリで共通のキーを使用して状態を共有
  useEffect(() => {
    localStorage.setItem('app-sidebar-collapsed', JSON.stringify(sidebarCollapsed))
  }, [sidebarCollapsed])

  return (
    <MainLayout
      sidebar={
        <OcrSidebar
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
        />
      }
      sidebarCollapsed={sidebarCollapsed}
      sidebarFooter={<OcrSettingsDialog />}
      footerLeftContent={<span>© 2025 CoreXverse - OCR管理システム</span>}
      footerRightContent={<span>Powered by CoreXverse</span>}
    >
      <Outlet />
    </MainLayout>
  )
}
