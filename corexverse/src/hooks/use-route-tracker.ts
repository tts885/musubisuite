/**
 * ルート追跡カスタムフック
 * 
 * ユーザーの最後に訪問したページを追跡し、LocalStorageに保存します。
 * ルートパス(/)へのアクセス時に、適切なページへリダイレクトするために使用されます。
 * 
 * @module hooks/use-route-tracker
 */

import { useEffect } from "react"
import { useLocation } from "react-router-dom"

/**
 * LocalStorageキー: 最後に訪問したパス
 * @constant
 */
const LAST_PATH_KEY = "app-last-path"

/**
 * LocalStorageキー: ホーム画面への明示的な遷移フラグ
 * @constant
 * @internal exportしてlanding.tsxで使用
 */
export const EXPLICIT_HOME_KEY = "app-explicit-home"

/**
 * ルート追跡フック
 * 
 * 現在のルートを監視し、ルートパス以外のページを訪問した際に
 * そのパスをLocalStorageに保存します。
 * 
 * @returns {void}
 * 
 * @example
 * ```tsx
 * function App() {
 *   useRouteTracker();
 *   return <RouterProvider router={router} />;
 * }
 * ```
 * 
 * @remarks
 * - ルートパス(/)は記録対象外
 * - ページ遷移のたびに自動的に記録
 * - LocalStorageに永続化
 * - 明示的なホーム遷移時は記録をスキップ
 */
export function useRouteTracker() {
  const location = useLocation()

  useEffect(() => {
    if (location.pathname === "/") {
      // ルートパスの場合は何もしない（明示的フラグは保持）
      return
    } else {
      // ルートパス以外を記録
      localStorage.setItem(LAST_PATH_KEY, location.pathname)
      // 明示的フラグをクリア
      localStorage.removeItem(EXPLICIT_HOME_KEY)
    }
  }, [location.pathname])
}

/**
 * 最後に訪問したパスを取得
 * 
 * LocalStorageから最後に訪問したパスを取得します。
 * 
 * @returns {string | null} 最後に訪問したパス、または null
 * 
 * @example
 * ```tsx
 * const lastPath = getLastVisitedPath();
 * if (lastPath) {
 *   navigate(lastPath);
 * }
 * ```
 */
export function getLastVisitedPath(): string | null {
  return localStorage.getItem(LAST_PATH_KEY)
}

/**
 * 明示的なホーム遷移フラグを設定
 * 
 * ユーザーが意図的にホーム画面に遷移したことを記録します。
 * このフラグがある場合、自動リダイレクトは実行されません。
 * 
 * @returns {void}
 * 
 * @example
 * ```tsx
 * // ホームボタンクリック時
 * setExplicitHomeNavigation();
 * navigate('/');
 * ```
 */
export function setExplicitHomeNavigation(): void {
  localStorage.setItem(EXPLICIT_HOME_KEY, "true")
}

/**
 * 明示的なホーム遷移かどうかをチェック
 * 
 * ユーザーが意図的にホーム画面に遷移したかを判定します。
 * 
 * @returns {boolean} 明示的な遷移の場合true
 * 
 * @example
 * ```tsx
 * if (!isExplicitHomeNavigation()) {
 *   // 自動リダイレクト処理
 * }
 * ```
 */
export function isExplicitHomeNavigation(): boolean {
  return localStorage.getItem(EXPLICIT_HOME_KEY) === "true"
}

/**
 * 明示的なホーム遷移フラグをクリア
 * 
 * landing.tsxでランディングページを表示した後に呼び出す。
 * 
 * @returns {void}
 * 
 * @example
 * ```tsx
 * clearExplicitHomeNavigation();
 * ```
 */
export function clearExplicitHomeNavigation(): void {
  localStorage.removeItem(EXPLICIT_HOME_KEY)
}

/**
 * 訪問履歴をクリア
 * 
 * LocalStorageから最後に訪問したパスを削除します。
 * 
 * @returns {void}
 * 
 * @example
 * ```tsx
 * // ログアウト時などに使用
 * clearLastVisitedPath();
 * ```
 */
export function clearLastVisitedPath(): void {
  localStorage.removeItem(LAST_PATH_KEY)
  localStorage.removeItem(EXPLICIT_HOME_KEY)
}
