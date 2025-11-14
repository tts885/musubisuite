/**
 * Sonnerプロバイダー
 * 
 * トースト通知システム(Sonner)を設定し、アプリ全体で使用可能にします。
 * テーマと自動的に同期します。
 * 
 * @module providers/sonner-provider
 */

import * as React from "react"
import { Toaster } from "sonner"
import { useTheme } from "@/hooks/use-theme"

/**
 * SonnerProviderコンポーネントのProps
 * @typedef {Object} SonnerProviderProps
 * @property {React.ReactNode} children - 子コンポーネント
 */
type SonnerProviderProps = { children: React.ReactNode }

/**
 * Sonnerプロバイダーコンポーネント
 * 
 * トースト通知システムを提供します。
 * 現在のテーマに合わせて通知の色合いを自動調整します。
 * 
 * @component
 * @param {SonnerProviderProps} props - コンポーネントのprops
 * @returns {JSX.Element} Sonnerプロバイダー
 * 
 * @example
 * ```tsx
 * <ThemeProvider>
 *   <SonnerProvider>
 *     <App />
 *   </SonnerProvider>
 * </ThemeProvider>
 * ```
 * 
 * @remarks
 * - 表示位置: 画面上部中央
 * - 表示時間: 3秒
 * - 同時表示数: 最大3件
 * - richColors有効化でカラフルな通知
 */
export function SonnerProvider({ children }: SonnerProviderProps) {
  const { theme } = useTheme();

  return (
    <>
      {children}
      <Toaster
        position="top-center"
        theme={theme}
        richColors
        expand
        duration={3000}
        visibleToasts={3}
      />
    </>
  )
}