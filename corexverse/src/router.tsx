/**
 * アプリケーションルーティング設定
 * 
 * React Router v6のcreateBrowserRouterを使用して、
 * アプリケーションの全ルートを定義します。
 * 
 * @module router
 * 
 * @remarks
 * ルート構造:
 * - / - ランディングページ
 * - /dashboard/* - 統合ダッシュボードと案件管理
 * - /project-management/* - プロジェクト管理アプリ
 * - /tool-portal/* - ツールポータルアプリ
 * 
 * @see {@link https://reactrouter.com/en/main/routers/create-browser-router}
 */

import { createBrowserRouter, Navigate } from "react-router-dom"
import Layout from "@/pages/_layout"
import ProjectManagementLayout from "@/pages/_layout-project-management"
import ToolPortalLayout from "@/pages/_layout-tool-portal"
import OcrLayout from "@/pages/_layout-ocr"
import HomeLayout from "@/pages/_layout-home"
import LandingPage from "@/pages/landing"
import DashboardPage from "@/features/dashboard/pages/dashboard"
import ProjectsPage from "@/features/projects/pages/projects"
import ProjectDetailPage from "@/features/projects/pages/project-detail"
import ProjectManagementPage from "@/pages/project-management"
import ToolPortalPage from "@/pages/tool-portal"
import OcrDocumentListPage from "@/features/ocr/pages/ocr-document-list"
import OcrUploadPage from "@/features/ocr/pages/ocr-upload"
import OcrDocumentDetailPage from "@/features/ocr/pages/ocr-document-detail"
import DataverseSettings from "@/features/tool-portal/pages/dataverse-settings"
import SettingsPage from "@/features/settings/pages/settings"
import SettingsIndexRedirect from "@/features/settings/components/SettingsIndexRedirect"
import UsersSettingsPage from "@/features/settings/pages/users"
import ClientsSettingsPage from "@/features/settings/pages/clients"
import AISettingsPage from "@/features/settings/pages/ai-settings"
import CodeMastersPage from "@/features/settings/pages/codemasters"
import NotFoundPage from "@/pages/not-found"
import UnderConstructionPage from "@/pages/under-construction"

// IMPORTANT: Do not remove or modify the code below!
// Normalize basename when hosted in Power Apps
const BASENAME = new URL(".", location.href).pathname
if (location.pathname.endsWith("/index.html")) {
  history.replaceState(null, "", BASENAME + location.search + location.hash);
}

export const router = createBrowserRouter([
  // ホーム画面 (Landing Page) - 初期画面
  {
    path: "/",
    element: <HomeLayout />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <LandingPage /> },
    ],
  },
  {
    path: "/dashboard",
    element: <Layout />,
    errorElement: <NotFoundPage />,
    children: [
      // 案件管理アプリ (Case Management)
      { index: true, element: <DashboardPage /> },
      { path: "projects", element: <ProjectsPage /> },
      { path: "projects/:id", element: <ProjectDetailPage /> },
    ],
  },
  {
    path: "/ocr",
    element: <OcrLayout />,
    errorElement: <NotFoundPage />,
    children: [
      // OCRアプリ (OCR Processing)
      { index: true, element: <OcrDocumentListPage /> },
      { path: "upload", element: <OcrUploadPage /> },
      { path: "documents/:documentId", element: <OcrDocumentDetailPage /> },
    ],
  },
  {
    path: "/project-management",
    element: <ProjectManagementLayout />,
    errorElement: <NotFoundPage />,
    children: [
      // プロジェクト管理アプリ (Project Management)
      { index: true, element: <ProjectManagementPage /> },
      { path: "tasks", element: <UnderConstructionPage /> },
      { path: "team", element: <UnderConstructionPage /> },
      { path: "repositories", element: <UnderConstructionPage /> },
    ],
  },
  {
    path: "/tool-portal",
    element: <ToolPortalLayout />,
    errorElement: <NotFoundPage />,
    children: [
      // ツールポータルアプリ (Tool Portal)
      { index: true, element: <ToolPortalPage /> },
      { path: "dataverse-settings", element: <DataverseSettings /> },
      { path: "config", element: <UnderConstructionPage /> },
      { path: "automation", element: <UnderConstructionPage /> },
      { path: "database", element: <UnderConstructionPage /> },
    ],
  },
  {
    path: "/settings",
    element: <SettingsPage />,
    errorElement: <NotFoundPage />,
    children: [
      // 設定画面 (Settings)
      { index: true, element: <SettingsIndexRedirect /> },
      { path: "users", element: <UsersSettingsPage /> },
      { path: "clients", element: <ClientsSettingsPage /> },
      { path: "contracts", element: <UnderConstructionPage /> },
      { path: "codemasters", element: <CodeMastersPage /> },
      { path: "ai", element: <AISettingsPage /> },
      { path: "security", element: <UnderConstructionPage /> },
      { path: "notifications", element: <UnderConstructionPage /> },
      { path: "appearance", element: <UnderConstructionPage /> },
      { path: "dataverse", element: <UnderConstructionPage /> },
      { path: "api", element: <UnderConstructionPage /> },
      { path: "logs", element: <UnderConstructionPage /> },
      { path: "about", element: <UnderConstructionPage /> },
    ],
  },
], {
  basename: BASENAME // IMPORTANT: Set basename for proper routing when hosted in Power Apps
})