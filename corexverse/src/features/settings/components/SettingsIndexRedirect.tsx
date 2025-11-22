/**
 * 設定画面のデフォルトリダイレクトコンポーネント
 * 
 * 最後に選択された設定タブにリダイレクトします。
 * 履歴がない場合は /settings/users にリダイレクトします。
 * 
 * @module features/settings/components/SettingsIndexRedirect
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettingsStateStore } from '@/stores/settingsStateStore'

/**
 * 設定画面のデフォルトリダイレクトコンポーネント
 * 
 * @component
 * @returns {null} レンダリングなし
 * 
 * @example
 * ```tsx
 * // router.tsx
 * {
 *   path: "/settings",
 *   element: <SettingsPage />,
 *   children: [
 *     { index: true, element: <SettingsIndexRedirect /> },
 *     ...
 *   ]
 * }
 * ```
 */
export default function SettingsIndexRedirect() {
  const navigate = useNavigate()
  const { lastSelectedTab } = useSettingsStateStore()

  useEffect(() => {
    // 最後に選択されたタブ、または users タブにリダイレクト
    const targetPath = lastSelectedTab || '/settings/users'
    navigate(targetPath, { replace: true })
  }, [navigate, lastSelectedTab])

  return null
}
