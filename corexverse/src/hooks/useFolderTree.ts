/**
 * OCRフォルダツリー構築用の共通フック
 * 重複ロジックを排除し、DRY原則に準拠
 */

import { useMemo } from 'react'
import type { OcrFolder } from '@/types'

export interface FolderTreeItem {
  folder: OcrFolder
  children: FolderTreeItem[]
  level: number
}

/**
 * フォルダのツリー構造を構築
 * @param folders フォルダリスト
 * @param parentId 親フォルダID（nullの場合はルート）
 * @param level 階層レベル
 * @returns ツリー構造
 */
export function useFolderTree(
  folders: OcrFolder[],
  parentId: string | null = null,
  level = 0
): FolderTreeItem[] {
  return useMemo(() => {
    return folders
      .filter(folder => folder.parentId === parentId)
      .map(folder => ({
        folder,
        children: buildFolderTreeRecursive(folders, folder.id, level + 1),
        level
      }))
  }, [folders, parentId, level])
}

/**
 * 再帰的にフォルダツリーを構築（内部関数）
 */
function buildFolderTreeRecursive(
  folders: OcrFolder[],
  parentId: string,
  level: number
): FolderTreeItem[] {
  return folders
    .filter(folder => folder.parentId === parentId)
    .map(folder => ({
      folder,
      children: buildFolderTreeRecursive(folders, folder.id, level + 1),
      level
    }))
}

/**
 * フォルダとその子孫フォルダを再帰的に取得
 * @param folders 全フォルダリスト
 * @param folderId 対象フォルダID
 * @returns フォルダIDの配列（対象フォルダ+子孫）
 */
export function useFolderAndDescendants(
  folders: OcrFolder[],
  folderId: string | null
): string[] {
  return useMemo(() => {
    if (!folderId) return []
    
    const result: string[] = [folderId]
    const collectDescendants = (id: string) => {
      const children = folders.filter(f => f.parentId === id)
      children.forEach(child => {
        result.push(child.id)
        collectDescendants(child.id)
      })
    }
    
    collectDescendants(folderId)
    return result
  }, [folders, folderId])
}

/**
 * フォルダの祖先パスを取得（パンくずリスト用）
 * @param folders 全フォルダリスト
 * @param folderId 対象フォルダID
 * @returns 祖先フォルダのリスト（ルートから対象まで）
 */
export function useFolderAncestors(
  folders: OcrFolder[],
  folderId: string | null
): OcrFolder[] {
  return useMemo(() => {
    if (!folderId) return []
    
    const ancestors: OcrFolder[] = []
    let currentId: string | null = folderId
    
    while (currentId) {
      const folder = folders.find(f => f.id === currentId)
      if (!folder) break
      ancestors.unshift(folder) // 先頭に追加（ルートから並べる）
      currentId = folder.parentId
    }
    
    return ancestors
  }, [folders, folderId])
}

/**
 * フォルダツリーをフラットなリストに変換
 * @param tree フォルダツリー
 * @returns フラットなリスト
 */
export function flattenFolderTree(tree: FolderTreeItem[]): OcrFolder[] {
  const result: OcrFolder[] = []
  
  const flatten = (items: FolderTreeItem[]) => {
    items.forEach(item => {
      result.push(item.folder)
      if (item.children.length > 0) {
        flatten(item.children)
      }
    })
  }
  
  flatten(tree)
  return result
}
