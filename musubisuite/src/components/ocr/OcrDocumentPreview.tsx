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
import { ZoomIn, ZoomOut, RotateCw, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { OcrDocument, OcrField } from "@/types"

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
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
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
          setImageSize({
            width: imageRef.current.naturalWidth,
            height: imageRef.current.naturalHeight,
          })
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
  }, [document.fileUrl])

  /**
   * ズームイン
   */
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3))
  }

  /**
   * ズームアウト
   */
  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5))
  }

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
    <div className="h-full flex flex-col bg-muted/30">
      {/* ツールバー */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm">{document.fileName}</h3>
          <span className="text-xs text-muted-foreground">
            {(document.fileSize / 1024).toFixed(0)} KB
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
            title="ズームアウト"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <span className="text-xs text-muted-foreground min-w-[4ch] text-center">
            {Math.round(zoom * 100)}%
          </span>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            disabled={zoom >= 3}
            title="ズームイン"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-4 bg-border mx-1" />
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRotate}
            title="90度回転"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            title="ダウンロード"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 画像プレビューエリア */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto p-4"
      >
        <div className="flex items-center justify-center min-h-full">
          <div 
            className="relative inline-block"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: 'center',
              transition: 'transform 0.2s ease-out',
            }}
          >
            {/* 画像 */}
            <img
              ref={imageRef}
              src={document.fileUrl}
              alt={document.fileName}
              className="max-w-full h-auto rounded-lg shadow-lg"
            />

            {/* バウンディングボックスオーバーレイ */}
            {document.ocrResult && imageSize.width > 0 && (
              <div className="absolute inset-0">
                {document.ocrResult.fields.map(field => (
                  <div
                    key={field.id}
                    className={cn(
                      "border-2 transition-all duration-200 cursor-pointer",
                      getConfidenceColor(field.confidence),
                      selectedFieldId === field.id
                        ? "border-primary bg-primary/20 ring-2 ring-primary ring-offset-2"
                        : "hover:border-primary/50 hover:bg-primary/10"
                    )}
                    style={getBoundingBoxStyle(field)}
                    onClick={() => onFieldSelect(field.id)}
                    title={`${field.label}: ${field.value} (信頼度: ${(field.confidence * 100).toFixed(0)}%)`}
                  >
                    {/* フィールドラベル */}
                    <div className="absolute -top-5 left-0 text-xs font-medium bg-background px-1 py-0.5 rounded shadow-sm border whitespace-nowrap">
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
      {document.ocrResult && (
        <div className="px-4 py-2 border-t bg-card text-xs text-muted-foreground flex items-center gap-4">
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
        </div>
      )}
    </div>
  )
}
