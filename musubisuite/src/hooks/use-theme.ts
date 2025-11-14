/**
 * テーマ管理カスタムフック
 * 
 * テーマプロバイダーからテーマ情報とテーマ変更関数を取得します。
 * ThemeProvider内でのみ使用可能です。
 * 
 * @module hooks/use-theme
 */

import { useContext } from "react"
import { ThemeProviderContext } from "@/providers/theme-provider"

/**
 * テーマ管理フック
 * 
 * 現在のテーマとテーマ変更関数を提供します。
 * 
 * @returns {{theme: Theme, setTheme: (theme: Theme) => void}} テーマ情報とセッター
 * @throws {Error} ThemeProvider外で使用された場合
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { theme, setTheme } = useTheme();
 *   
 *   return (
 *     <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
 *       {theme === 'dark' ? '🌙' : '☀️'}
 *     </button>
 *   );
 * }
 * ```
 * 
 * @remarks
 * - ThemeProvider内でのみ使用可能
 * - テーマはLocalStorageに自動保存される
 * - system設定時はOSの設定を自動検出
 */
export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}