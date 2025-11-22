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
          const docs = await ocrDataverseService.getDocuments(documentId)
          if (docs.length > 0) {
            setDocument(docs[0])
            setFileName(docs[0].fileName)
          } else {
            toast.error('ドキュメントが見つかりません')
            navigate('/ocr')
          }
        } catch (error) {
          console.error('ドキュメント取得エラー:', error)
          toast.error('ドキュメントの読み込みに失敗しました')
        } finally {
          // setLoading(false)
        }
      }
    }
    fetchDocument()
  }, [documentId, navigate])

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

      console.log('保存するデータ:', {
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
      console.error('Save error:', error)
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
      console.error('Reprocess error:', error)
    }
  }

  if (!document) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    )
  }

  if (!document.ocrResult) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-muted-foreground">OCR処理が完了していません</p>
        <Button onClick={() => navigate('/ocr')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          一覧に戻る
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* ヘッダー */}
      <div className="border-b border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/ocr')}
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
                信頼度: {(document.ocrResult.overallConfidence * 100).toFixed(1)}% |
                フィールド数: {document.ocrResult.fields.length}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
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
          </div>
        </div>
      </div>

      {/* メインコンテンツ: プレビュー + エディター */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左: ドキュメントプレビュー */}
        <div className="flex-1 overflow-auto border-r border-border bg-muted/30">
          <OcrDocumentPreview
            document={document}
            selectedFieldId={selectedFieldId}
            onFieldSelect={setSelectedFieldId}
          />
        </div>

        {/* 右: フィールドエディター */}
        <div className="w-96 overflow-auto bg-card">
          <OcrResultEditor
            ocrResult={document.ocrResult}
            selectedFieldId={selectedFieldId}
            onFieldSelect={setSelectedFieldId}
            onFieldChange={handleFieldUpdate}
          />
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
