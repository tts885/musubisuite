/**
 * テーマプロバイダー
 * 
 * アプリケーション全体のテーマ(ダーク/ライトモード)を管理します。
 * LocalStorageへの永続化とシステム設定の自動検出をサポートします。
 * 
 * @module providers/theme-provider
 */

import { createContext, useEffect, useState } from "react"

/**
 * テーマの種類
 * @typedef {('dark' | 'light' | 'system')} Theme
 */
export type Theme = "dark" | "light" | "system"

/**
 * ThemeProviderコンポーネントのProps
 * @typedef {Object} ThemeProviderProps
 * @property {React.ReactNode} children - 子コンポーネント
 * @property {Theme} [defaultTheme='system'] - デフォルトテーマ
 * @property {string} [storageKey='app-theme'] - LocalStorageキー
 */
type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

/**
 * テーマプロバイダーのコンテキスト状態
 * @typedef {Object} ThemeProviderState
 * @property {Theme} theme - 現在のテーマ
 * @property {function(Theme): void} setTheme - テーマ変更関数
 */
type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

/**
 * テーマコンテキスト
 * 
 * テーマ情報を全コンポーネントで共有するためのReact Contextです。
 * 
 * @constant
 * @type {React.Context<ThemeProviderState>}
 */
export const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

/**
 * テーマプロバイダーコンポーネント
 * 
 * アプリケーション全体のテーマを管理し、LocalStorageへの永続化を行います。
 * 
 * @component
 * @param {ThemeProviderProps} props - コンポーネントのprops
 * @returns {JSX.Element} テーマプロバイダー
 * 
 * @example
 * ```tsx
 * <ThemeProvider defaultTheme="dark" storageKey="my-app-theme">
 *   <App />
 * </ThemeProvider>
 * ```
 * 
 * @remarks
 * - LocalStorageからテーマを読み込み
 * - systemテーマではOSの設定を自動検出
 * - テーマ変更時に<html>要素のclassを更新
 */
export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "app-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"

      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}