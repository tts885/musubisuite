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
 * BlobをBase64文字列に変換するヘルパー関数
 */
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

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
  const [isProcessing, setIsProcessing] = useState(false)

  // ドキュメントデータの読み込み
  useEffect(() => {
    const fetchDocument = async () => {
      if (documentId) {
        // setLoading(true)
        try {
          const doc = await ocrDataverseService.getDocumentById(documentId)
          if (doc) {
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

  // OCR処理実行
  const handleProcessOcr = async () => {
    if (!document) return

    setIsProcessing(true)
    const toastId = toast.loading('OCR処理を実行中...')

    try {
      logger.info('OCR処理開始', { 
        documentId: document.id,
        fileUrl: document.fileUrl,
        fileUrlType: document.fileUrl.startsWith('blob:') ? 'blob' : 
                     document.fileUrl.startsWith('data:') ? 'data' : 'unknown'
      })

      // ドキュメントから画像データを取得
      let imageBase64 = ''
      
      if (!document.fileUrl) {
        throw new Error('画像データが見つかりません。ドキュメントを再アップロードしてください。')
      }
      
      if (document.fileUrl.startsWith('blob:')) {
        // Blob URLから画像データを取得
        logger.debug('Blob URLから画像データを取得', { blobUrl: document.fileUrl })
        
        try {
          const response = await fetch(document.fileUrl)
          if (!response.ok) {
            throw new Error(`Blob fetch failed: ${response.status} ${response.statusText}`)
          }
          const blob = await response.blob()
          logger.debug('Blob取得成功', { blobSize: blob.size, blobType: blob.type })
          imageBase64 = await blobToBase64(blob)
        } catch (fetchError) {
          logger.error('Blob URL fetch エラー', { error: fetchError, blobUrl: document.fileUrl })
          // Blob URLが無効な場合は、Dataverseから再取得を試みる
          logger.info('Dataverseからドキュメントを再取得します...')
          const freshDoc = await ocrDataverseService.getDocumentById(document.id)
          if (freshDoc && freshDoc.fileUrl) {
            logger.info('再取得成功、新しいfileUrlを使用', { newFileUrl: freshDoc.fileUrl })
            setDocument(freshDoc)
            if (freshDoc.fileUrl.startsWith('blob:')) {
              const response = await fetch(freshDoc.fileUrl)
              const blob = await response.blob()
              imageBase64 = await blobToBase64(blob)
            } else if (freshDoc.fileUrl.startsWith('data:')) {
              imageBase64 = freshDoc.fileUrl
            } else {
              throw new Error('再取得後も画像データが無効です')
            }
          } else {
            throw new Error('Dataverseからの再取得に失敗しました')
          }
        }
      } else if (document.fileUrl.startsWith('data:')) {
        // Data URLの場合はそのまま使用
        logger.debug('Data URLを使用', { dataUrlLength: document.fileUrl.length })
        imageBase64 = document.fileUrl
      } else {
        logger.error('サポートされていない画像形式', { fileUrl: document.fileUrl })
        throw new Error('サポートされていない画像形式です')
      }

      // OCR API呼び出し（画面表示用）
      const { default: ocrApiService } = await import('@/services/ocrApiService')
      const result = await ocrApiService.processDocument(imageBase64, 'invoice')

      if (!result) {
        throw new Error('OCR処理結果が取得できませんでした')
      }

      // 画面に即座に結果を表示
      setDocument(prev => {
        if (!prev) return prev
        return {
          ...prev,
          status: 'completed',
          ocrResult: {
            id: `ocr-result-${prev.id}`,
            documentId: prev.id,
            fileName: prev.fileName,
            status: 'completed',
            fields: result.fields,
            overallConfidence: result.overallConfidence,
            processedAt: new Date()
          }
        }
      })

      toast.success(`OCR処理が完了しました（${result.fields.length}フィールド検出）`, { id: toastId })
      logger.info('OCR処理完了', {
        documentId: document.id,
        fieldCount: result.fields.length,
        overallConfidence: result.overallConfidence
      })

      // TODO: Dataverseへの保存は後で実装
      // await ocrDataverseService.saveOcrResult(document.id, result)
    } catch (error) {
      logger.error('OCR処理エラー', error)
      toast.error('OCR処理に失敗しました', { id: toastId })
    } finally {
      setIsProcessing(false)
    }
  }

  // 再処理
  const handleReprocess = async () => {
    if (!document) return

    try {
      await handleProcessOcr()
    } catch (error) {
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
      <div className="border-b border-border bg-card h-16 px-4 flex items-center">
        <div className="flex items-center justify-between w-full">
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
            </div>
          </div>

          <div className="flex gap-2">
            {hasOcrResult ? (
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
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={handleProcessOcr}
                disabled={isProcessing || document?.status === 'processing'}
              >
                <RotateCw className={`w-4 h-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
                {isProcessing ? 'OCR処理中...' : 'OCR処理を開始'}
              </Button>
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
                  onClick={handleProcessOcr}
                  disabled={isProcessing || document?.status === 'processing'}
                >
                  <RotateCw className={`w-4 h-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
                  {isProcessing ? 'OCR処理中...' : 'OCR処理を開始'}
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
