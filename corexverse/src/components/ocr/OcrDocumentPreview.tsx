/**
 * OCRドキュメントプレビューコンポーネント
 * 
 * アップロードされた画像またはPDFを表示し、
 * OCR結果のバウンディングボックスをハイライト表示します。
 * 
 * @component
 * 
 * @param {Object} props - コンポーネントのプロパティ
 * @param {OcrDocument} props.document - 表示するドキュメント
 * @param {string | null} props.selectedFieldId - 選択中のフィールドID
 * @param {Function} props.onFieldSelect - フィールド選択時のコールバック
 * 
 * @example
 * ```tsx
 * <OcrDocumentPreview
 *   document={document}
 *   selectedFieldId={selectedId}
 *   onFieldSelect={(id) => setSelectedId(id)}
 * />
 * ```
 * 
 * @remarks
 * - 画像上にバウンディングボックスを重ねて表示
 * - 選択中のフィールドは強調表示
 * - クリックでフィールドを選択可能
 * - ズームイン/ズームアウト機能
 */

import { useState, useRef, useEffect } from "react"
import { Download, Maximize, Minimize, RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { OcrDocument, OcrField } from "@/types"
import { logger } from "@/lib/logger"

interface OcrDocumentPreviewProps {
  document: OcrDocument
  selectedFieldId: string | null
  onFieldSelect: (fieldId: string) => void
}

export default function OcrDocumentPreview({
  document,
  selectedFieldId,
  onFieldSelect,
}: OcrDocumentPreviewProps) {
  const [rotation, setRotation] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })

  /**
   * 画像読み込み完了時のサイズ取得
   */
  useEffect(() => {
    if (imageRef.current) {
      const updateSize = () => {
        if (imageRef.current) {
          const width = imageRef.current.naturalWidth
          const height = imageRef.current.naturalHeight
          
          setImageSize({ width, height })
          
          logger.info('[画像表示] naturalサイズ取得完了', {
            fileName: document.fileName,
            naturalWidth: width,
            naturalHeight: height,
            displayWidth: imageRef.current.offsetWidth,
            displayHeight: imageRef.current.offsetHeight,
            src: imageRef.current.src?.substring(0, 100) // Blob URLの先頭部分のみ
          })

          // サイズが異常に小さい場合は警告
          if (width < 100 || height < 100) {
            logger.warn('[画像表示] 画像サイズが異常に小さい可能性があります', {
              fileName: document.fileName,
              naturalWidth: width,
              naturalHeight: height
            })
          }
        }
      }

      if (imageRef.current.complete) {
        updateSize()
      } else {
        imageRef.current.addEventListener('load', updateSize)
        return () => {
          imageRef.current?.removeEventListener('load', updateSize)
        }
      }
    }
  }, [document.fileUrl, document.fileName])

  /**
   * Blob URLのクリーンアップ（メモリリーク防止）
   */
  useEffect(() => {
    const fileUrl = document.fileUrl
    
    // Blob URLの場合のみクリーンアップ
    if (fileUrl && fileUrl.startsWith('blob:')) {
      return () => {
        URL.revokeObjectURL(fileUrl)
      }
    }
  }, [document.fileUrl])

  /**
   * 90度回転
   */
  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  /**
   * ファイルダウンロード
   */
  const handleDownload = () => {
    const link = window.document.createElement('a')
    link.href = document.fileUrl
    link.download = document.fileName
    link.click()
  }

  /**
   * 全画面表示切り替え
   */
  const toggleFullscreen = () => {
    if (!containerRef.current) return

    if (!isFullscreen) {
      // 全画面表示に入る
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen()
      }
    } else {
      // 全画面表示を終了
      if (window.document.exitFullscreen) {
        window.document.exitFullscreen()
      }
    }
  }

  /**
   * 全画面状態の変化を監視
   */
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!window.document.fullscreenElement)
    }

    window.document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      window.document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  /**
   * バウンディングボックスのスタイル計算
   * 
   * @param {OcrField} field - フィールド情報
   * @returns {React.CSSProperties} スタイルオブジェクト
   */
  const getBoundingBoxStyle = (field: OcrField): React.CSSProperties => {
    if (!imageRef.current) return {}

    const displayWidth = imageRef.current.offsetWidth
    const displayHeight = imageRef.current.offsetHeight
    const scaleX = displayWidth / imageSize.width
    const scaleY = displayHeight / imageSize.height

    return {
      position: 'absolute',
      left: `${field.boundingBox.x * scaleX}px`,
      top: `${field.boundingBox.y * scaleY}px`,
      width: `${field.boundingBox.width * scaleX}px`,
      height: `${field.boundingBox.height * scaleY}px`,
    }
  }

  /**
   * 信頼度に応じた色を取得
   * 
   * @param {number} confidence - 信頼度(0-1)
   * @returns {string} 色クラス
   */
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.9) return 'border-green-500 bg-green-500/10'
    if (confidence >= 0.7) return 'border-yellow-500 bg-yellow-500/10'
    return 'border-red-500 bg-red-500/10'
  }

  return (
    <div className={cn(
      "h-full flex flex-col",
      isFullscreen ? "bg-black" : "bg-muted/30"
    )}>
      {/* ツールバー */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm">{document.fileName}</h3>
          <span className="text-xs text-muted-foreground">
            {(document.fileSize / 1024).toFixed(0)} KB
          </span>
          {imageSize.width > 0 && (
            <span className="text-xs text-muted-foreground">
              • {imageSize.width} × {imageSize.height}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRotate}
            title="90度回転"
            aria-label="画像を90度回転"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            title="ダウンロード"
            aria-label="ドキュメントをダウンロード"
          >
            <Download className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-4 bg-border mx-1" />
          
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            title={isFullscreen ? "全画面表示を終了" : "全画面表示"}
            aria-label={isFullscreen ? "全画面表示を終了" : "全画面表示"}
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* 画像プレビューエリア */}
      <div 
        ref={containerRef}
        className="flex-1 p-4 overflow-hidden"
      >
        <div className="flex items-center justify-center h-full">
          <div 
            className="relative inline-block"
            style={{
              transform: `rotate(${rotation}deg)`,
              transformOrigin: 'center',
              transition: 'transform 0.2s ease-out',
            }}
          >
            {/* 画像 */}
            {document.fileUrl ? (
              <img
                ref={imageRef}
                src={document.fileUrl}
                alt={`OCRドキュメント: ${document.fileName}`}
                className="rounded-lg shadow-lg"
                style={{
                  // 高品質画像表示設定
                  maxWidth: '100%',
                  maxHeight: 'calc(100vh - 280px)',
                  objectFit: 'contain',
                  imageRendering: 'pixelated',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                } as React.CSSProperties}
                loading="eager"
                decoding="sync"
                draggable={false}
              />
            ) : (
              <div className="flex items-center justify-center w-96 h-96 bg-muted rounded-lg border-2 border-dashed border-border">
                <div className="text-center text-muted-foreground">
                  <p className="text-sm">画像を読み込み中...</p>
                  <p className="text-xs mt-2">ファイルデータが見つかりません</p>
                </div>
              </div>
            )}

            {/* バウンディングボックスオーバーレイ（OCR結果がある場合のみ） */}
            {document.ocrResult && document.ocrResult.fields && document.ocrResult.fields.length > 0 && imageSize.width > 0 && (
              <div className="absolute inset-0 pointer-events-none">
                {document.ocrResult.fields.map(field => (
                  <div
                    key={field.id}
                    className={cn(
                      "group border-2 transition-all duration-200 cursor-pointer pointer-events-auto",
                      getConfidenceColor(field.confidence),
                      selectedFieldId === field.id
                        ? "border-primary bg-primary/20 ring-2 ring-primary ring-offset-2"
                        : "hover:border-primary/50 hover:bg-primary/10"
                    )}
                    style={getBoundingBoxStyle(field)}
                    onClick={() => onFieldSelect(field.id)}
                    title={`${field.label}: ${field.value} (信頼度: ${(field.confidence * 100).toFixed(0)}%)`}
                  >
                    {/* フィールドラベル（ホバー時のみ表示） */}
                    <div className={cn(
                      "absolute -top-5 left-0 text-xs font-medium px-1 py-0.5 rounded shadow-sm border whitespace-nowrap",
                      "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                      isFullscreen ? "bg-black text-white border-white" : "bg-background"
                    )}>
                      {field.label}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* フッター情報 */}
      <div className="px-4 py-2 border-t bg-card text-xs text-muted-foreground flex items-center gap-4">
        {document.ocrResult && document.ocrResult.fields && document.ocrResult.fields.length > 0 ? (
          <>
            <span>検出フィールド数: {document.ocrResult.fields.length}</span>
            <span>全体信頼度: {(document.ocrResult.overallConfidence * 100).toFixed(0)}%</span>
            <div className="flex items-center gap-2 ml-auto">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>高</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <span>中</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span>低</span>
              </div>
            </div>
          </>
        ) : (
          <span>画像: {document.fileName} ({imageSize.width} × {imageSize.height}px)</span>
        )}
      </div>
    </div>
  )
}
