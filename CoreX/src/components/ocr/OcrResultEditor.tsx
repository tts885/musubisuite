/**
 * OCR結果エディターコンポーネント
 * 
 * OCR処理結果のフィールドを一覧表示し、
 * 各フィールドの値を編集できる機能を提供します。
 * 
 * @component
 * 
 * @param {Object} props - コンポーネントのプロパティ
 * @param {OcrResult | null} props.ocrResult - OCR処理結果
 * @param {string | null} props.selectedFieldId - 選択中のフィールドID
 * @param {Function} props.onFieldChange - フィールド値変更時のコールバック
 * @param {Function} props.onFieldSelect - フィールド選択時のコールバック
 * 
 * @example
 * ```tsx
 * <OcrResultEditor
 *   ocrResult={result}
 *   selectedFieldId={selectedId}
 *   onFieldChange={(id, value) => handleChange(id, value)}
 *   onFieldSelect={(id) => setSelectedId(id)}
 * />
 * ```
 * 
 * @remarks
 * - 各フィールドをカードで表示
 * - 信頼度に応じて色分け表示
 * - インライン編集機能
 * - 選択中のフィールドを強調表示
 */

import { useState } from "react"
import { Edit2, Check, X, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { OcrResult, OcrField } from "@/types"

interface OcrResultEditorProps {
  ocrResult: OcrResult | null
  selectedFieldId: string | null
  onFieldChange: (fieldId: string, newValue: string) => void
  onFieldSelect: (fieldId: string) => void
}

export default function OcrResultEditor({
  ocrResult,
  selectedFieldId,
  onFieldChange,
  onFieldSelect,
}: OcrResultEditorProps) {
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")

  /**
   * 編集開始
   * 
   * @param {OcrField} field - 編集対象フィールド
   */
  const handleStartEdit = (field: OcrField) => {
    setEditingFieldId(field.id)
    setEditValue(field.value)
  }

  /**
   * 編集確定
   * 
   * @param {string} fieldId - フィールドID
   */
  const handleConfirmEdit = (fieldId: string) => {
    onFieldChange(fieldId, editValue)
    setEditingFieldId(null)
    setEditValue("")
  }

  /**
   * 編集キャンセル
   */
  const handleCancelEdit = () => {
    setEditingFieldId(null)
    setEditValue("")
  }

  /**
   * 信頼度バッジのバリアント取得
   * 
   * @param {number} confidence - 信頼度(0-1)
   * @returns {string} バッジバリアント
   */
  const getConfidenceBadgeVariant = (confidence: number): "default" | "secondary" | "destructive" => {
    if (confidence >= 0.9) return "default"
    if (confidence >= 0.7) return "secondary"
    return "destructive"
  }

  /**
   * フィールドタイプの表示名取得
   * 
   * @param {string} type - フィールドタイプ
   * @returns {string} 表示名
   */
  const getFieldTypeLabel = (type?: string): string => {
    const typeMap: Record<string, string> = {
      text: 'テキスト',
      number: '数値',
      date: '日付',
      email: 'メール',
      phone: '電話番号',
      address: '住所',
    }
    return type ? typeMap[type] || type : 'テキスト'
  }

  if (!ocrResult) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center text-muted-foreground">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>OCR結果がありません</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* ヘッダー */}
      <div className="px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-sm">OCR結果</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {ocrResult.fields.length}個のフィールドを検出
        </p>
      </div>

      {/* フィールドリスト */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {ocrResult.fields.map((field) => {
            const isSelected = selectedFieldId === field.id
            const isEditing = editingFieldId === field.id

            return (
              <Card
                key={field.id}
                className={cn(
                  "transition-all duration-200 cursor-pointer",
                  isSelected && "ring-2 ring-primary shadow-md",
                  "hover:shadow-md"
                )}
                onClick={() => !isEditing && onFieldSelect(field.id)}
              >
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <Label className="text-sm font-medium">
                        {field.label}
                      </Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant={getConfidenceBadgeVariant(field.confidence)}
                          className="text-xs"
                        >
                          信頼度: {(field.confidence * 100).toFixed(0)}%
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {getFieldTypeLabel(field.type)}
                        </span>
                        {field.isEdited && (
                          <Badge variant="outline" className="text-xs">
                            編集済み
                          </Badge>
                        )}
                      </div>
                    </div>

                    {!isEditing && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStartEdit(field)
                        }}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-3 pt-0">
                  {isEditing ? (
                    // 編集モード
                    <div className="space-y-2">
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleConfirmEdit(field.id)
                          } else if (e.key === 'Escape') {
                            handleCancelEdit()
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="default"
                          className="h-7 text-xs flex-1"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleConfirmEdit(field.id)
                          }}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          確定
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs flex-1"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCancelEdit()
                          }}
                        >
                          <X className="h-3 w-3 mr-1" />
                          キャンセル
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // 表示モード
                    <div
                      className={cn(
                        "text-sm p-2 rounded bg-muted/50 font-mono break-all",
                        field.isEdited && "bg-primary/5 border border-primary/20"
                      )}
                    >
                      {field.value}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </ScrollArea>

      {/* フッター統計 */}
      <div className="px-4 py-3 border-t bg-muted/30">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">処理日時:</span>
            <div className="font-medium">
              {new Date(ocrResult.processedAt).toLocaleString('ja-JP')}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">ステータス:</span>
            <div className="font-medium">
              {ocrResult.status === 'completed' ? '完了' :
               ocrResult.status === 'processing' ? '処理中' :
               ocrResult.status === 'failed' ? '失敗' : '待機中'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
