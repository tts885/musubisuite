import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { 
  Search, 
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Trash2,
  Download,
  Archive,
  Edit2
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { OcrDocument } from '@/types'
import ocrDataverseService from '@/services/ocrDataverseService'
import { useOcrStateStore } from '@/stores/ocrStateStore'
import { logger } from '@/lib/logger'
import { PAGINATION } from '@/config/constants'
import { useMemo, useCallback } from 'react'

/**
 * OCRドキュメント一覧ページ
 * ファイル単位でのOCR処理結果を一覧表示
 */
export default function OcrDocumentListPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  // Zustandストアから状態を取得・復元
  const { 
    setSelectedFolderId: setSelectedFolderIdInStore,
    getCachedDocuments,
    setCachedDocuments,
    // clearDocumentCache - 削除時は自動的にキャッシュ更新されるため直接使用しない
  } = useOcrStateStore()
  
  // URLパラメータからフォルダIDを取得
  const urlFolderId = searchParams.get('folder')
  
  const [searchKeyword, setSearchKeyword] = useState('')
  const [folderFilter, setFolderFilter] = useState<string>(urlFolderId || 'all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = PAGINATION.ITEMS_PER_PAGE
  
  // Dataverseからデータ取得
  const [documents, setDocuments] = useState<OcrDocument[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  
  // 削除ダイアログ用state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<OcrDocument | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // 一括削除ダイアログ用state
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
  const [documentsToDelete, setDocumentsToDelete] = useState<OcrDocument[]>([])
  
  // URLパラメータが変更されたらフォルダフィルターを更新し、ストアに保存
  useEffect(() => {
    if (urlFolderId) {
      setFolderFilter(urlFolderId)
      setSelectedFolderIdInStore(urlFolderId)
    } else {
      setFolderFilter('all')
      setSelectedFolderIdInStore(null)
    }
  }, [urlFolderId, setSelectedFolderIdInStore])

  // ドキュメント取得（キャッシュ対応）
  useEffect(() => {
    const fetchDocuments = async () => {
      // キャッシュをチェック
      const cached = getCachedDocuments()
      if (cached) {
        logger.info('キャッシュからドキュメントを復元', { count: cached.length })
        setDocuments(cached)
        setIsLoading(false)
        return
      }

      // キャッシュがない場合はDBから取得
      setIsLoading(true)
      try {
        const docs = await ocrDataverseService.getDocuments()
        setDocuments(docs)
        // キャッシュに保存
        setCachedDocuments(docs)
        logger.info('DBからドキュメントを取得してキャッシュに保存', { count: docs.length })
      } catch (error) {
        logger.error('ドキュメント取得エラー', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchDocuments()
  }, [getCachedDocuments, setCachedDocuments])
  
  // ドキュメント変更時にキャッシュを更新
  useEffect(() => {
    if (documents.length > 0 && !isLoading) {
      setCachedDocuments(documents)
    }
  }, [documents, isLoading, setCachedDocuments])
  
  // パンくずリストを生成（M001>F003/F003形式）


  // URLパラメータからフォルダフィルターを取得
  useEffect(() => {
    const folderParam = searchParams.get('folder')
    if (folderParam) {
      setFolderFilter(folderParam)
    } else {
      setFolderFilter('all')
    }
  }, [searchParams])

  // フィルタリング（useMemoで最適化）
  const filteredDocuments = useMemo((): OcrDocument[] => {
    let filtered = documents

    // フォルダフィルター
    if (folderFilter !== 'all') {
      filtered = filtered.filter(doc => doc.folderId === folderFilter)
    }

    // 検索フィルター
    if (searchKeyword.trim()) {
      const lowerKeyword = searchKeyword.toLowerCase()
      filtered = filtered.filter(doc => 
        doc.fileName.toLowerCase().includes(lowerKeyword) ||
        (doc.tags && doc.tags.some(tag => tag.toLowerCase().includes(lowerKeyword)))
      )
    }

    return filtered
  }, [documents, folderFilter, searchKeyword])
  
  // ページネーション
  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentDocuments = filteredDocuments.slice(startIndex, endIndex)

  // 選択ハンドラー
  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const toggleAllSelection = () => {
    // 現在のページのアイテムがすべて選択されているか確認
    const allSelected = currentDocuments.length > 0 && currentDocuments.every(d => selectedIds.has(d.id))
    
    const newSelected = new Set(selectedIds)
    if (allSelected) {
      currentDocuments.forEach(d => newSelected.delete(d.id))
    } else {
      currentDocuments.forEach(d => newSelected.add(d.id))
    }
    setSelectedIds(newSelected)
  }

  // 削除ダイアログを開く
  const openDeleteDialog = (doc: OcrDocument, e: React.MouseEvent) => {
    e.stopPropagation()
    setDocumentToDelete(doc)
    setDeleteDialogOpen(true)
  }

  // 削除処理
  const handleDelete = async () => {
    if (!documentToDelete) return
    
    setIsDeleting(true)
    try {
      await ocrDataverseService.deleteDocument(documentToDelete.id)
      
      // ローカルstateから削除（これが自動的にキャッシュも更新）
      setDocuments(prev => prev.filter(d => d.id !== documentToDelete.id))
      
      // メニューの件数を更新するイベントを発火
      window.dispatchEvent(new CustomEvent('documentsUpdated'))
      
      // ダイアログを閉じる
      setDeleteDialogOpen(false)
      setDocumentToDelete(null)
    } catch (error) {
      logger.error('削除エラー', error)
      alert('ドキュメントの削除に失敗しました')
    } finally {
      setIsDeleting(false)
    }
  }

  // 一括削除ダイアログを開く
  const openBulkDeleteDialog = () => {
    if (selectedIds.size === 0) return
    
    // 選択されたドキュメントを取得
    const docsToDelete = documents.filter(doc => selectedIds.has(doc.id))
    setDocumentsToDelete(docsToDelete)
    setBulkDeleteDialogOpen(true)
  }

  // 一括削除処理
  const handleBulkDelete = async () => {
    if (documentsToDelete.length === 0) return
    
    setIsDeleting(true)
    try {
      // すべてのドキュメントを削除
      await Promise.all(
        documentsToDelete.map(doc => ocrDataverseService.deleteDocument(doc.id))
      )
      
      // ローカルstateから削除
      const deletedIds = new Set(documentsToDelete.map(d => d.id))
      setDocuments(prev => prev.filter(d => !deletedIds.has(d.id)))
      
      // 選択をクリア
      setSelectedIds(new Set())
      
      // メニューの件数を更新するイベントを発火
      window.dispatchEvent(new CustomEvent('documentsUpdated'))
      
      // ダイアログを閉じる
      setBulkDeleteDialogOpen(false)
      setDocumentsToDelete([])
    } catch (error) {
      logger.error('一括削除エラー', error)
      alert('ドキュメントの削除に失敗しました')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleBulkDownload = useCallback(() => {
    if (selectedIds.size === 0) return
    logger.debug('Bulk download:', Array.from(selectedIds))
    // TODO: 実際のダウンロード処理を実装
  }, [selectedIds])

  const handleBulkArchive = useCallback(() => {
    if (selectedIds.size === 0) return
    logger.debug('Bulk archive:', Array.from(selectedIds))
    // TODO: 実際のアーカイブ処理を実装
  }, [selectedIds])

  // 行クリック時の処理
  const handleRowClick = (doc: OcrDocument) => {
    // OCR実施前でも詳細画面に遷移（画像表示のため）
    navigate(`/ocr/documents/${doc.id}`)
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* トップバー */}
      <div className="flex items-center justify-between px-8 py-5 bg-gray-50">
        <h1 className="text-2xl font-bold text-gray-900">ドキュメント</h1>
        
        <div className="flex items-center gap-3">
          {/* 検索 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="検索"
              value={searchKeyword}
              onChange={(e) => {
                setSearchKeyword(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-9 pr-4 w-64 bg-white border-gray-200"
            />
          </div>

          {/* スプリットボタン（新規作成） */}
          <div className="relative inline-flex shadow-sm rounded-md">
            <Button 
              className="rounded-r-none bg-indigo-600 hover:bg-indigo-700 text-white border-0 text-sm font-medium px-4 py-2"
              onClick={() => {
                const uploadPath = folderFilter !== 'all'
                  ? `/ocr/upload?folder=${folderFilter}`
                  : '/ocr/upload'
                navigate(uploadPath)
              }}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
              </svg>
              新規アップロード
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="rounded-l-none bg-indigo-600 hover:bg-indigo-700 text-white border-0 border-l border-indigo-700 px-2 py-2">
                  <ChevronDown className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate('/ocr/upload')}>
                  ファイルを選択
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  フォルダをアップロード (未実装)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* テーブル */}
      <div className={`flex-1 overflow-auto px-8 ${selectedIds.size > 0 ? 'pb-4' : 'pb-6'}`}>
        <div className="bg-white border border-gray-200 shadow-sm rounded-lg">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 border-b border-gray-200">
                <TableHead className="w-[50px] px-4 py-2">
                  <Checkbox 
                    checked={currentDocuments.length > 0 && currentDocuments.every(d => selectedIds.has(d.id))}
                    onCheckedChange={toggleAllSelection}
                    className="w-5 h-5 border-2 border-gray-400 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                  />
                </TableHead>
                <TableHead className="w-[40%] px-6 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">名前</TableHead>
                <TableHead className="w-[15%] px-6 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</TableHead>
                <TableHead className="w-[25%] px-6 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">更新日時</TableHead>
                <TableHead className="w-[100px] px-6 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 bg-white">
              {currentDocuments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                    該当するドキュメントが見つかりません
                  </TableCell>
                </TableRow>
              ) : (
                currentDocuments.map((doc) => {
                  const isSelected = selectedIds.has(doc.id)
                  return (
                    <TableRow 
                      key={doc.id}
                      className={`group transition-colors cursor-pointer ${isSelected ? 'bg-indigo-50/30 hover:bg-indigo-50/50' : 'bg-white hover:bg-gray-50'}`}
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest('[role="checkbox"]') || 
                            (e.target as HTMLElement).closest('button')) return
                        handleRowClick(doc)
                      }}
                    >
                      <TableCell className="px-4 py-2">
                        <Checkbox 
                          checked={isSelected}
                          onCheckedChange={() => toggleSelection(doc.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-5 h-5 border-2 border-gray-400 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                        />
                      </TableCell>
                      <TableCell className="px-6 py-2">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          <span className="font-medium text-gray-900 truncate">{doc.fileName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-2">
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full flex-shrink-0 ${
                            doc.status === 'completed' ? 'bg-green-500' : 
                            doc.status === 'processing' ? 'bg-yellow-500' : 
                            'bg-gray-400'
                          }`}></div>
                          <span className="text-sm text-gray-600 whitespace-nowrap">
                            {doc.status === 'completed' ? '完了' : 
                             doc.status === 'processing' ? '処理中' : 
                             doc.status === 'pending' ? '処理待ち' : 'アップロード済み'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-2">
                        <span className="text-sm text-gray-500 whitespace-nowrap">
                          {doc.uploadedDate ? format(new Date(doc.uploadedDate), 'yyyy/MM/dd', { locale: ja }) : '-'}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-2 text-right">
                        {/* インラインアクション（ホバー時表示） */}
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            className="p-1 text-gray-400 hover:text-gray-600 rounded"
                            onClick={(e) => { 
                              e.stopPropagation()
                              navigate(`/ocr/documents/${doc.id}`)
                            }}
                            title="編集"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            className="p-1 text-gray-400 hover:text-red-600 rounded"
                            onClick={(e) => openDeleteDialog(doc, e)}
                            title="削除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* ページネーション */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              {startIndex + 1} - {Math.min(endIndex, filteredDocuments.length)} 件 / 全 {filteredDocuments.length} 件
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                前へ
              </Button>
              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="w-10"
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                次へ
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 一括操作フッター（選択時のみ表示） */}
      {selectedIds.size > 0 && (
        <div className="border-t border-gray-200 bg-white p-4 shadow-lg flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-md text-sm font-medium">
                {selectedIds.size}件選択
              </span>
              <div className="h-4 w-px bg-gray-300"></div>
              <button 
                onClick={() => setSelectedIds(new Set())}
                className="text-sm text-gray-600 hover:text-indigo-600 font-medium transition-colors"
              >
                すべて選択解除
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleBulkDownload}
                className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-100 rounded-md transition-colors" 
                title="ダウンロード"
              >
                <Download className="w-5 h-5" />
              </button>
              <button 
                onClick={handleBulkArchive}
                className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-100 rounded-md transition-colors" 
                title="アーカイブ"
              >
                <Archive className="w-5 h-5" />
              </button>
              <button 
                onClick={openBulkDeleteDialog}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" 
                title="削除"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 単一削除確認ダイアログ */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ドキュメントを削除しますか?</AlertDialogTitle>
            <AlertDialogDescription>
              {documentToDelete && (
                <>
                  <span className="font-medium text-gray-900">{documentToDelete.fileName}</span>
                  <br />
                  この操作は取り消せません。本当に削除してもよろしいですか?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? '削除中...' : '削除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 一括削除確認ダイアログ */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {documentsToDelete.length}件のドキュメントを削除しますか?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  この操作は取り消せません。以下のドキュメントが削除されます:
                </p>
                <div className="max-h-60 overflow-y-auto bg-muted/50 rounded-lg p-3 space-y-2">
                  {documentsToDelete.map((doc, index) => (
                    <div key={doc.id} className="flex items-start gap-2 text-sm">
                      <span className="text-muted-foreground font-mono min-w-[2rem]">
                        {index + 1}.
                      </span>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium text-foreground truncate">
                          {doc.fileName}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-red-600 font-medium">
                  本当に削除してもよろしいですか?
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? `削除中... (${documentsToDelete.length}件)` : `${documentsToDelete.length}件を削除`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
