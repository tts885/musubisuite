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

import { createBrowserRouter } from "react-router-dom"
import Layout from "@/pages/_layout"
import ProjectManagementLayout from "@/pages/_layout-project-management"
import ToolPortalLayout from "@/pages/_layout-tool-portal"
import HomeLayout from "@/pages/_layout-home"
import LandingPage from "@/pages/landing"
import DashboardPage from "@/pages/dashboard"
import ProjectsPage from "@/pages/projects"
import ProjectDetailPage from "@/pages/project-detail"
import MembersPage from "@/pages/members"
import ClientsPage from "@/pages/clients"
import ProjectManagementPage from "@/pages/project-management"
import ToolPortalPage from "@/pages/tool-portal"
import DataverseSettingsPage from "./pages/dataverse-settings"
import NotFoundPage from "@/pages/not-found"

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
      { path: "members", element: <MembersPage /> },
      { path: "clients", element: <ClientsPage /> },
    ],
  },
  {
    path: "/project-management",
    element: <ProjectManagementLayout />,
    errorElement: <NotFoundPage />,
    children: [
      // プロジェクト管理アプリ (Project Management)
      { index: true, element: <ProjectManagementPage /> },
    ],
  },
  {
    path: "/tool-portal",
    element: <ToolPortalLayout />,
    errorElement: <NotFoundPage />,
    children: [
      // ツールPortalアプリ (Tool Portal)
      { index: true, element: <ToolPortalPage /> },
      { path: "dataverse-settings", element: <DataverseSettingsPage /> },
    ],
  },
], { 
  basename: BASENAME // IMPORTANT: Set basename for proper routing when hosted in Power Apps
})