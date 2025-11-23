import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, RotateCw } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import OcrDocumentPreview from '@/components/ocr/OcrDocumentPreview'
import OcrResultEditor from '@/components/ocr/OcrResultEditor'
import ocrDataverseService from '@/services/ocrDataverseService'
import type { OcrDocument } from '@/types'
import { logger } from '@/lib/logger'

/**
 * OCRドキュメント詳細ページ
 * OCR結果の確認と編集
 */
export default function OcrDocumentDetailPage() {
  const { documentId } = useParams<{ documentId: string }>()
  const navigate = useNavigate()

  const [document, setDocument] = useState<OcrDocument | null>(null)
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [fileName, setFileName] = useState('')
  const [isEditingFileName, setIsEditingFileName] = useState(false)
  // const [loading, setLoading] = useState(false) // Unused

  // ドキュメントデータの読み込み
  useEffect(() => {
    const fetchDocument = async () => {
      if (documentId) {
        // setLoading(true)
        try {
          const doc = await ocrDataverseService.getDocumentById(documentId)
          if (doc) {
            // テスト用のOCRフィールドデータを追加
            if (!doc.ocrResult || !doc.ocrResult.fields || doc.ocrResult.fields.length === 0) {
              doc.ocrResult = {
                id: 'ocr-result-test',
                documentId: doc.id,
                fileName: doc.fileName,
                status: 'completed',
                fields: [
                  {
                    id: 'field-1',
                    label: '請求書番号',
                    value: 'INV-123457',
                    confidence: 0.95,
                    boundingBox: { x: 450, y: 150, width: 150, height: 25 },
                    isEdited: false
                  },
                  {
                    id: 'field-2',
                    label: '発行日',
                    value: '2019年10月31日',
                    confidence: 0.92,
                    boundingBox: { x: 450, y: 185, width: 120, height: 20 },
                    isEdited: false
                  },
                  {
                    id: 'field-3',
                    label: '会社名',
                    value: '株式会社〇〇〇〇',
                    confidence: 0.88,
                    boundingBox: { x: 460, y: 207, width: 130, height: 30 },
                    isEdited: false
                  },
                  {
                    id: 'field-4',
                    label: '合計金額',
                    value: '¥ 5,520,000',
                    confidence: 0.96,
                    boundingBox: { x: 320, y: 510, width: 120, height: 25 },
                    isEdited: false
                  },
                  {
                    id: 'field-5',
                    label: '小計',
                    value: '¥ 3,700,000',
                    confidence: 0.91,
                    boundingBox: { x: 320, y: 535, width: 120, height: 20 },
                    isEdited: false
                  },
                  {
                    id: 'field-6',
                    label: '消費税',
                    value: '¥ 370,000',
                    confidence: 0.93,
                    boundingBox: { x: 320, y: 555, width: 100, height: 20 },
                    isEdited: false
                  },
                  {
                    id: 'field-7',
                    label: '担当者',
                    value: '●●●●●●',
                    confidence: 0.85,
                    boundingBox: { x: 250, y: 650, width: 100, height: 20 },
                    isEdited: false
                  }
                ],
                overallConfidence: 0.91,
                processedAt: new Date()
              }
            }
            
            setDocument(doc)
            setFileName(doc.fileName)
          } else {
            toast.error('ドキュメントが見つかりません')
            navigate('/ocr')
          }
        } catch (error) {
          logger.error('ドキュメント取得エラー', error)
          toast.error('ドキュメントの読み込みに失敗しました')
        } finally {
          // setLoading(false)
        }
      }
    }
    fetchDocument()
  }, [documentId, navigate])

  // 一覧に戻る（フォルダフィルター付き）
  const handleBackToList = () => {
    if (document?.folderId) {
      navigate(`/ocr?folder=${document.folderId}`)
    } else {
      navigate('/ocr')
    }
  }

  // ファイル名変更（今後実装予定）
  const handleFileNameChange = (newFileName: string) => {
    setFileName(newFileName)
    setHasUnsavedChanges(true)
  }

  // フィールド更新（今後実装予定 - OCR処理後）
  const handleFieldUpdate = (_fieldId: string, _newValue: string) => {
    // TODO: OCR結果が実装されたら対応
    setHasUnsavedChanges(true)
  }

  // 全変更を保存
  const handleSaveAll = async () => {
    if (!document) return

    try {
      // TODO: API呼び出し
      // const updatedDoc = {
      //   ...document,
      //   fileName: fileName,
      // }
      // await ocrService.updateDocument(document.id, updatedDoc)

      logger.debug('保存するデータ', {
        documentId: document.id,
        fileName: fileName,
        fields: document.ocrResult?.fields,
      })

      // ローカル状態を更新
      setDocument(prev => prev ? { ...prev, fileName } : null)

      toast.success('変更を保存しました')
      setHasUnsavedChanges(false)
      setIsEditingFileName(false)
    } catch (error) {
      toast.error('保存に失敗しました')
      logger.error('保存エラー', error)
    }
  }

  // 再処理
  const handleReprocess = async () => {
    if (!document) return

    try {
      // TODO: API呼び出し
      // await ocrService.reprocessDocument(document.id)

      toast.success('再処理を開始しました')
      navigate('/ocr')
    } catch (error) {
      toast.error('再処理の開始に失敗しました')
      logger.error('再処理エラー', error)
    }
  }

  if (!document) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    )
  }

  const hasOcrResult = document.ocrResult && document.ocrResult.fields && document.ocrResult.fields.length > 0

  return (
    <div className="flex flex-col h-full bg-background">
      {/* ヘッダー */}
      <div className="border-b border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToList}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              一覧に戻る
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {isEditingFileName ? (
                  <Input
                    value={fileName}
                    onChange={(e) => handleFileNameChange(e.target.value)}
                    onBlur={() => setIsEditingFileName(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setIsEditingFileName(false)
                      } else if (e.key === 'Escape') {
                        setFileName(document.fileName)
                        setIsEditingFileName(false)
                      }
                    }}
                    className="text-xl font-bold h-8 max-w-md"
                    autoFocus
                  />
                ) : (
                  <h1
                    className="text-xl font-bold text-foreground cursor-pointer hover:text-primary transition-colors"
                    onClick={() => setIsEditingFileName(true)}
                    title="クリックして編集"
                  >
                    {fileName}
                  </h1>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {hasOcrResult && document.ocrResult ? (
                  <>
                    信頼度: {((document.ocrResult.overallConfidence ?? 0) * 100).toFixed(1)}% |
                    フィールド数: {document.ocrResult.fields?.length ?? 0}
                  </>
                ) : (
                  <>
                    ステータス: {
                      document.status === 'uploaded' ? 'アップロード済み' :
                      document.status === 'pending' ? '処理待ち' :
                      document.status === 'processing' ? '処理中' : '不明'
                    }
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {hasOcrResult && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReprocess}
                >
                  <RotateCw className="w-4 h-4 mr-2" />
                  再処理
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveAll}
                  disabled={!hasUnsavedChanges}
                >
                  <Save className="w-4 h-4 mr-2" />
                  保存
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左: ドキュメントプレビュー（固定50%幅） */}
        <div className="w-1/2 overflow-auto border-r border-border bg-muted/30">
          <OcrDocumentPreview
            document={document}
            selectedFieldId={selectedFieldId}
            onFieldSelect={setSelectedFieldId}
          />
        </div>

        {/* 右: フィールドエディター（OCR結果エリア - 常に表示） */}
        <div className="w-1/2 overflow-auto bg-card">
          {hasOcrResult ? (
            <OcrResultEditor
              ocrResult={document.ocrResult ?? null}
              selectedFieldId={selectedFieldId}
              onFieldSelect={setSelectedFieldId}
              onFieldChange={handleFieldUpdate}
            />
          ) : (
            <div className="flex items-center justify-center h-full p-8 text-center">
              <div className="space-y-4">
                <div className="text-muted-foreground">
                  <p className="text-lg font-medium">OCR処理待ち</p>
                  <p className="text-sm mt-2">
                    このドキュメントはまだOCR処理されていません。
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleReprocess}
                  disabled={document?.status === 'processing'}
                >
                  <RotateCw className="w-4 h-4 mr-2" />
                  OCR処理を開始
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 未保存警告 */}
      {hasUnsavedChanges && (
        <div className="border-t border-border bg-yellow-500/10 p-3 text-sm text-yellow-800 dark:text-yellow-200">
          未保存の変更があります。保存ボタンをクリックして変更を保存してください。
        </div>
      )}
    </div>
  )
}
