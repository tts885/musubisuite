/**
 * TanStack Queryプロバイダー
 * 
 * TanStack Query(React Query)を設定し、サーバー状態管理を提供します。
 * キャッシュ設定、リトライ設定、リフェッチ設定を含みます。
 * 
 * @module providers/query-provider
 */

import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

/**
 * QueryProviderコンポーネントのProps
 * @typedef {Object} QueryProviderProps
 * @property {React.ReactNode} children - 子コンポーネント
 */
type QueryProviderProps = { children: React.ReactNode }

/**
 * TanStack Queryのクライアントインスタンス
 * 
 * サーバー状態管理の全設定を保持します。
 * 
 * @constant
 * @type {QueryClient}
 * 
 * @remarks
 * 設定内容:
 * - retry: false - 自動リトライ無効
 * - refetchOnWindowFocus: false - ウィンドウフォーカス時の自動再取得無効
 * - staleTime: 5分 - データが古くなるまでの時間
 * - gcTime: 10分 - ガベージコレクションまでの時間
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 min
      gcTime: 10 * 60 * 1000 // 10 min
    },
    mutations: {
      retry: false
    }
  },
});

/**
 * TanStack Queryプロバイダーコンポーネント
 * 
 * TanStack Queryのコンテキストを提供し、全コンポーネントで
 * useQuery、useMutationなどのフックを使用可能にします。
 * 
 * @component
 * @param {QueryProviderProps} props - コンポーネントのprops
 * @returns {JSX.Element} Queryプロバイダー
 * 
 * @example
 * ```tsx
 * <QueryProvider>
 *   <App />
 * </QueryProvider>
 * ```
 * 
 * @remarks
 * - サーバー状態のキャッシュ管理
 * - 自動的な再取得と同期化
 * - 楽観的更新とローディング状態管理
 */
export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}