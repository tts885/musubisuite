/**
 * OCRアップロードページ
 * 
 * 複数ファイルの一括アップロードとOCRタスクの作成を行います。
 * 
 * @component
 * 
 * @description
 * - 複数ファイルの一括アップロード(最大10ファイル)
 * - アップロード進捗表示
 * - タスク名の設定
 * - アップロード完了後にタスク一覧へ遷移
 * 
 * @returns {JSX.Element} OCRアップロードUI
 * 
 * @example
 * ```tsx
 * // router.tsxでの使用
 * {
 *   path: "/ocr/upload",
 *   element: <OcrUploadPage />
 * }
 * ```
 */

import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { ArrowLeft, Upload, CheckCircle, Folder } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import OcrFileUpload from "@/components/ocr/OcrFileUpload"
import { toast } from "sonner"
import { formatBytes } from "@/lib/utils"
import { getFolderById, buildFolderTree, type FolderTreeNode } from "@/data/mockOcrData"

/**
 * アップロード状態
 */
type UploadState = 'idle' | 'uploading' | 'processing' | 'completed' | 'error'

/**
 * OCRアップロードページ
 */
export default function OcrUploadPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFolderId, setSelectedFolderId] = useState<string>('')
  
  const folderTree = buildFolderTree()
  const selectedFolder = selectedFolderId ? getFolderById(selectedFolderId) : null
  
  // URLパラメータからフォルダIDを取得
  useEffect(() => {
    const folderParam = searchParams.get('folder')
    if (folderParam) {
      setSelectedFolderId(folderParam)
    }
  }, [searchParams])
  
  // フォルダツリーを平坦化して選択肢を生成
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

  /**
   * ファイル選択処理
   * 
   * @param {File[]} files - 選択されたファイル
   */
  const handleFilesSelect = (files: File[]) => {
    setSelectedFiles(files)
  }

  /**
   * ファイル削除処理
   * 
   * @param {number} index - 削除するファイルのインデックス
   */
  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  /**
   * アップロード開始処理
   */
  const handleStartUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('ファイルを選択してください')
      return
    }
    
    if (!selectedFolderId) {
      toast.error('保存先フォルダを選択してください')
      return
    }

    try {
      setUploadState('uploading')
      setUploadProgress(0)

      // TODO: Backend実装後は実際のAPIを呼び出す
      // const formData = new FormData()
      // formData.append('folderId', selectedFolderId)
      // selectedFiles.forEach((file, index) => {
      //   formData.append(`files[${index}]`, file)
      // })
      // const response = await ocrService.uploadDocuments(formData)
      
      console.log('アップロード情報:', {
        folderId: selectedFolderId,
        folderPath: selectedFolder?.path,
        fileCount: selectedFiles.length,
      })

      // シミュレーション: アップロード進捗
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100))
        setUploadProgress(i)
      }

      setUploadState('processing')
      
      // シミュレーション: OCR処理開始
      await new Promise(resolve => setTimeout(resolve, 500))

      setUploadState('completed')
      toast.success('タスクを作成しました')

      // タスク一覧へ遷移
      setTimeout(() => {
        navigate('/ocr')
      }, 1000)
    } catch (error) {
      console.error('Upload error:', error)
      setUploadState('error')
      toast.error('アップロードに失敗しました')
    }
  }

  /**
   * キャンセル処理
   */
  const handleCancel = () => {
    if (uploadState === 'uploading' || uploadState === 'processing') {
      // TODO: アップロードのキャンセル処理
      toast.info('アップロードをキャンセルしました')
    }
    navigate('/ocr')
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* ヘッダー */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={uploadState === 'uploading'}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">新規アップロード</h1>
            <p className="text-sm text-muted-foreground mt-1">
              帳票ファイルをアップロードしてOCR処理を開始します
            </p>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 保存先フォルダ選択 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">保存先フォルダ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="folder">保存先フォルダ *</Label>
                <Select 
                  value={selectedFolderId} 
                  onValueChange={setSelectedFolderId}
                  disabled={uploadState !== 'idle'}
                >
                  <SelectTrigger id="folder">
                    <SelectValue placeholder="フォルダを選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {flatFolders.map(({ node, depth }) => (
                      <SelectItem key={node.id} value={node.id}>
                        <div className="flex items-center gap-2">
                          <span style={{ marginLeft: `${depth * 16}px` }}>
                            {depth > 0 && '└ '}
                          </span>
                          <Folder 
                            className="w-4 h-4" 
                            style={{ color: node.color }}
                          />
                          <span>{node.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedFolder && (
                  <p className="text-xs text-muted-foreground">
                    選択中: {selectedFolder.path}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ファイルアップロード */}
          {uploadState === 'idle' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ファイル選択</CardTitle>
              </CardHeader>
              <CardContent>
                <OcrFileUpload
                  onFilesSelect={handleFilesSelect}
                  maxFiles={10}
                />
              </CardContent>
            </Card>
          )}

          {/* 選択されたファイル一覧 */}
          {selectedFiles.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">選択ファイル</CardTitle>
                  <Badge variant="secondary">
                    {selectedFiles.length} ファイル
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex-1 min-w-0 mr-4">
                        <p className="font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatBytes(file.size)} • {file.type || 'Unknown type'}
                        </p>
                      </div>
                      {uploadState === 'idle' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFile(index)}
                        >
                          削除
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* アップロード進捗 */}
          {(uploadState === 'uploading' || uploadState === 'processing') && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {uploadState === 'uploading' ? 'アップロード中...' : 'OCR処理を開始しています...'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={uploadProgress} />
                <p className="text-sm text-muted-foreground text-center">
                  {uploadState === 'uploading' 
                    ? `${uploadProgress}% - ファイルをアップロード中`
                    : 'OCR処理タスクを作成中...'}
                </p>
              </CardContent>
            </Card>
          )}

          {/* 完了メッセージ */}
          {uploadState === 'completed' && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
                <h3 className="text-lg font-semibold text-green-900 mb-2">
                  アップロード完了
                </h3>
                <p className="text-sm text-green-700">
                  タスク一覧ページに移動します...
                </p>
              </CardContent>
            </Card>
          )}

          {/* アクションボタン */}
          {uploadState === 'idle' && (
            <div className="flex items-center justify-end gap-3">
              <Button variant="outline" onClick={handleCancel}>
                キャンセル
              </Button>
              <Button
                onClick={handleStartUpload}
                disabled={selectedFiles.length === 0 || !selectedFolderId}
              >
                <Upload className="h-4 w-4 mr-2" />
                アップロード開始
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
