/**
 * OCR状態管理ストア
 * 
 * OCRメニューの展開状態やサイドバー状態を永続化します。
 * Zustandのpersistミドルウェアを使用してlocalStorageに保存し、
 * ページリロード後も状態を復元します。
 * 
 * @module stores/ocrStateStore
 * 
 * @example
 * ```typescript
 * import { useOcrStateStore } from '@/stores/ocrStateStore';
 * 
 * function Component() {
 *   const { expandedFolders, toggleFolder } = useOcrStateStore();
 *   
 *   return (
 *     <button onClick={() => toggleFolder('folder-id')}>
 *       {expandedFolders.has('folder-id') ? '閉じる' : '開く'}
 *     </button>
 *   );
 * }
 * ```
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { OcrDocument } from '@/types'

interface OcrStateStore {
  /**
   * 展開されているフォルダのIDセット
   * Setのままでは永続化できないため、内部的に配列として保存
   */
  expandedFolders: Set<string>
  
  /**
   * サイドバーの折りたたみ状態はlocalStorageで全アプリ共通管理するため削除
   * モバイルでのサイドバー表示状態もMainLayoutで管理するため削除
   */
  
  /**
   * 最後に選択されたフォルダID
   * ページリロード時に選択状態を復元するために使用
   */
  selectedFolderId: string | null
  
  /**
   * 最後に訪問したOCR画面のパス
   * '/ocr', '/ocr/upload', '/ocr/documents/:id' のいずれか
   * F5リロード時に正しい画面に戻るために使用
   */
  lastOcrPath: string | null
  
  /**
   * キャッシュされたドキュメント一覧
   * 詳細画面からの戻り時にDB再取得を避けるため
   */
  cachedDocuments: OcrDocument[] | null
  
  /**
   * キャッシュのタイムスタンプ
   * 古いキャッシュを無効化するため
   */
  cacheTimestamp: number | null
  
  /**
   * フォルダの展開/折りたたみを切り替える
   * 
   * @param folderId - 対象フォルダのID
   * 
   * @example
   * ```typescript
   * toggleFolder('folder-123');
   * ```
   */
  toggleFolder: (folderId: string) => void
  
  /**
   * 複数のフォルダを展開状態に設定する
   * 
   * 親フォルダから子フォルダまでの階層を一括で展開する際に使用します。
   * 
   * @param folderIds - 展開するフォルダのID配列
   * 
   * @example
   * ```typescript
   * // 選択中のフォルダの親階層を全て展開
   * expandFolders(['parent-1', 'parent-2', 'current-folder']);
   * ```
   */
  expandFolders: (folderIds: string[]) => void
  
  /**
   * フォルダの展開状態をリセットする
   * デフォルトで「すべてのドキュメント」のみ展開
   */
  resetExpandedFolders: () => void
  

  
  /**
   * 選択中のフォルダIDを設定する
   * 
   * @param folderId - フォルダID (nullで選択解除)
   */
  setSelectedFolderId: (folderId: string | null) => void
  
  /**
   * 最後に訪問したOCR画面のパスを設定する
   * 
   * @param path - OCR画面のパス
   */
  setLastOcrPath: (path: string | null) => void
  
  /**
   * ドキュメント一覧をキャッシュに保存する
   * 
   * @param documents - キャッシュするドキュメント配列
   */
  setCachedDocuments: (documents: OcrDocument[]) => void
  
  /**
   * キャッシュされたドキュメント一覧を取得する
   * 5分以上経過している場合はnullを返す
   * 
   * @returns キャッシュが有効な場合はドキュメント配列、それ以外はnull
   */
  getCachedDocuments: () => OcrDocument[] | null
  
  /**
   * ドキュメントキャッシュをクリアする
   */
  clearDocumentCache: () => void
  
  /**
   * 全ての状態をリセットする
   */
  reset: () => void
}

/**
 * OCR状態管理ストア
 * 
 * ページリロード後も状態を保持するため、persistミドルウェアを使用。
 * localStorageのキー: 'ocr-state-storage'
 */
export const useOcrStateStore = create<OcrStateStore>()(
  persist(
    (set) => ({
      // 初期状態: 「すべてのドキュメント」のみ展開
      expandedFolders: new Set(['all-docs']),
      selectedFolderId: null,
      lastOcrPath: null,
      cachedDocuments: null,
      cacheTimestamp: null,
      
      // フォルダの展開/折りたたみ
      toggleFolder: (folderId: string) => 
        set((state) => {
          const newSet = new Set(state.expandedFolders)
          if (newSet.has(folderId)) {
            newSet.delete(folderId)
          } else {
            newSet.add(folderId)
          }
          return { expandedFolders: newSet }
        }),
      
      // 複数フォルダを展開
      expandFolders: (folderIds: string[]) =>
        set((state) => {
          const newSet = new Set(state.expandedFolders)
          folderIds.forEach(id => newSet.add(id))
          return { expandedFolders: newSet }
        }),
      
      // 展開状態をリセット
      resetExpandedFolders: () => 
        set({ expandedFolders: new Set(['all-docs']) }),
      
      // 選択フォルダID設定
      setSelectedFolderId: (folderId: string | null) => 
        set({ selectedFolderId: folderId }),
      
      // 最後のOCRパス設定
      setLastOcrPath: (path: string | null) => 
        set({ lastOcrPath: path }),
      
      // ドキュメントキャッシュ保存
      setCachedDocuments: (documents: OcrDocument[]) =>
        set({
          cachedDocuments: documents,
          cacheTimestamp: Date.now(),
        }),
      
      // ドキュメントキャッシュ取得（5分以内のみ有効）
      getCachedDocuments: (): OcrDocument[] | null => {
        const state: OcrStateStore = useOcrStateStore.getState()
        const CACHE_DURATION = 5 * 60 * 1000 // 5分
        
        if (
          state.cachedDocuments &&
          state.cacheTimestamp &&
          Date.now() - state.cacheTimestamp < CACHE_DURATION
        ) {
          return state.cachedDocuments
        }
        return null
      },
      
      // ドキュメントキャッシュクリア
      clearDocumentCache: () =>
        set({
          cachedDocuments: null,
          cacheTimestamp: null,
        }),
      
      // 全リセット
      reset: () => 
        set({
          expandedFolders: new Set(['all-docs']),
          selectedFolderId: null,
          lastOcrPath: null,
          cachedDocuments: null,
          cacheTimestamp: null,
        }),
    }),
    {
      name: 'ocr-state-storage', // localStorageキー
      
      /**
       * 永続化する状態の選択と変換
       * 
       * expandedFoldersは Set型 なので配列に変換して保存し、
       * 復元時にSetに変換し直します。
       */
      partialize: (state) => ({
        expandedFolders: Array.from(state.expandedFolders),
        selectedFolderId: state.selectedFolderId,
        lastOcrPath: state.lastOcrPath,
      }),
      
      /**
       * ストレージからのデータ復元処理
       * 
       * Zustand v4以降では、onRehydrateStorageを使用して
       * データ復元時にSet型への変換を行います。
       */
      onRehydrateStorage: () => (state) => {
        if (state) {
          // expandedFolders配列をSetに変換
          if (Array.isArray((state as any).expandedFolders)) {
            state.expandedFolders = new Set((state as any).expandedFolders)
          } else if (!(state.expandedFolders instanceof Set)) {
            // データが不正な場合はデフォルト値
            state.expandedFolders = new Set(['all-docs'])
          }
        }
      },
    }
  )
)
