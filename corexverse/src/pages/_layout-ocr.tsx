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
import MainLayout from '@/layouts/MainLayout'
import OcrSidebar from '@/components/ocr/OcrSidebar'
import { PageFooter } from '@/components/shared/PageFooter'
import { useRouteTracker } from '@/hooks/use-route-tracker'

export default function OcrLayout() {
  // ルート追跡フック
  useRouteTracker()

  return (
    <MainLayout
      sidebar={<OcrSidebar />}
      sidebarFooter={<span>Engine: Azure AI Document Intelligence</span>}
      pageFooter={
        <PageFooter
          leftContent={<span>© 2025 CoreXverse - OCR管理システム</span>}
          rightContent={<span>Powered by CoreXverse</span>}
        />
      }
    >
      <Outlet />
    </MainLayout>
  )
}
