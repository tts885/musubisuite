/**
 * OCRファイルアップロードコンポーネント
 * 
 * ドラッグ&ドロップまたはクリックで複数ファイルをアップロードします。
 * 画像ファイル(JPEG, PNG)およびPDFに対応。
 * 
 * @component
 * 
 * @param {Object} props - コンポーネントのプロパティ
 * @param {Function} props.onFilesSelect - ファイル選択時のコールバック(複数対応)
 * @param {boolean} [props.isProcessing=false] - 処理中フラグ
 * @param {string[]} [props.acceptedTypes] - 受け入れるファイルタイプ
 * @param {number} [props.maxSizeInMB=10] - 最大ファイルサイズ(MB)
 * @param {number} [props.maxFiles=10] - 最大ファイル数
 * 
 * @example
 * ```tsx
 * <OcrFileUpload
 *   onFilesSelect={(files) => handleUpload(files)}
 *   isProcessing={uploading}
 *   maxSizeInMB={20}
 *   maxFiles={20}
 * />
 * ```
 * 
 * @remarks
 * - 複数ファイルの一括アップロードに対応
 * - ドラッグ&ドロップエリアは視覚的なフィードバックを提供
 * - ファイルサイズとタイプのバリデーションを実施
 * - エラー時はトースト通知を表示
 */

import { useCallback, useState } from "react"
import { Upload, FileText, Image as ImageIcon, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface OcrFileUploadProps {
  onFilesSelect: (files: File[]) => void
  isProcessing?: boolean
  acceptedTypes?: string[]
  maxSizeInMB?: number
  maxFiles?: number
}

/**
 * デフォルトの受け入れファイルタイプ
 */
const DEFAULT_ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/jpg',
  'application/pdf',
]

/**
 * ファイルタイプの表示名マッピング
 */
const FILE_TYPE_LABELS: Record<string, string> = {
  'image/jpeg': 'JPEG',
  'image/jpg': 'JPEG',
  'image/png': 'PNG',
  'application/pdf': 'PDF',
}

export default function OcrFileUpload({
  onFilesSelect,
  isProcessing = false,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  maxSizeInMB = 10,
  maxFiles = 10,
}: OcrFileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)

  /**
   * ファイルバリデーション
   * 
   * @param {File} file - バリデーション対象のファイル
   * @returns {boolean} バリデーション結果
   */
  const validateFile = useCallback((file: File): boolean => {
    // ファイルタイプチェック
    if (!acceptedTypes.includes(file.type)) {
      const acceptedLabels = acceptedTypes
        .map(type => FILE_TYPE_LABELS[type] || type)
        .join(', ')
      toast.error(`対応していないファイル形式です。対応形式: ${acceptedLabels}`)
      return false
    }

    // ファイルサイズチェック
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024
    if (file.size > maxSizeInBytes) {
      toast.error(`ファイルサイズが大きすぎます。最大サイズ: ${maxSizeInMB}MB`)
      return false
    }

    return true
  }, [acceptedTypes, maxSizeInMB])

  /**
   * 複数ファイル選択処理
   * 
   * @param {File[]} files - 選択されたファイル配列
   */
  const handleFiles = useCallback((files: File[]) => {
    // ファイル数チェック
    if (files.length > maxFiles) {
      toast.error(`一度にアップロードできるのは最大${maxFiles}ファイルまでです`)
      return
    }

    // 各ファイルをバリデーション
    const validFiles: File[] = []
    for (const file of files) {
      if (validateFile(file)) {
        validFiles.push(file)
      }
    }

    if (validFiles.length > 0) {
      onFilesSelect(validFiles)
      if (validFiles.length < files.length) {
        toast.warning(`${files.length - validFiles.length}個のファイルがスキップされました`)
      }
    }
  }, [validateFile, onFilesSelect, maxFiles])

  /**
   * ドラッグオーバー処理
   */
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  /**
   * ドラッグリーブ処理
   */
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  /**
   * ドロップ処理
   */
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFiles(files)
    }
  }, [handleFiles])

  /**
   * ファイル入力変更処理
   */
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFiles(Array.from(files))
    }
  }, [handleFiles])

  /**
   * 受け入れファイル拡張子を取得
   */
  const getAcceptString = () => {
    return acceptedTypes.join(',')
  }

  return (
    <div className="w-full">
      {/* ドラッグ&ドロップエリア */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-12 transition-all duration-200",
          "hover:border-primary/50 hover:bg-accent/5",
          isDragging && "border-primary bg-accent/10 scale-[1.02]",
          isProcessing && "opacity-50 cursor-not-allowed"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept={getAcceptString()}
          onChange={handleInputChange}
          disabled={isProcessing}
          multiple
        />

        <label
          htmlFor="file-upload"
          className={cn(
            "flex flex-col items-center justify-center cursor-pointer",
            isProcessing && "cursor-not-allowed"
          )}
        >
          {/* アイコン */}
          <div className="mb-4 p-4 bg-primary/10 rounded-full">
            <Upload className="h-8 w-8 text-primary" />
          </div>

          {/* メインテキスト */}
          <p className="text-lg font-medium text-foreground mb-2">
            ファイルをドラッグ&ドロップ
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            または <span className="text-primary font-medium">クリックして選択</span>
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            最大{maxFiles}ファイルまで一括アップロード可能
          </p>

          {/* サポート形式 */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <ImageIcon className="h-3 w-3" />
              <span>JPEG, PNG</span>
            </div>
            <div className="w-px h-3 bg-border" />
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              <span>PDF</span>
            </div>
          </div>

          {/* 最大サイズ */}
          <p className="text-xs text-muted-foreground mt-2">
            最大ファイルサイズ: {maxSizeInMB}MB
          </p>
        </label>

        {/* ドラッグ中のオーバーレイ */}
        {isDragging && (
          <div className="absolute inset-0 bg-primary/5 rounded-lg pointer-events-none flex items-center justify-center">
            <div className="bg-background border border-primary rounded-lg px-6 py-4 shadow-lg">
              <p className="text-primary font-medium">ここにドロップ</p>
            </div>
          </div>
        )}
      </div>

      {/* 注意事項 */}
      <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <p>
          アップロードされたファイルは自動的にOCR処理されます。
          処理には数秒から数分かかる場合があります。
        </p>
      </div>
    </div>
  )
}
