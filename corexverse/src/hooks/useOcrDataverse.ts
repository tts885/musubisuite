/**
 * OCR管理 - Dataverse連携フック
 * 
 * OCRフォルダ、ドキュメント、メニューセクションの
 * Dataverse連携用Reactフックを提供します。
 * 
 * @module useOcrDataverse
 * 
 * @example
 * ```typescript
 * import { useOcrFolders, useOcrDocuments } from '@/hooks/useOcrDataverse';
 * 
 * function MyComponent() {
 *   const { folders, loading, createFolder } = useOcrFolders('all-docs');
 *   const { documents } = useOcrDocuments(selectedFolderId);
 *   
 *   const handleAdd = async () => {
 *     await createFolder({
 *       name: '新しいフォルダ',
 *       menuSection: 'all-docs'
 *     });
 *   };
 *   
 *   return <div>...</div>;
 * }
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { ocrDataverseService, type MenuSectionRecord } from '@/services/ocrDataverseService';
import type { OcrFolder, OcrDocument } from '@/types';

/**
 * メニューセクション取得フック
 * 
 * @returns メニューセクション、ローディング状態、操作関数
 * 
 * @example
 * ```typescript
 * const { sections, loading, refresh, createSection } = useMenuSections();
 * 
 * useEffect(() => {
 *   console.log(sections);
 * }, [sections]);
 * ```
 */
export function useMenuSections() {
  const [sections, setSections] = useState<MenuSectionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSections = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ocrDataverseService.getMenuSections();
      setSections(data);
    } catch (err) {
      setError(err as Error);
      console.error('メニューセクション取得エラー:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  const createSection = useCallback(async (section: Partial<MenuSectionRecord>) => {
    try {
      const created = await ocrDataverseService.createMenuSection(section);
      setSections(prev => [...prev, created]);
      return created;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  return {
    sections,
    loading,
    error,
    refresh: fetchSections,
    createSection,
  };
}

/**
 * フォルダ取得フック
 * 
 * @param {string} [menuSectionId] - メニューセクションID
 * @returns フォルダ配列、ローディング状態、CRUD操作関数
 * 
 * @example
 * ```typescript
 * const { 
 *   folders, 
 *   loading, 
 *   createFolder, 
 *   updateFolder, 
 *   deleteFolder 
 * } = useOcrFolders('all-docs');
 * 
 * const handleAddFolder = async () => {
 *   await createFolder({
 *     name: '請求書',
 *     menuSection: 'all-docs',
 *     parentId: null
 *   });
 * };
 * ```
 */
export function useOcrFolders(menuSectionId?: string) {
  const [folders, setFolders] = useState<OcrFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchFolders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ocrDataverseService.getFolders(menuSectionId);
      setFolders(data);
    } catch (err) {
      setError(err as Error);
      console.error('フォルダ取得エラー:', err);
    } finally {
      setLoading(false);
    }
  }, [menuSectionId]);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  const createFolder = useCallback(async (folder: Partial<OcrFolder>) => {
    try {
      const created = await ocrDataverseService.createFolder(folder);
      setFolders(prev => [...prev, created]);
      return created;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  const updateFolder = useCallback(async (folderId: string, updates: Partial<OcrFolder>) => {
    try {
      const updated = await ocrDataverseService.updateFolder(folderId, updates);
      setFolders(prev => prev.map(f => f.id === folderId ? updated : f));
      return updated;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  const deleteFolder = useCallback(async (folderId: string) => {
    try {
      await ocrDataverseService.deleteFolder(folderId);
      setFolders(prev => prev.filter(f => f.id !== folderId));
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  return {
    folders,
    loading,
    error,
    refresh: fetchFolders,
    createFolder,
    updateFolder,
    deleteFolder,
  };
}

/**
 * ドキュメント取得フック
 * 
 * @param {string} [folderId] - フォルダID
 * @returns ドキュメント配列、ローディング状態、操作関数
 * 
 * @example
 * ```typescript
 * const { documents, loading, createDocument } = useOcrDocuments(folderId);
 * 
 * const handleUpload = async (file: File) => {
 *   await createDocument({
 *     fileName: file.name,
 *     fileType: file.type,
 *     fileSize: file.size,
 *     fileUrl: uploadedUrl,
 *     folderId: folderId
 *   });
 * };
 * ```
 */
export function useOcrDocuments(folderId?: string) {
  const [documents, setDocuments] = useState<OcrDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ocrDataverseService.getDocuments(folderId);
      setDocuments(data);
    } catch (err) {
      setError(err as Error);
      console.error('ドキュメント取得エラー:', err);
    } finally {
      setLoading(false);
    }
  }, [folderId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const createDocument = useCallback(async (document: Partial<OcrDocument>) => {
    try {
      const created = await ocrDataverseService.createDocument(document);
      setDocuments(prev => [...prev, created]);
      return created;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  return {
    documents,
    loading,
    error,
    refresh: fetchDocuments,
    createDocument,
  };
}

/**
 * フォルダツリー構築フック
 * 
 * フラットなフォルダ配列から階層構造のツリーを構築します。
 * 
 * @param {OcrFolder[]} folders - フラットなフォルダ配列
 * @returns 階層構造のフォルダツリー
 * 
 * @example
 * ```typescript
 * const { folders } = useOcrFolders('all-docs');
 * const tree = useFolderTree(folders);
 * 
 * // tree = [
 * //   { ...folder1, children: [childFolder1, childFolder2] },
 * //   { ...folder2, children: [] }
 * // ]
 * ```
 */
export function useFolderTree(folders: OcrFolder[]) {
  return useState(() => {
    const buildTree = (parentId: string | null = null): (OcrFolder & { children: any[] })[] => {
      return folders
        .filter(f => f.parentId === parentId)
        .map(folder => ({
          ...folder,
          children: buildTree(folder.id),
        }));
    };
    
    return buildTree();
  })[0];
}

/**
 * フォルダ統計取得フック
 * 
 * @param {string} folderId - フォルダID
 * @returns 統計情報、ローディング状態
 * 
 * @example
 * ```typescript
 * const { stats, loading } = useFolderStats(folderId);
 * 
 * console.log(stats); // { total: 10, completed: 8, pending: 2 }
 * ```
 */
export function useFolderStats(folderId: string) {
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    processing: 0,
    failed: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const documents = await ocrDataverseService.getDocuments(folderId);
        
        const total = documents.length;
        const completed = documents.filter(d => d.ocrResult?.status === 'completed').length;
        const pending = documents.filter(d => d.ocrResult === null).length;
        const processing = documents.filter(d => d.ocrResult?.status === 'processing').length;
        const failed = documents.filter(d => d.ocrResult?.status === 'failed').length;
        
        setStats({ total, completed, pending, processing, failed });
      } catch (error) {
        console.error('統計取得エラー:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [folderId]);

  return { stats, loading };
}
