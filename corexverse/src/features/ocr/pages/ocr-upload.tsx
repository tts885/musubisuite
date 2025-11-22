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

import { useState, useEffect, useMemo } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { ArrowLeft, Upload, CheckCircle, Folder, ChevronRight } from "lucide-react"
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
import { useMenuSections, useOcrFolders } from "@/hooks/useOcrDataverse"
import ocrDataverseService from "@/services/ocrDataverseService"
import type { OcrFolder, OcrDocument } from "@/types"

/**
 * アップロード状態
 */
type UploadState = 'idle' | 'uploading' | 'processing' | 'completed' | 'error'

/**
 * フォルダ階層表示用の型
 */
interface FlatFolder {
  folder: OcrFolder
  depth: number
  path: string
}

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

  // Dataverseからメニューセクションとフォルダを取得
  const { sections: menuSections } = useMenuSections()
  const { folders, loading: foldersLoading } = useOcrFolders()

  // 選択されたフォルダを取得
  const selectedFolder = useMemo(() =>
    folders.find(f => f.id === selectedFolderId),
    [folders, selectedFolderId]
  )

  // 選択されたフォルダの完全なパス（メニュー名を含む）
  const selectedFolderFullPath = useMemo(() => {
    if (!selectedFolder) return ''

    const menu = menuSections.find(m => m.id === selectedFolder.menuSection)
    const menuName = menu?.name || 'メニュー'

    return `${menuName} > ${selectedFolder.path}`
  }, [selectedFolder, menuSections])

  // URLパラメータからフォルダIDを取得
  useEffect(() => {
    const folderParam = searchParams.get('folder')
    if (folderParam) {
      setSelectedFolderId(folderParam)
    }
  }, [searchParams])

  // メニューセクションごとにフォルダをグループ化して表示用データを構築
  const foldersByMenu = useMemo(() => {
    const result: Array<{ type: 'menu', menuId: string, menuName: string } | { type: 'folder', data: FlatFolder }> = []

    // フォルダの階層構造を構築する関数
    const buildHierarchy = (parentId: string | null, menuSectionId: string, depth: number = 0): FlatFolder[] => {
      const hierarchyResult: FlatFolder[] = []
      const children = folders.filter(f =>
        f.parentId === parentId &&
        f.menuSection === menuSectionId
      )

      children.forEach(folder => {
        const path = folder.path || `/${folder.name}`

        hierarchyResult.push({
          folder,
          depth,
          path
        })

        // 子フォルダを再帰的に追加
        hierarchyResult.push(...buildHierarchy(folder.id, menuSectionId, depth + 1))
      })

      return hierarchyResult
    }

    // 各メニューセクションごとにフォルダをグループ化
    menuSections.forEach(menu => {
      const menuFolders = buildHierarchy(null, menu.id, 0)

      if (menuFolders.length > 0) {
        // メニューヘッダーを追加
        result.push({
          type: 'menu',
          menuId: menu.id,
          menuName: menu.name
        })

        // そのメニュー配下のフォルダを追加
        menuFolders.forEach(flatFolder => {
          result.push({
            type: 'folder',
            data: flatFolder
          })
        })
      }
    })

    return result
  }, [folders, menuSections])

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

      const totalFiles = selectedFiles.length
      let uploadedCount = 0

      // 各ファイルを順次アップロード
      for (const file of selectedFiles) {
        try {
          const document: Partial<OcrDocument> = {
            name: file.name,
            folderId: selectedFolderId,
            status: 'uploaded',
          }

          await ocrDataverseService.createDocument(document, file)

          uploadedCount++
          const progress = Math.round((uploadedCount / totalFiles) * 100)
          setUploadProgress(progress)

          toast.success(`${file.name} をアップロードしました`)
        } catch (error) {
          console.error(`ファイルアップロードエラー: ${file.name}`, error)
          toast.error(`${file.name} のアップロードに失敗しました`)
        }
      }

      setUploadState('completed')
      toast.success(`${uploadedCount}件のファイルをアップロードしました`)

      // カスタムイベントを発火してドキュメント数を更新
      window.dispatchEvent(new CustomEvent('documentsUpdated'))

      // ドキュメント一覧へ遷移
      setTimeout(() => {
        navigate(`/ocr?folder=${selectedFolderId}`)
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
                  disabled={uploadState !== 'idle' || foldersLoading}
                >
                  <SelectTrigger id="folder" className="h-12 text-base w-full">
                    <SelectValue placeholder={
                      foldersLoading
                        ? "読み込み中..."
                        : foldersByMenu.filter(item => item.type === 'folder').length === 0
                          ? "フォルダがありません"
                          : "フォルダを選択してください"
                    } />
                  </SelectTrigger>
                  <SelectContent className="max-h-[500px] w-full min-w-[400px]">
                    {foldersByMenu.map((item) => {
                      if (item.type === 'menu') {
                        return (
                          <div
                            key={`menu-${item.menuId}`}
                            className="px-3 py-2 text-sm font-semibold text-muted-foreground bg-muted/50 sticky top-0"
                          >
                            {item.menuName}
                          </div>
                        )
                      } else {
                        const { folder, depth } = item.data
                        return (
                          <SelectItem key={folder.id} value={folder.id} className="py-3">
                            <div className="flex items-center gap-2">
                              <span style={{ marginLeft: `${depth * 16}px` }}>
                                {depth > 0 && <ChevronRight className="w-4 h-4 inline" />}
                              </span>
                              <Folder
                                className="w-5 h-5"
                                style={{ color: folder.color }}
                              />
                              <span className="text-base">{folder.name}</span>
                            </div>
                          </SelectItem>
                        )
                      }
                    })}
                  </SelectContent>
                </Select>
                {selectedFolder && (
                  <p className="text-xs text-muted-foreground">
                    選択中: {selectedFolderFullPath}
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
