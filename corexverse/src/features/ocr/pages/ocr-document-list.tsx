import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { 
  Search, 
  FileText,
  Trash2,
  Download,
  Archive,
  FolderInput,
  ChevronDown,
  Plus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  X,
  SlidersHorizontal
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
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
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import type { OcrDocument } from '@/types'
import ocrDataverseService from '@/services/ocrDataverseService'
import { useOcrStateStore } from '@/stores/ocrStateStore'
import { useMemo, useCallback } from 'react'
import { logger } from '@/lib/logger'

/**
 * OCRドキュメント一覧ページ
 * ファイル単位でのOCR処理結果を一覧表示
 */
export default function OcrDocumentListPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  // Zustandストアから状態を取得・復元
  const { 
    selectedFolderId: storedFolderId,
    setSelectedFolderId: setSelectedFolderIdInStore,
    setCachedDocuments,
    // clearDocumentCache - 削除時は自動的にキャッシュ更新されるため直接使用しない
  } = useOcrStateStore()
  
  // URLパラメータからフォルダIDを取得
  const urlFolderId = searchParams.get('folder')
  
  const [searchKeyword, setSearchKeyword] = useState('')
  // folderFilterはZustandストアのselectedFolderIdを直接使用
  const folderFilter = storedFolderId || ''
  
  // ソート用のstate
  type SortField = 'fileName' | 'status' | 'uploadedDate' | null
  type SortOrder = 'asc' | 'desc'
  const [sortField, setSortField] = useState<SortField>(null)
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  
  // 状態フィルター用の定義
  const statusOptions = [
    { value: 'completed', label: '完了', color: 'bg-green-500' },
    { value: 'processing', label: '処理中', color: 'bg-yellow-500' },
    { value: 'pending', label: '処理待ち', color: 'bg-gray-400' },
    { value: 'uploaded', label: 'アップロード済み', color: 'bg-gray-400' },
  ]
  
  // フィルター用のstate
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  
  // 詳細検索用のstate
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false)
  const [advancedSearchKeyword, setAdvancedSearchKeyword] = useState('')
  const [advancedStatusFilter, setAdvancedStatusFilter] = useState<string[]>([])
  const [advancedDateFrom, setAdvancedDateFrom] = useState('')
  const [advancedDateTo, setAdvancedDateTo] = useState('')
  const [advancedTagSearch, setAdvancedTagSearch] = useState('')
  
  // 適用中の詳細検索条件を保存（追加読込時に使用）
  const [appliedSearchOptions, setAppliedSearchOptions] = useState<any>(null)
  
  // フィルタートグルハンドラー
  const toggleStatusFilter = useCallback((status: string) => {
    setStatusFilter(prev => {
      if (prev.includes(status)) {
        return prev.filter(s => s !== status)
      } else {
        return [...prev, status]
      }
    })
  }, [])
  
  // フィルタークリア
  const clearStatusFilter = useCallback(() => {
    setStatusFilter([])
  }, [])
  
  // 詳細検索の適用 - DBから検索 (初回は20件、追加読込で全件)
  const applyAdvancedSearch = useCallback(async () => {
    setIsLoading(true)
    setIsAdvancedSearchOpen(false)
    
    try {
      // 詳細検索条件でDBから取得 (初回は20件のみ)
      const searchOptions: any = { top: 20 }
      
      if (advancedSearchKeyword.trim()) {
        searchOptions.keyword = advancedSearchKeyword.trim()
      }
      if (advancedStatusFilter.length > 0) {
        searchOptions.statuses = advancedStatusFilter
      }
      if (advancedDateFrom) {
        searchOptions.dateFrom = advancedDateFrom
      }
      if (advancedDateTo) {
        searchOptions.dateTo = advancedDateTo
      }
      if (advancedTagSearch.trim()) {
        searchOptions.tags = advancedTagSearch.trim()
      }
      
      const docs = await ocrDataverseService.getDocuments(
        storedFolderId || undefined,
        searchOptions
      )
      
      // 詳細検索条件を保存（追加読込時に使用）
      setAppliedSearchOptions(searchOptions)
      
      // クライアント側の状態を更新
      setSearchKeyword(advancedSearchKeyword)
      setStatusFilter(advancedStatusFilter)
      setAllDocuments(docs)
      setDisplayedCount(docs.length)
      // 20件取得できた場合は続きがある可能性
      setHasMore(docs.length >= 20)
      setCachedDocuments(docs)
    } catch (error) {
      logger.error('詳細検索エラー', error)
    } finally {
      setIsLoading(false)
    }
  }, [advancedSearchKeyword, advancedStatusFilter, advancedDateFrom, advancedDateTo, advancedTagSearch, storedFolderId, setCachedDocuments])
  
  // カーソルページング用のstate
  const PAGE_SIZE = 20 // 1回に取得する件数
  const RECENT_COUNT = 5 // アップロード後の差分取得件数
  const [hasMore, setHasMore] = useState(true) // さらにデータがあるか
  const [isLoadingMore, setIsLoadingMore] = useState(false) // 追加読込中
  const [isRefreshing, setIsRefreshing] = useState(false) // 差分取得中
  
  // 全件データとページング用state
  const [allDocuments, setAllDocuments] = useState<OcrDocument[]>([])
  const [displayedCount, setDisplayedCount] = useState(PAGE_SIZE)
  
  // Dataverseからデータ取得
  const [documents, setDocuments] = useState<OcrDocument[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [folders, setFolders] = useState<any[]>([])
  const [menuSections, setMenuSections] = useState<any[]>([])
  const [isFolderInitialized, setIsFolderInitialized] = useState(false)
  
  // 削除ダイアログ用state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<OcrDocument | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // 一括削除ダイアログ用state
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
  const [documentsToDelete, setDocumentsToDelete] = useState<OcrDocument[]>([])
  
  // 移動ダイアログ用state
  const [moveDialogOpen, setMoveDialogOpen] = useState(false)
  const [documentToMove, setDocumentToMove] = useState<OcrDocument | null>(null)
  const [targetFolderId, setTargetFolderId] = useState<string>('')
  const [isMoving, setIsMoving] = useState(false)
  
  // フォルダとメニューセクションを取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedFolders, fetchedSections] = await Promise.all([
          ocrDataverseService.getFolders(),
          ocrDataverseService.getMenuSections()
        ])
        setFolders(fetchedFolders)
        setMenuSections(fetchedSections)
      } catch (error) {
        // エラーは無視
      }
    }
    fetchData()
  }, [])

  // フォルダフィルターを初期化（Zustand storeから復元、なければURLまたは最初のフォルダ）
  useEffect(() => {
    if (isFolderInitialized || folders.length === 0) return

    // 1. Zustand storeに保存されたフォルダIDがあればそれを使用（リロード時の復元）
    if (storedFolderId) {
      const storedFolder = folders.find(f => f.id === storedFolderId)
      if (storedFolder) {
        // storedFolderIdがあればfolderFilterに自動反映されるので何もしない
        setIsFolderInitialized(true)
        return
      }
    }

    // 2. URLパラメータでフォルダが指定されている場合
    if (urlFolderId) {
      const urlFolder = folders.find(f => f.id === urlFolderId)
      if (urlFolder) {
        setSelectedFolderIdInStore(urlFolderId)
        setIsFolderInitialized(true)
        return
      }
    }

    // 3. 保存されたフォルダがない、または存在しない場合は最初のフォルダを選択
    const firstFolder = folders[0]
    if (firstFolder) {
      setSelectedFolderIdInStore(firstFolder.id)
      setIsFolderInitialized(true)
    }
  }, [folders, storedFolderId, urlFolderId, isFolderInitialized, setSelectedFolderIdInStore])

  // フォルダ変更時に選択状態をクリア
  useEffect(() => {
    setSelectedIds(new Set())
  }, [storedFolderId])

  // ドキュメント取得（初回20件、追加読込時に全件取得してページング）
  const fetchDocuments = useCallback(async (loadMore: boolean = false, targetFolderId?: string) => {
    if (!loadMore) {
      // 初回読込: 20件のみ取得（高速表示）
      setIsLoading(true)
      try {
        const folderId = targetFolderId !== undefined ? targetFolderId : (storedFolderId || undefined)
        
        // 詳細検索条件がある場合はそれを使用、なければ通常取得
        const options = appliedSearchOptions ? { ...appliedSearchOptions, top: PAGE_SIZE } : { top: PAGE_SIZE }
        const docs = await ocrDataverseService.getDocuments(folderId, options)
        
        setAllDocuments(docs)
        setDisplayedCount(docs.length)
        // 20件取得できた場合は続きがある可能性
        setHasMore(docs.length >= PAGE_SIZE)
        setCachedDocuments(docs)
        
      } catch (error) {
      } finally {
        setIsLoading(false)
      }
    } else {
      // 追加読込: 全件取得して表示件数を増やす
      setIsLoadingMore(true)
      
      try {
        const folderId = targetFolderId !== undefined ? targetFolderId : (storedFolderId || undefined)
        
        // まだ全件取得していない場合は取得
        if (allDocuments.length < 9999 && allDocuments.length % PAGE_SIZE === 0) {
          // 詳細検索条件がある場合はそれを使用、なければ通常取得
          const options = appliedSearchOptions ? { ...appliedSearchOptions, top: 9999 } : { top: 9999 }
          const allDocs = await ocrDataverseService.getDocuments(folderId, options)
          
          setAllDocuments(allDocs)
          const newCount = Math.min(displayedCount + PAGE_SIZE, allDocs.length)
          setDisplayedCount(newCount)
          setHasMore(newCount < allDocs.length)
          setCachedDocuments(allDocs)
        } else {
          // すでに全件取得済みの場合は表示件数だけ増やす
          const newCount = Math.min(displayedCount + PAGE_SIZE, allDocuments.length)
          setDisplayedCount(newCount)
          setHasMore(newCount < allDocuments.length)
        }
      } catch (error) {
      } finally {
        setIsLoadingMore(false)
      }
    }
  }, [PAGE_SIZE, storedFolderId, setCachedDocuments, displayedCount, allDocuments, appliedSearchOptions])

  // 詳細検索のクリア - DB から全データを再取得
  const clearAdvancedSearch = useCallback(async () => {
    // 詳細検索条件をクリア
    setAdvancedSearchKeyword('')
    setAdvancedStatusFilter([])
    setAdvancedDateFrom('')
    setAdvancedDateTo('')
    setAdvancedTagSearch('')
    setSearchKeyword('')
    setStatusFilter([])
    setAppliedSearchOptions(null) // 適用中の検索条件もクリア
    
    // DB から全データを再取得
    await fetchDocuments(false, storedFolderId || undefined)
  }, [fetchDocuments, storedFolderId])

  // 初回データ取得とフォルダ変更時の再取得
  useEffect(() => {
    // フォルダが初期化されていない場合は待機
    if (!isFolderInitialized) return

    const initializeDocuments = async () => {
      // フォルダ変更時は常に最新データを取得(キャッシュ不使用)
      await fetchDocuments(false, storedFolderId || undefined)
    }
    initializeDocuments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFolderInitialized, storedFolderId])
  
  // 表示するドキュメントをallDocumentsから計算
  useEffect(() => {
    const displayed = allDocuments.slice(0, displayedCount)
    setDocuments(displayed)
  }, [allDocuments, displayedCount])
  
  // ドキュメント変更時にキャッシュを更新
  useEffect(() => {
    if (documents.length > 0 && !isLoading) {
      setCachedDocuments(documents)
    }
  }, [documents, isLoading, setCachedDocuments])

  // アップロード完了後のドキュメント更新（差分取得: 最新5件のみ）
  useEffect(() => {
    const handleDocumentsUpdated = async () => {
      try {
        setIsRefreshing(true)
        
        // 最新データのみ取得（差分取得）- 現在のフォルダIDを使用
        const recentDocs = await ocrDataverseService.getDocuments(storedFolderId || undefined, { 
          top: RECENT_COUNT
        })
        
        if (recentDocs && recentDocs.length > 0) {
          // 既存データとマージ（ID重複を除去）
          // サーバー側でソート済み(createdon desc)のため、クライアント側でのソート不要
          setDocuments(prev => {
            const docMap = new Map<string, OcrDocument>()
            
            // 既存データを追加
            prev.forEach(doc => docMap.set(doc.id, doc))
            
            // 新しいデータで上書き（最新情報を優先）
            recentDocs.forEach(doc => docMap.set(doc.id, doc))
            
            // Map から配列に変換（サーバー側ソート済みなので追加ソート不要）
            const merged = Array.from(docMap.values())
            
            return merged
          })
          
          // キャッシュも更新
          setDocuments(current => {
            setCachedDocuments(current)
            return current
          })
        }
      } catch (error) {
        // エラーは無視
        // エラー時は既存データを保持
      } finally {
        setIsRefreshing(false)
      }
    }

    window.addEventListener('documentsUpdated', handleDocumentsUpdated)
    return () => window.removeEventListener('documentsUpdated', handleDocumentsUpdated)
  }, [RECENT_COUNT, storedFolderId, setCachedDocuments])
  
  // パンくずリストを生成（M001>F003/F003形式）




  // ソートハンドラー
  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      // 同じフィールドをクリックした場合は順序を反転
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      // 新しいフィールドの場合は昇順に設定
      setSortField(field)
      setSortOrder('asc')
    }
  }, [sortField, sortOrder])

  // フィルタリングとソート（useMemoで最適化）
  // パフォーマンス最適化: 
  // - フォルダフィルタはサーバー側でgetDocuments(folderId)で既に実行済み
  // - 詳細検索を適用した場合はDB側でフィルタリング済み（クライアント側フィルタ不要）
  // - 通常検索（キーワード、状態フィルター）のみクライアント側でフィルタリング
  const filteredDocuments = useMemo((): OcrDocument[] => {
    let filtered = documents

    // 通常検索: キーワードフィルター（ファイル名とタグで検索）
    // 注意: 詳細検索を適用した場合、searchKeywordにも値が設定されるが
    // DB側で既にフィルタリング済みなので、ここでの追加フィルタリングは不要
    // ただし、通常検索バーでの検索時はクライアント側でフィルタリング
    if (searchKeyword.trim() && !advancedSearchKeyword) {
      const lowerKeyword = searchKeyword.toLowerCase()
      filtered = filtered.filter(doc => 
        doc.fileName.toLowerCase().includes(lowerKeyword) ||
        (doc.tags && doc.tags.some(tag => tag.toLowerCase().includes(lowerKeyword)))
      )
    }

    // 通常検索: 状態フィルター
    // 注意: 詳細検索を適用した場合、statusFilterにも値が設定されるが
    // DB側で既にフィルタリング済みなので、ここでの追加フィルタリングは不要
    if (statusFilter.length > 0 && advancedStatusFilter.length === 0) {
      filtered = filtered.filter(doc => statusFilter.includes(doc.status))
    }

    // ソート処理
    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        let compareResult = 0
        
        switch (sortField) {
          case 'fileName':
            compareResult = a.fileName.localeCompare(b.fileName, 'ja')
            break
          case 'status':
            const statusOrder = { 'completed': 1, 'processing': 2, 'pending': 3, 'uploaded': 4 }
            compareResult = (statusOrder[a.status as keyof typeof statusOrder] || 99) - (statusOrder[b.status as keyof typeof statusOrder] || 99)
            break
          case 'uploadedDate':
            const dateA = a.uploadedDate ? new Date(a.uploadedDate).getTime() : 0
            const dateB = b.uploadedDate ? new Date(b.uploadedDate).getTime() : 0
            compareResult = dateA - dateB
            break
        }
        
        return sortOrder === 'asc' ? compareResult : -compareResult
      })
    }

    return filtered
  }, [documents, searchKeyword, statusFilter, advancedSearchKeyword, advancedStatusFilter, sortField, sortOrder])
  
  // 全件表示（カーソルページングでサーバー側で制御）
  const currentDocuments = filteredDocuments

  // スクロールイベントハンドラ（追加データを読み込む）
  /**
   * 次のページを読み込むハンドラー
   * ボタンクリックで次の20件を追加読み込み
   */
  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoadingMore && !isLoading) {
      fetchDocuments(true) // loadMore = true で追加読み込み
    }
  }, [hasMore, isLoadingMore, isLoading, fetchDocuments])

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

  // 移動ダイアログを開く
  const openMoveDialog = (doc: OcrDocument, e: React.MouseEvent) => {
    e.stopPropagation()
    setDocumentToMove(doc)
    setTargetFolderId(doc.folderId) // 現在のフォルダをデフォルトに設定
    setMoveDialogOpen(true)
  }

  // 移動処理
  const handleMove = async () => {
    if (!documentToMove || !targetFolderId) return
    
    // 同じフォルダへの移動はスキップ
    if (documentToMove.folderId === targetFolderId) {
      setMoveDialogOpen(false)
      setDocumentToMove(null)
      return
    }
    
    setIsMoving(true)
    try {
      await ocrDataverseService.updateDocument(documentToMove.id, { folderId: targetFolderId })
      
      // ローカルstateを更新
      setDocuments(prev => prev.map(d => 
        d.id === documentToMove.id ? { ...d, folderId: targetFolderId } : d
      ))
      
      // メニューの件数を更新するイベントを発火
      window.dispatchEvent(new CustomEvent('documentsUpdated'))
      
      // ダイアログを閉じる
      setMoveDialogOpen(false)
      setDocumentToMove(null)
      
      // 現在のフォルダーが選択されている場合、移動後に一覧から除外
      if (storedFolderId && documentToMove.folderId === storedFolderId && targetFolderId !== storedFolderId) {
        setDocuments(prev => prev.filter(d => d.id !== documentToMove.id))
      }
    } catch (error) {
      alert('ドキュメントの移動に失敗しました')
    } finally {
      setIsMoving(false)
    }
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
      alert('ドキュメントの削除に失敗しました')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleBulkDownload = useCallback(() => {
    if (selectedIds.size === 0) return
    // TODO: 実際のダウンロード処理を実装
  }, [selectedIds])

  const handleBulkArchive = useCallback(() => {
    if (selectedIds.size === 0) return
    // TODO: 実際のアーカイブ処理を実装
  }, [selectedIds])

  // 行クリック時の処理
  const handleRowClick = (doc: OcrDocument) => {
    // OCR実施前でも詳細画面に遷移（画像表示のため）
    navigate(`/ocr/documents/${doc.id}`)
  }

  return (
    <div className="flex flex-col h-full w-full bg-background">
      {/* ローディングバナー（アップロード後の更新中） */}
      {isRefreshing && (
        <div className="bg-primary/10 border-b border-primary/20 px-8 py-3 animate-in fade-in slide-in-from-top-2 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm font-medium text-primary">最新データを取得中...</span>
          </div>
        </div>
      )}

      {/* 固定ヘッダーエリア */}
      <div className="flex-shrink-0">
        {/* Page Header (sidebar header と同じ高さ h-16) */}
        <div className="h-16 px-8 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-primary" />
            <div className="flex items-baseline gap-2">
              <h2 className="text-lg font-semibold text-foreground">ドキュメント</h2>
              <span className="text-sm text-muted-foreground">
                ({filteredDocuments.length}件)
              </span>
            </div>
          </div>
        </div>

        {/* 検索バーとアップロードボタン - 同じ行に配置 */}
        <div className="px-8 py-4 border-b flex items-center gap-4">
          <Button 
            size="default"
            onClick={() => {
              const uploadPath = folderFilter !== 'all'
                ? `/ocr/upload?folder=${folderFilter}`
                : '/ocr/upload'
              navigate(uploadPath)
            }}
            className="flex-shrink-0 min-w-[160px]"
          >
            <Plus className="w-4 h-4 mr-2" />
            新規アップロード
          </Button>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="ドキュメント名で検索..."
              value={searchKeyword}
              onChange={(e) => {
                setSearchKeyword(e.target.value)
              }}
              className="pl-12 h-11 text-base border-border focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <Sheet open={isAdvancedSearchOpen} onOpenChange={setIsAdvancedSearchOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="default" className="flex-shrink-0">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                詳細検索
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[500px] max-w-[500px] sm:max-w-[500px] overflow-y-auto">
              <SheetHeader className="px-2">
                <SheetTitle>詳細検索</SheetTitle>
                <SheetDescription>
                  複数の条件を組み合わせてドキュメントを検索できます
                </SheetDescription>
              </SheetHeader>
              
              <div className="space-y-6 mt-6 px-2">
                {/* ドキュメント名検索 */}
                <div className="space-y-2">
                  <Label htmlFor="advanced-keyword" className="text-sm font-medium">
                    ドキュメント名
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="advanced-keyword"
                      placeholder="ドキュメント名で検索..."
                      value={advancedSearchKeyword}
                      onChange={(e) => setAdvancedSearchKeyword(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* ステータスフィルター */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">ステータス</Label>
                  <div className="space-y-2">
                    {statusOptions.map(option => (
                      <label
                        key={option.value}
                        className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded"
                      >
                        <Checkbox
                          checked={advancedStatusFilter.includes(option.value)}
                          onCheckedChange={() => {
                            setAdvancedStatusFilter(prev => {
                              if (prev.includes(option.value)) {
                                return prev.filter(s => s !== option.value)
                              } else {
                                return [...prev, option.value]
                              }
                            })
                          }}
                          className="w-4 h-4"
                        />
                        <div className="flex items-center gap-2 flex-1">
                          <div className={`h-2 w-2 rounded-full ${option.color}`}></div>
                          <span className="text-sm">{option.label}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 日付範囲 */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">アップロード日</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="date-from" className="text-xs text-muted-foreground">
                        開始日
                      </Label>
                      <DatePicker
                        id="date-from"
                        value={advancedDateFrom}
                        onChange={(date) => setAdvancedDateFrom(date)}
                        placeholder="開始日を選択"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="date-to" className="text-xs text-muted-foreground">
                        終了日
                      </Label>
                      <DatePicker
                        id="date-to"
                        value={advancedDateTo}
                        onChange={(date) => setAdvancedDateTo(date)}
                        placeholder="終了日を選択"
                      />
                    </div>
                  </div>
                </div>

                {/* タグ検索 */}
                <div className="space-y-2">
                  <Label htmlFor="advanced-tags" className="text-sm font-medium">
                    タグ
                  </Label>
                  <Input
                    id="advanced-tags"
                    placeholder="タグで検索..."
                    value={advancedTagSearch}
                    onChange={(e) => setAdvancedTagSearch(e.target.value)}
                  />
                </div>

                {/* アクションボタン */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button 
                    onClick={applyAdvancedSearch}
                    className="flex-1"
                  >
                    検索を適用
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={clearAdvancedSearch}
                    className="flex-1"
                  >
                    クリア
                  </Button>
                </div>

                {/* アクティブフィルター表示 */}
                {(advancedSearchKeyword || advancedStatusFilter.length > 0 || advancedDateFrom || advancedDateTo || advancedTagSearch) && (
                  <div className="p-3 bg-muted rounded-lg space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">適用中の条件:</div>
                    <div className="space-y-1 text-xs">
                      {advancedSearchKeyword && (
                        <div>• キーワード: <span className="font-medium">{advancedSearchKeyword}</span></div>
                      )}
                      {advancedStatusFilter.length > 0 && (
                        <div>• ステータス: <span className="font-medium">{advancedStatusFilter.length}件選択</span></div>
                      )}
                      {advancedDateFrom && (
                        <div>• 開始日: <span className="font-medium">{advancedDateFrom}</span></div>
                      )}
                      {advancedDateTo && (
                        <div>• 終了日: <span className="font-medium">{advancedDateTo}</span></div>
                      )}
                      {advancedTagSearch && (
                        <div>• タグ: <span className="font-medium">{advancedTagSearch}</span></div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      
      {/* テーブルエリア - 上に隙間あり、左右に隙間あり */}
      <div className="flex-1 flex flex-col overflow-hidden px-8 mt-4">
        {/* Table - ヘッダー固定 */}
        <div className="flex-1 flex flex-col border border-border bg-card overflow-auto">
          <table className="w-full table-fixed border-collapse">
            <colgroup>
              <col style={{ width: '25px' }} />
              <col style={{ width: '60px' }} />
              <col style={{ width: '35%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '25%' }} />
              <col style={{ width: '100px' }} />
            </colgroup>
            <thead className="sticky top-0 bg-muted/95 z-10">
                <tr className="bg-muted/50 border-t border-border">
                  <th className="w-[25px] px-2 py-3 text-left border border-border">
                    <Checkbox 
                      checked={currentDocuments.length > 0 && currentDocuments.every(d => selectedIds.has(d.id))}
                      onCheckedChange={toggleAllSelection}
                      className="w-5 h-5 border-2 border-gray-400 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                    />
                  </th>
                  <th className="w-[60px] px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-center border border-border">No.</th>
                  <th className="w-[35%] px-6 py-3 text-left border border-border">
                    <button
                      onClick={() => handleSort('fileName')}
                      className="flex items-center gap-1 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                    >
                      名前
                      {sortField === 'fileName' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-50" />
                      )}
                    </button>
                  </th>
                  <th className="w-[15%] px-6 py-3 text-center border border-border">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleSort('status')}
                        className="flex items-center gap-1 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                      >
                        ステータス
                        {sortField === 'status' ? (
                          sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-50" />
                        )}
                      </button>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="p-1 hover:bg-muted rounded">
                            <Filter className={`w-3 h-3 ${statusFilter.length > 0 ? 'text-primary' : 'text-muted-foreground opacity-50'}`} />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56" align="start">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">ステータスでフィルター</span>
                              {statusFilter.length > 0 && (
                                <button
                                  onClick={clearStatusFilter}
                                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                                >
                                  <X className="w-3 h-3" />
                                  クリア
                                </button>
                              )}
                            </div>
                            <div className="space-y-2">
                              {statusOptions.map(option => (
                                <label
                                  key={option.value}
                                  className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded"
                                >
                                  <Checkbox
                                    checked={statusFilter.includes(option.value)}
                                    onCheckedChange={() => toggleStatusFilter(option.value)}
                                    className="w-4 h-4"
                                  />
                                  <div className="flex items-center gap-2 flex-1">
                                    <div className={`h-2 w-2 rounded-full ${option.color}`}></div>
                                    <span className="text-sm">{option.label}</span>
                                  </div>
                                </label>
                              ))}
                            </div>
                            {statusFilter.length > 0 && (
                              <div className="pt-2 border-t text-xs text-muted-foreground">
                                {statusFilter.length}件のステータスを選択中
                              </div>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </th>
                  <th className="w-[25%] px-6 py-3 text-center border border-border">
                    <button
                      onClick={() => handleSort('uploadedDate')}
                      className="w-full flex items-center justify-center gap-1 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                    >
                      更新日時
                      {sortField === 'uploadedDate' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-50" />
                      )}
                    </button>
                  </th>
                  <th className="w-[100px] px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider text-center border border-border">操作</th>
                </tr>
              </thead>
            <TableBody className="divide-y divide-border bg-card">
              {isLoading && currentDocuments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex items-center justify-center gap-3 text-muted-foreground">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                      <span>データを読み込み中...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : currentDocuments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                    該当するドキュメントが見つかりません
                  </TableCell>
                </TableRow>
              ) : (
                currentDocuments.map((doc, index) => {
                  const isSelected = selectedIds.has(doc.id)
                  return (
                    <TableRow 
                      key={doc.id}
                      className={`group transition-colors cursor-pointer ${isSelected ? 'bg-accent/50 hover:bg-accent/70' : 'bg-card hover:bg-muted/50'}`}
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest('[role="checkbox"]') || 
                            (e.target as HTMLElement).closest('button')) return
                        handleRowClick(doc)
                      }}
                    >
                      <TableCell className="px-2 py-3 text-left border border-border">
                        <Checkbox 
                          checked={isSelected}
                          onCheckedChange={() => toggleSelection(doc.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-5 h-5 border-2 border-gray-400 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                        />
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center border border-border">
                        <span className="text-sm font-medium text-muted-foreground">{index + 1}</span>
                      </TableCell>
                      <TableCell className="px-6 py-3 border border-border">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                          <span className="font-medium text-foreground truncate">{doc.fileName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-3 text-center border border-border">
                        <div className="flex items-center justify-center gap-2">
                          <div className={`h-2 w-2 rounded-full flex-shrink-0 ${
                            doc.status === 'completed' ? 'bg-green-500' : 
                            doc.status === 'processing' ? 'bg-yellow-500' : 
                            'bg-gray-400'
                          }`}></div>
                          <span className="text-sm text-muted-foreground whitespace-nowrap">
                            {doc.status === 'completed' ? '完了' : 
                             doc.status === 'processing' ? '処理中' : 
                             doc.status === 'pending' ? '処理待ち' : 'アップロード済み'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-3 text-center border border-border">
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {doc.uploadedDate ? format(new Date(doc.uploadedDate), 'yyyy/MM/dd', { locale: ja }) : '-'}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-3 text-center border border-border">
                        {/* インラインアクション（ホバー時表示） */}
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            className="p-1 text-muted-foreground hover:text-foreground rounded"
                            onClick={(e) => openMoveDialog(doc, e)}
                            title="移動"
                          >
                            <FolderInput className="w-4 h-4" />
                          </button>
                          <button 
                            className="p-1 text-muted-foreground hover:text-destructive rounded"
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
          </table>
        </div>

        {/* ページングと一括操作エリア */}
        <div className="flex-shrink-0 bg-background px-8 space-y-4">
          {/* ページングボタン */}
          {hasMore && !isLoading && (
            <div className="flex items-center justify-center py-4">
            <Button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              variant="outline"
              size="lg"
              className="min-w-[200px]"
            >
              {isLoadingMore ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                  読み込み中...
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  さらに20件を読み込む
                </>
              )}
            </Button>
            </div>
          )}
          
          {/* データ終了メッセージ */}
          {!isLoading && !hasMore && filteredDocuments.length > 0 && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">すべてのドキュメントを表示しました ({filteredDocuments.length}件)</p>
            </div>
          )}

          {/* 一括操作フッター（選択時のみ表示） */}
          {selectedIds.size > 0 && (
            <div className="border border-border bg-card p-4 shadow-sm mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="bg-primary/10 text-primary px-3 py-1.5 rounded-md text-sm font-medium">
                    {selectedIds.size}件選択
                  </span>
                  <div className="h-4 w-px bg-border"></div>
                  <button 
                    onClick={() => setSelectedIds(new Set())}
                    className="text-sm text-muted-foreground hover:text-primary font-medium transition-colors"
                  >
                    すべて選択解除
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={handleBulkDownload}
                    title="ダウンロード"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={handleBulkArchive}
                    title="アーカイブ"
                  >
                    <Archive className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={openBulkDeleteDialog}
                    className="text-muted-foreground hover:text-destructive"
                    title="削除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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

      {/* 移動確認ダイアログ */}
      <AlertDialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ドキュメントを移動</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                {documentToMove && (
                  <>
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-gray-900">{documentToMove.fileName}</span>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="target-folder" className="text-sm font-medium">
                        移動先フォルダを選択
                      </Label>
                      <select
                        id="target-folder"
                        value={targetFolderId}
                        onChange={(e) => setTargetFolderId(e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 max-h-[300px]"
                      >
                        {menuSections.map(menu => {
                          // このメニューに属するフォルダをフィルタ
                          const menuFolders = folders.filter(f => 
                            !f.menuSection || f.menuSection === 'all-docs' 
                              ? menu.id === 'all-docs' 
                              : f.menuSection === menu.id
                          )
                          
                          // 階層構造を構築
                          const buildHierarchy = (parentId: string | null, depth: number = 0): any[] => {
                            const result: any[] = []
                            const children = menuFolders.filter(f => f.parentId === parentId)
                            
                            children.forEach(folder => {
                              result.push({ folder, depth })
                              result.push(...buildHierarchy(folder.id, depth + 1))
                            })
                            
                            return result
                          }
                          
                          const hierarchy = buildHierarchy(null)
                          
                          if (hierarchy.length === 0) return null
                          
                          return [
                            <optgroup key={`menu-${menu.id}`} label={menu.name}>
                              {hierarchy.map(({ folder, depth }) => (
                                <option key={folder.id} value={folder.id}>
                                  {'\u3000'.repeat(depth * 2)}{folder.name}
                                </option>
                              ))}
                            </optgroup>
                          ]
                        })}
                      </select>
                    </div>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isMoving}>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMove}
              disabled={isMoving || !targetFolderId || (documentToMove ? documentToMove.folderId === targetFolderId : false)}
            >
              {isMoving ? '移動中...' : '移動'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
