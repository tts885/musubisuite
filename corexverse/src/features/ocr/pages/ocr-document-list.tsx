import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import {
  Search,
  Filter,
  CheckCircle,
  Clock,
  FileText,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { formatBytes } from '@/lib/utils'
import type { OcrDocument, OcrFolder } from '@/types'
import { useOcrFolders, useMenuSections } from '@/hooks/useOcrDataverse'
import ocrDataverseService from '@/services/ocrDataverseService'

interface FolderTreeNode {
  folder: OcrFolder
  children: FolderTreeNode[]
}

/**
 * OCRドキュメント一覧ページ
 * ファイル単位でのOCR処理結果を一覧表示
 */
export default function OcrDocumentListPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [searchKeyword, setSearchKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [folderFilter, setFolderFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Dataverseからデータ取得
  const { folders } = useOcrFolders()
  const { sections: menuSections } = useMenuSections()
  const [documents, setDocuments] = useState<OcrDocument[]>([])

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

  // フォルダツリーを構築
  const buildFolderTree = (parentId: string | null = null): FolderTreeNode[] => {
    return folders
      .filter(folder => folder.parentId === parentId)
      .map(folder => ({
        folder,
        children: buildFolderTree(folder.id)
      }))
  }

  const folderTree = buildFolderTree()
  const currentFolder = folderFilter !== 'all' ? folders.find(f => f.id === folderFilter) : null

  // パンくずリストを生成（M001>F003/F003形式）
  const getBreadcrumbPath = () => {
    if (!currentFolder) return null

    // メニューセクション名を取得
    const menuSection = menuSections.find(m => m.id === currentFolder.menuSection)
    const menuName = menuSection ? menuSection.name : 'すべてのドキュメント'

    // フォルダの階層パスを構築
    const buildFolderPath = (folderId: string): string[] => {
      const folder = folders.find(f => f.id === folderId)
      if (!folder) return []

      const path: string[] = [folder.name]
      if (folder.parentId) {
        path.unshift(...buildFolderPath(folder.parentId))
      }
      return path
    }

    const folderPath = buildFolderPath(currentFolder.id)

    return {
      menuName,
      folderPath
    }
  }

  const breadcrumb = getBreadcrumbPath()

  // フォルダツリーを平坦化して選択肖を生成
  const flattenFolderTree = (nodes: FolderTreeNode[], depth: number = 0): Array<{ node: FolderTreeNode, depth: number }> => {
    const result: Array<{ node: FolderTreeNode, depth: number }> = []
    nodes.forEach(node => {
      result.push({ node, depth })
      if (node.children && node.children.length > 0) {
        result.push(...flattenFolderTree(node.children, depth + 1))
      }
    })
    return result
  }

  const flatFolders = flattenFolderTree(folderTree)

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

    // ステータスフィルター
    if (statusFilter !== 'all') {
      filtered = filtered.filter(doc => doc.status === statusFilter)
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

  // ステータスバッジ
  const getStatusBadge = (doc: OcrDocument) => {
    switch (doc.status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-600 dark:bg-green-700"><CheckCircle className="w-3 h-3 mr-1" />完了</Badge>
      case 'processing':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />処理中</Badge>
      case 'error':
        return <Badge variant="destructive">失敗</Badge>
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />処理待ち</Badge>
      case 'uploaded':
      default:
        return <Badge variant="secondary">アップロード済み</Badge>
    }
  }

  // 信頼度バッジ（現在は使用しない）
  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.95) {
      return <Badge variant="default" className="bg-green-600 dark:bg-green-700">{(confidence * 100).toFixed(0)}%</Badge>
    } else if (confidence >= 0.85) {
      return <Badge variant="secondary" className="bg-yellow-600 dark:bg-yellow-700">{(confidence * 100).toFixed(0)}%</Badge>
    } else {
      return <Badge variant="destructive">{(confidence * 100).toFixed(0)}%</Badge>
    }
  }

  // 行クリック時の処理
  const handleRowClick = (doc: OcrDocument, e: React.MouseEvent) => {
    // チェックボックスクリック時は行クリックを無視
    if ((e.target as HTMLElement).closest('[data-checkbox]')) {
      return
    }
    if (doc.ocrResult) {
      navigate(`/ocr/documents/${doc.id}`)
    }
  }

  // 全選択/全解除
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDocuments(currentDocuments.map(doc => doc.id))
    } else {
      setSelectedDocuments([])
    }
  }

  // 個別選択
  const handleSelectDocument = (documentId: string, checked: boolean) => {
    if (checked) {
      setSelectedDocuments(prev => [...prev, documentId])
    } else {
      setSelectedDocuments(prev => prev.filter(id => id !== documentId))
    }
  }

  // 削除処理
  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await ocrDataverseService.deleteDocuments(selectedDocuments)

      if (result.success > 0) {
        toast.success(`${result.success}件のドキュメントを削除しました`)
        // ドキュメントリストを再取得
        const docs = await ocrDataverseService.getDocuments()
        setDocuments(docs)
        setSelectedDocuments([])
      }

      if (result.failed > 0) {
        toast.error(`${result.failed}件のドキュメントの削除に失敗しました`)
      }
    } catch (error) {
      console.error('削除エラー:', error)
      toast.error('ドキュメントの削除に失敗しました')
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  // 統計情報
  const filteredStats = {
    total: filteredDocuments.length,
    completed: filteredDocuments.filter(d => d.ocrResult?.status === 'completed').length,
    pending: filteredDocuments.filter(d => !d.ocrResult).length,
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* ヘッダー */}
      <div className="border-b border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {breadcrumb ? (
                <>
                  <span className="text-muted-foreground text-base">{breadcrumb.menuName} &gt; </span>
                  {breadcrumb.folderPath.map((name, index) => (
                    <span key={index}>
                      {index > 0 && <span className="text-muted-foreground text-base">/</span>}
                      {index === breadcrumb.folderPath.length - 1 ? (
                        <span>{name}</span>
                      ) : (
                        <span className="text-muted-foreground text-base">{name}</span>
                      )}
                    </span>
                  ))}
                </>
              ) : (
                'OCRドキュメント一覧'
              )}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {currentFolder && currentFolder.description && (
                <span className="mr-4">{currentFolder.description} | </span>
              )}
              全 <span className="text-foreground font-semibold">{filteredStats.total}</span> 件 | 完了 <span className="text-foreground font-semibold">{filteredStats.completed}</span> 件 | 処理待ち <span className="text-foreground font-semibold">{filteredStats.pending}</span> 件
            </p>
          </div>
          <div className="flex gap-2">
            {selectedDocuments.length > 0 && (
              <Button
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={isDeleting}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                削除 ({selectedDocuments.length})
              </Button>
            )}
            <Button onClick={() => {
              // 現在のフォルダフィルターがあれば、そのフォルダIDを渡す
              const uploadPath = folderFilter !== 'all'
                ? `/ocr/upload?folder=${folderFilter}`
                : '/ocr/upload'
              navigate(uploadPath)
            }}>
              <FileText className="w-4 h-4 mr-2" />
              新規アップロード
            </Button>
          </div>
        </div>

        {/* 検索・フィルター */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="ファイル名、タグで検索..."
              value={searchKeyword}
              onChange={(e) => {
                setSearchKeyword(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-10"
            />
          </div>

          <Select value={folderFilter} onValueChange={(value) => {
            setFolderFilter(value)
            setCurrentPage(1)
          }}>
            <SelectTrigger className="w-[250px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="フォルダ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべてのフォルダ</SelectItem>
              {flatFolders.map(({ node, depth }) => (
                <SelectItem key={node.folder.id} value={node.folder.id}>
                  <div className="flex items-center gap-2">
                    <span style={{ marginLeft: `${depth * 16}px` }}>
                      {depth > 0 && '└ '}
                    </span>
                    <div
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: node.folder.color }}
                    />
                    <span>{node.folder.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(value) => {
            setStatusFilter(value)
            setCurrentPage(1)
          }}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="ステータス" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="completed">完了</SelectItem>
              <SelectItem value="pending">処理待ち</SelectItem>
              <SelectItem value="processing">処理中</SelectItem>
              <SelectItem value="failed">失敗</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* テーブル */}
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-card rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[5%]">
                  <Checkbox
                    data-checkbox
                    checked={currentDocuments.length > 0 && selectedDocuments.length === currentDocuments.length}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-[6%]">No.</TableHead>
                <TableHead className="w-[30%]">ファイル名</TableHead>
                <TableHead className="w-[12%]">ステータス</TableHead>
                <TableHead className="w-[10%]">信頼度</TableHead>
                <TableHead className="w-[10%]">サイズ</TableHead>
                <TableHead className="w-[15%]">アップロード日時</TableHead>
                <TableHead className="w-[12%]">タグ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentDocuments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    該当するドキュメントが見つかりません
                  </TableCell>
                </TableRow>
              ) : (
                currentDocuments.map((doc, index) => (
                  <TableRow
                    key={doc.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={(e) => handleRowClick(doc, e)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        data-checkbox
                        checked={selectedDocuments.includes(doc.id)}
                        onCheckedChange={(checked) => handleSelectDocument(doc.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {startIndex + index + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        {doc.fileName}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(doc)}</TableCell>
                    <TableCell>
                      {doc.ocrResult ? getConfidenceBadge(doc.ocrResult.overallConfidence) : '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatBytes(doc.fileSize)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {doc.uploadedDate ? format(new Date(doc.uploadedDate), 'yyyy/MM/dd HH:mm', { locale: ja }) : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {doc.tags && doc.tags.slice(0, 2).map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {doc.tags && doc.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{doc.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
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

      {/* 削除確認ダイアログ */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ドキュメントを削除しますか?</AlertDialogTitle>
            <AlertDialogDescription>
              選択した{selectedDocuments.length}件のドキュメントを削除します。
              この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? '削除中...' : '削除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
