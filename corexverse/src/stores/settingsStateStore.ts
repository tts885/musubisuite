/**
 * 設定画面の状態管理ストア
 * 
 * 設定画面のナビゲーション状態(選択されたタブ)とサイドバー状態を保持します。
 * localStorageに永続化されるため、画面リロード後も状態が維持されます。
 * 
 * @module stores/settingsStateStore
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * 設定画面の状態インターフェース
 */
interface SettingsState {
  /** 最後に選択された設定タブのパス (例: '/settings/users') */
  lastSelectedTab: string | null
  
  /** サイドバーの折りたたみ状態 */
  sidebarCollapsed: boolean
  
  /** 最後に選択されたタブを設定 */
  setLastSelectedTab: (tab: string) => void
  
  /** サイドバーの折りたたみ状態を設定 */
  setSidebarCollapsed: (collapsed: boolean) => void
  
  /** 状態をリセット */
  reset: () => void
}

/**
 * デフォルト状態
 */
const defaultState = {
  lastSelectedTab: '/settings/users',
  sidebarCollapsed: false,
}

/**
 * 設定画面の状態管理ストア
 * 
 * @example
 * ```tsx
 * function SettingsPage() {
 *   const { lastSelectedTab, setLastSelectedTab } = useSettingsStateStore()
 *   
 *   useEffect(() => {
 *     setLastSelectedTab(location.pathname)
 *   }, [location.pathname])
 *   
 *   return <div>Current tab: {lastSelectedTab}</div>
 * }
 * ```
 */
export const useSettingsStateStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultState,
      
      setLastSelectedTab: (tab) => set({ lastSelectedTab: tab }),
      
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      
      reset: () => set(defaultState),
    }),
    {
      name: 'settings-state-storage',
      version: 1,
    }
  )
)
