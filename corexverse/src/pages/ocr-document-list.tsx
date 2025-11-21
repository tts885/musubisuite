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
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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

import { mockOcrDocuments, getDocumentsByFolder, getFolderById, buildFolderTree, type FolderTreeNode } from '@/data/mockOcrData'
import { formatBytes } from '@/lib/utils'
import type { OcrDocument } from '@/types'

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

  const folderTree = buildFolderTree()
  const currentFolder = folderFilter !== 'all' ? getFolderById(folderFilter) : null
  
  // フォルダツリーを平坦化して選択肖を生成
  const flattenFolderTree = (nodes: FolderTreeNode[], depth: number = 0): Array<{node: FolderTreeNode, depth: number}> => {
    const result: Array<{node: FolderTreeNode, depth: number}> = []
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
    let filtered = mockOcrDocuments

    // フォルダフィルター
    if (folderFilter !== 'all') {
      filtered = getDocumentsByFolder(folderFilter)
    }

    // ステータスフィルター
    if (statusFilter === 'completed') {
      filtered = filtered.filter(doc => doc.ocrResult?.status === 'completed')
    } else if (statusFilter === 'pending') {
      filtered = filtered.filter(doc => doc.ocrResult === null)
    } else if (statusFilter === 'processing') {
      filtered = filtered.filter(doc => doc.ocrResult?.status === 'processing')
    } else if (statusFilter === 'failed') {
      filtered = filtered.filter(doc => doc.ocrResult?.status === 'failed')
    }

    // 検索フィルター
    if (searchKeyword.trim()) {
      const lowerKeyword = searchKeyword.toLowerCase()
      filtered = filtered.filter(doc => 
        doc.fileName.toLowerCase().includes(lowerKeyword) ||
        doc.tags.some(tag => tag.toLowerCase().includes(lowerKeyword))
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
    if (!doc.ocrResult) {
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />処理待ち</Badge>
    }
    
    switch (doc.ocrResult.status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-600 dark:bg-green-700"><CheckCircle className="w-3 h-3 mr-1" />完了</Badge>
      case 'processing':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />処理中</Badge>
      case 'failed':
        return <Badge variant="destructive">失敗</Badge>
      default:
        return <Badge variant="secondary">不明</Badge>
    }
  }

  // 信頼度バッジ
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
  const handleRowClick = (doc: OcrDocument) => {
    if (doc.ocrResult) {
      navigate(`/ocr/documents/${doc.id}`)
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
              {currentFolder ? (
                <>
                  <span className="text-muted-foreground text-base">{currentFolder.path}/</span>
                  {currentFolder.name}
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
                <SelectItem key={node.id} value={node.id}>
                  <div className="flex items-center gap-2">
                    <span style={{ marginLeft: `${depth * 16}px` }}>
                      {depth > 0 && '└ '}
                    </span>
                    <div 
                      className="w-3 h-3 rounded-sm" 
                      style={{ backgroundColor: node.color }}
                    />
                    <span>{node.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({node.documentCount})
                    </span>
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
                <TableHead className="w-[8%]">No.</TableHead>
                <TableHead className="w-[32%]">ファイル名</TableHead>
                <TableHead className="w-[12%]">ステータス</TableHead>
                <TableHead className="w-[10%]">信頼度</TableHead>
                <TableHead className="w-[10%]">サイズ</TableHead>
                <TableHead className="w-[15%]">アップロード日時</TableHead>
                <TableHead className="w-[13%]">タグ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentDocuments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    該当するドキュメントが見つかりません
                  </TableCell>
                </TableRow>
              ) : (
                currentDocuments.map((doc, index) => (
                  <TableRow 
                    key={doc.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(doc)}
                  >
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
                      {format(doc.uploadedAt, 'yyyy/MM/dd HH:mm', { locale: ja })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {doc.tags.slice(0, 2).map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {doc.tags.length > 2 && (
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
    </div>
  )
}
