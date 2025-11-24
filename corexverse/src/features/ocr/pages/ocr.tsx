/**
 * OCRメインページコンポーネント
 * 
 * OCR機能のメイン画面。
 * ファイルアップロード、画像/PDFプレビュー、OCR結果表示・編集を統合。
 * 
 * @component
 * 
 * @description
 * - 左側: 画像/PDFプレビュー
 * - 右側: OCR結果表示・編集パネル
 * - フィールド選択時: 画像上にハイライト表示
 * - 編集機能: フィールド値の手動更新
 * - 保存機能: 更新したOCRデータをバックエンドに送信
 * 
 * @returns {JSX.Element} OCRページUI
 * 
 * @example
 * ```tsx
 * // router.tsxでの使用例
 * {
 *   path: "/ocr",
 *   element: <OcrLayout />,
 *   children: [
 *     { index: true, element: <OcrPage /> },
 *   ]
 * }
 * ```
 * 
 * @remarks
 * - ファイルアップロード時は自動でOCR処理を開始
 * - 処理中はローディング状態を表示
 * - 編集後は保存ボタンで更新をバックエンドに反映
 */

import { useState } from "react"
import { Upload, Save, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import type { OcrDocument } from "@/types"
import OcrFileUpload from "@/components/ocr/OcrFileUpload"
import OcrDocumentPreview from "@/components/ocr/OcrDocumentPreview"
import OcrResultEditor from "@/components/ocr/OcrResultEditor"

/**
 * OCRメインページ
 */
export default function OcrPage() {
  const [currentDocument, setCurrentDocument] = useState<OcrDocument | null>(null)
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  /**
   * ファイルアップロード処理
   * 
   * @param {File} file - アップロードされたファイル
   * 
   * @remarks
   * - ファイルをバックエンドにアップロード
   * - OCR処理を自動開始
   * - 処理完了後に結果を表示
   */
  const handleFileUpload = async (file: File) => {
    setIsProcessing(true)

    try {
      // TODO: バックエンドAPIにファイルをアップロード
      // const formData = new FormData()
      // formData.append('file', file)
      // const response = await ocrService.uploadDocument(formData)

      // モックデータで処理をシミュレート
      await new Promise(resolve => setTimeout(resolve, 2000))

      // モックドキュメントを作成
      const mockDocument: OcrDocument = {
        id: Date.now().toString(),
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileUrl: URL.createObjectURL(file),
        uploadedBy: 'current-user',
        name: file.name,
        folderId: 'default-folder',
        status: 'completed',
        createdAt: new Date(),
        uploadedDate: new Date(),
        updatedAt: new Date(),
        tags: [],
        ocrResult: {
          id: Date.now().toString(),
          documentId: Date.now().toString(),
          fileName: file.name,
          status: 'completed',
          processedAt: new Date(),
          overallConfidence: 0.92,
          fields: [
            {
              id: '1',
              label: '氏名',
              value: '山田太郎',
              confidence: 0.95,
              boundingBox: { x: 100, y: 50, width: 200, height: 30 },
              type: 'text',
              isEdited: false,
            },
            {
              id: '2',
              label: '住所',
              value: '東京都渋谷区1-2-3',
              confidence: 0.88,
              boundingBox: { x: 100, y: 100, width: 300, height: 30 },
              type: 'address',
              isEdited: false,
            },
            {
              id: '3',
              label: '金額',
              value: '¥100,000',
              confidence: 0.92,
              boundingBox: { x: 100, y: 150, width: 150, height: 30 },
              type: 'number',
              isEdited: false,
            },
            {
              id: '4',
              label: '日付',
              value: '2025-11-17',
              confidence: 0.90,
              boundingBox: { x: 100, y: 200, width: 180, height: 30 },
              type: 'date',
              isEdited: false,
            },
          ],
        },
      }

      setCurrentDocument(mockDocument)
      toast.success('OCR処理が完了しました')
    } catch (error) {
      toast.error('OCR処理に失敗しました')
    } finally {
      setIsProcessing(false)
    }
  }

  /**
   * フィールド値変更処理
   * 
   * @param {string} fieldId - 変更するフィールドのID
   * @param {string} newValue - 新しい値
   */
  const handleFieldChange = (fieldId: string, newValue: string) => {
    if (!currentDocument?.ocrResult) return

    const updatedFields = currentDocument.ocrResult.fields.map(field =>
      field.id === fieldId
        ? { ...field, value: newValue, isEdited: true }
        : field
    )

    setCurrentDocument({
      ...currentDocument,
      ocrResult: {
        ...currentDocument.ocrResult,
        fields: updatedFields,
      },
    })
    setHasUnsavedChanges(true)
  }

  /**
   * フィールド選択処理
   * 
   * @param {string} fieldId - 選択されたフィールドのID
   * 
   * @remarks
   * - 選択されたフィールドを画像上でハイライト表示
   */
  const handleFieldSelect = (fieldId: string) => {
    setSelectedFieldId(fieldId)
  }

  /**
   * OCRデータ保存処理
   * 
   * @remarks
   * - 編集されたフィールドをバックエンドに送信
   * - 保存成功後、未保存フラグをクリア
   */
  const handleSave = async () => {
    if (!currentDocument?.ocrResult) return

    try {
      // TODO: バックエンドAPIにOCRデータを保存
      // await ocrService.updateOcrResult(currentDocument.ocrResult.id, currentDocument.ocrResult)

      // モックで保存をシミュレート
      await new Promise(resolve => setTimeout(resolve, 1000))

      setHasUnsavedChanges(false)
      toast.success('OCRデータを保存しました')
    } catch (error) {
      toast.error('保存に失敗しました')
    }
  }

  /**
   * OCR再処理
   * 
   * @remarks
   * - 現在のドキュメントに対してOCRを再実行
   */
  const handleReprocess = async () => {
    if (!currentDocument) return

    setIsProcessing(true)
    try {
      // TODO: バックエンドAPIでOCRを再処理
      // await ocrService.reprocessDocument(currentDocument.id)

      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success('OCR再処理が完了しました')
    } catch (error) {
      toast.error('再処理に失敗しました')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* ヘッダー */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">OCR処理</h1>
            <p className="text-sm text-muted-foreground">
              帳票をアップロードしてOCR処理を行います
            </p>
          </div>

          {currentDocument && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReprocess}
                disabled={isProcessing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
                再処理
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!hasUnsavedChanges || isProcessing}
              >
                <Save className="h-4 w-4 mr-2" />
                保存
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 overflow-hidden">
        {!currentDocument ? (
          // ファイルアップロード画面
          <div className="h-full flex items-center justify-center p-6">
            <Card className="w-full max-w-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  ファイルをアップロード
                </CardTitle>
                <CardDescription>
                  画像ファイル(JPEG, PNG)またはPDFをアップロードしてOCR処理を開始します
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OcrFileUpload
                  onFilesSelect={(files) => files.length > 0 && handleFileUpload(files[0])}
                  maxFiles={1}
                />

                {isProcessing && (
                  <Alert className="mt-4">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <AlertDescription>
                      OCR処理中です。しばらくお待ちください...
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          // OCR結果表示・編集画面
          <div className="h-full flex">
            {/* 左側: 画像プレビュー */}
            <div className="flex-1 border-r overflow-auto">
              <OcrDocumentPreview
                document={currentDocument}
                selectedFieldId={selectedFieldId}
                onFieldSelect={handleFieldSelect}
              />
            </div>

            {/* 右側: OCR結果編集 */}
            <div className="w-96 overflow-auto">
              <OcrResultEditor
                ocrResult={currentDocument.ocrResult || null}
                selectedFieldId={selectedFieldId}
                onFieldChange={handleFieldChange}
                onFieldSelect={handleFieldSelect}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
