/**
 * アプリケーションのルートコンポーネント
 * 
 * 全てのプロバイダー(テーマ、認証、クエリキャッシュ、ルーティング)を設定し、
 * アプリケーション全体のコンテキストを提供します。
 * 
 * @module App
 */

import { PowerProvider } from "./providers/power-provider"
import { ThemeProvider } from "@/providers/theme-provider"
import { SonnerProvider } from "@/providers/sonner-provider"
import { QueryProvider } from "./providers/query-provider"
import { RouterProvider } from "react-router-dom"
import { router } from "@/router"
import { Toaster } from "@/components/ui/toaster"

/**
 * ルートアプリケーションコンポーネント
 * 
 * 全てのコンテキストプロバイダーを階層構造で設定し、
 * React Routerによるルーティングを提供します。
 * 
 * @component
 * @returns {JSX.Element} アプリケーションルート
 * 
 * @example
 * ```tsx
 * // main.tsxで使用
 * createRoot(document.getElementById('root')!).render(
 *   <StrictMode>
 *     <App />
 *   </StrictMode>
 * );
 * ```
 * 
 * @remarks
 * プロバイダーの階層構造:
 * 1. PowerProvider - Power Apps環境との統合
 * 2. ThemeProvider - テーマ(ダーク/ライトモード)管理
 * 3. SonnerProvider - トースト通知システム
 * 4. QueryProvider - サーバー状態管理
 * 5. RouterProvider - ルーティング管理
 * 
 * ルート追跡機能により、ユーザーの最後に訪問したページを記録し、
 * 次回訪問時に適切なページを表示します。
 */
export default function App() {
  return (
    <PowerProvider>
      <ThemeProvider>
        <SonnerProvider>
          <QueryProvider>
            <RouterProvider router={router} />
            <Toaster />
          </QueryProvider>
        </SonnerProvider>
      </ThemeProvider>
    </PowerProvider>
  )
}