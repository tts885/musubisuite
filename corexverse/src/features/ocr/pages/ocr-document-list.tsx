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

/**
 * OCRドキュメント一覧ページ
 * ファイル単位でのOCR処理結果を一覧表示
 */
export default function OcrDocumentListPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  // Zustandストアから状態を取得・復元
  const { setSelectedFolderId: setSelectedFolderIdInStore } = useOcrStateStore()
  
  // URLパラメータからフォルダIDを取得
  const urlFolderId = searchParams.get('folder')
  
  const [searchKeyword, setSearchKeyword] = useState('')
  const [folderFilter, setFolderFilter] = useState<string>(urlFolderId || 'all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20
  
  // Dataverseからデータ取得
  const [documents, setDocuments] = useState<OcrDocument[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  
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

  // ドキュメント取得
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const docs = await ocrDataverseService.getDocuments()
        setDocuments(docs)
      } catch (error) {
        console.error('ドキュメント取得エラー:', error)
      }
    }
    fetchDocuments()
  }, [])
  
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

  // フィルタリング
  const getFilteredDocuments = (): OcrDocument[] => {
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
  }

  const filteredDocuments = getFilteredDocuments()
  
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

  // 削除処理
  const handleDelete = (id: string) => {
    if (confirm('このドキュメントを削除してもよろしいですか?')) {
      // TODO: 実際の削除APIを呼び出す
      console.log('Delete document:', id)
    }
  }

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return
    if (confirm(`選択した${selectedIds.size}件のドキュメントを削除してもよろしいですか?`)) {
      // TODO: 実際の一括削除APIを呼び出す
      console.log('Bulk delete:', Array.from(selectedIds))
      setSelectedIds(new Set())
    }
  }

  const handleBulkDownload = () => {
    if (selectedIds.size === 0) return
    console.log('Bulk download:', Array.from(selectedIds))
  }

  const handleBulkArchive = () => {
    if (selectedIds.size === 0) return
    console.log('Bulk archive:', Array.from(selectedIds))
  }

  // 行クリック時の処理
  const handleRowClick = (doc: OcrDocument) => {
    if (doc.ocrResult) {
      navigate(`/ocr/documents/${doc.id}`)
    }
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

      {/* 一括操作バー（選択時のみ表示） */}
      {selectedIds.size > 0 && (
        <div className="mx-8 mb-4 bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex items-center justify-between transition-all duration-300">
          <div className="flex items-center gap-4">
            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-md text-sm font-medium">
              {selectedIds.size}件選択
            </span>
            <div className="h-4 w-px bg-indigo-200"></div>
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
              onClick={handleBulkDelete}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" 
              title="削除"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* テーブル */}
      <div className="flex-1 overflow-auto px-8 pb-6">
        <div className="bg-white border border-gray-200 shadow-sm rounded-lg">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 border-b border-gray-200">
                <TableHead className="w-[4%] p-4">
                  <Checkbox 
                    checked={currentDocuments.length > 0 && currentDocuments.every(d => selectedIds.has(d.id))}
                    onCheckedChange={toggleAllSelection}
                    className="text-indigo-600"
                  />
                </TableHead>
                <TableHead className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">名前</TableHead>
                <TableHead className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</TableHead>
                <TableHead className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">作成者</TableHead>
                <TableHead className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">更新日時</TableHead>
                <TableHead className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 bg-white">
              {currentDocuments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-gray-500">
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
                      <TableCell className="p-4">
                        <Checkbox 
                          checked={isSelected}
                          onCheckedChange={() => toggleSelection(doc.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="text-indigo-600"
                        />
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          <span className="font-medium text-gray-900">{doc.fileName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${
                            doc.status === 'completed' ? 'bg-green-500' : 
                            doc.status === 'processing' ? 'bg-yellow-500' : 
                            'bg-gray-400'
                          }`}></div>
                          <span className="text-sm text-gray-600">
                            {doc.status === 'completed' ? '完了' : 
                             doc.status === 'processing' ? '処理中' : 
                             doc.status === 'pending' ? '処理待ち' : 'アップロード済み'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 flex-shrink-0">
                            {doc.fileName.substring(0, 1).toUpperCase()}
                          </div>
                          <span className="text-sm text-gray-600">ユーザー</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <span className="text-sm text-gray-500">
                          {doc.uploadedDate ? format(new Date(doc.uploadedDate), 'yyyy/MM/dd', { locale: ja }) : '-'}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
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
                            onClick={(e) => { 
                              e.stopPropagation()
                              handleDelete(doc.id)
                            }}
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
    </div>
  )
}
