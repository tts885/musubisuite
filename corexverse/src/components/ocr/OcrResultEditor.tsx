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
import { Badge } from "@/components/ui/badge"
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
      {/* ヘッダー - 固定 */}
      <div className="flex items-center justify-between px-4 border-b border-border bg-card flex-shrink-0 h-[52px]">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm">OCR結果</h3>
          <span className="text-xs text-muted-foreground">
            {ocrResult.fields.length}個のフィールドを検出
          </span>
        </div>
      </div>

      {/* テーブル - スクロール可能 */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm table-fixed border-collapse">
          <colgroup>
            <col style={{ width: '20%' }} />
            <col style={{ width: '35%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '15%' }} />
          </colgroup>
          <thead className="sticky top-0 bg-muted/95 z-10">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground border border-border">項目名</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground border border-border">項目値</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground border border-border">属性</th>
              <th className="px-4 py-2 text-center font-medium text-muted-foreground border border-border">信頼度</th>
              <th className="px-4 py-2 text-center font-medium text-muted-foreground border border-border">操作</th>
            </tr>
          </thead>
          <tbody>
              {ocrResult.fields.map((field) => {
                const isSelected = selectedFieldId === field.id
                const isEditing = editingFieldId === field.id

                return (
                  <tr
                    key={field.id}
                    className={cn(
                      "border-b hover:bg-muted/30 transition-colors cursor-pointer",
                      isSelected && "bg-primary/10 hover:bg-primary/15"
                    )}
                    onClick={() => !isEditing && onFieldSelect(field.id)}
                  >
                    {/* 項目名 */}
                    <td className="px-4 py-1 font-medium text-sm border border-border">
                      <div className="flex items-center gap-2">
                        {field.label}
                        {field.isEdited && (
                          <Badge variant="outline" className="text-xs">編集済</Badge>
                        )}
                      </div>
                    </td>

                    {/* 項目値 */}
                    <td className="px-4 py-1 text-sm border border-border">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="text-sm h-8"
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
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleConfirmEdit(field.id)
                            }}
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCancelEdit()
                            }}
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      ) : (
                        <div className={cn(
                          "font-mono text-sm",
                          field.isEdited && "text-primary font-semibold"
                        )}>
                          {field.value}
                        </div>
                      )}
                    </td>

                    {/* 属性 */}
                    <td className="px-4 py-1 text-muted-foreground text-sm border border-border">
                      {getFieldTypeLabel(field.type)}
                    </td>

                    {/* 信頼度 */}
                    <td className="px-4 py-1 text-center border border-border">
                      <Badge 
                        variant={getConfidenceBadgeVariant(field.confidence)}
                        className="text-xs"
                      >
                        {(field.confidence * 100).toFixed(0)}%
                      </Badge>
                    </td>

                    {/* 操作 */}
                    <td className="px-4 py-1 text-center border border-border">
                      {!isEditing && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleStartEdit(field)
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>

      {/* フッター統計 - 固定 */}
      <div className="px-4 py-3 border-t bg-card text-xs text-muted-foreground flex items-center gap-4 flex-shrink-0">
        <span>処理日時: {new Date(ocrResult.processedAt).toLocaleString('ja-JP')}</span>
        <span>ステータス: {
          ocrResult.status === 'completed' ? '完了' :
          ocrResult.status === 'processing' ? '処理中' :
          ocrResult.status === 'failed' ? '失敗' : '待機中'
        }</span>
        <span className="ml-auto">全体信頼度: {(ocrResult.overallConfidence * 100).toFixed(0)}%</span>
      </div>
    </div>
  )
}
