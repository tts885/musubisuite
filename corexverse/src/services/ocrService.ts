/**
 * OCRサービス
 * 
 * OCR機能に関連するAPI通信を管理します。
 * タスクベースのワークフローに対応しています。
 * 
 * @description
 * - タスクの作成(複数ファイルのバッチアップロード)
 * - タスク一覧の取得
 * - タスク詳細の取得
 * - OCR結果の更新
 * - タスクの削除
 * 
 * @example
 * ```ts
 * // タスクの作成
 * const formData = new FormData()
 * formData.append('taskName', 'OCRタスク_2024/01/01')
 * files.forEach(file => formData.append('files', file))
 * const task = await ocrService.createTask(formData)
 * 
 * // タスク一覧の取得
 * const tasks = await ocrService.listTasks({ status: 'completed' })
 * 
 * // タスク詳細の取得
 * const task = await ocrService.getTask(taskId)
 * 
 * // OCR結果の更新
 * await ocrService.updateOcrResult(resultId, { fields: [...] })
 * ```
 */

// import { apiClient } from './djangoAPI'
import type { OcrTask, OcrDocument, OcrResult, OcrTaskStatus } from '@/types'

/**
 * タスク一覧取得パラメータ
 */
interface ListTasksParams {
  status?: OcrTaskStatus
  limit?: number
  offset?: number
  search?: string
}

/**
 * OCRサービスクラス
 */
class OcrService {
  /**
   * OCRタスクを作成
   * 
   * @param {FormData} formData - タスク名と複数ファイルを含むフォームデータ
   * @returns {Promise<OcrTask>} 作成されたタスク
   * 
   * @example
   * ```ts
   * const formData = new FormData()
   * formData.append('taskName', 'OCRタスク_2024/01/01')
   * files.forEach(file => formData.append('files', file))
   * const task = await ocrService.createTask(formData)
   * ```
   */
  async createTask(formData: FormData): Promise<OcrTask> {
    try {
      // TODO: Backend実装後にコメントを解除
      // const response = await apiClient.post('/api/ocr/tasks/', formData, {
      //   headers: {
      //     'Content-Type': 'multipart/form-data',
      //   },
      // })
      // return response.data

      // モック実装
      await new Promise(resolve => setTimeout(resolve, 1000))

      const taskName = formData.get('taskName') as string || 'OCRタスク'
      return {
        id: `task_${Date.now()}`,
        name: taskName,
        status: 'pending',
        documents: [],
        totalDocuments: 0,
        processedDocuments: 0,
        failedDocuments: 0,
        createdBy: 'current-user',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    } catch (error) {
      console.error('タスク作成エラー:', error)
      throw new Error('タスクの作成に失敗しました')
    }
  }

  /**
   * タスク一覧を取得
   * 
   * @param {ListTasksParams} params - クエリパラメータ
   * @returns {Promise<OcrTask[]>} タスク一覧
   * 
   * @example
   * ```ts
   * // ステータスでフィルター
   * const tasks = await ocrService.listTasks({ status: 'completed' })
   * 
   * // 検索
   * const tasks = await ocrService.listTasks({ search: '請求書' })
   * ```
   */
  async listTasks(params?: ListTasksParams): Promise<OcrTask[]> {
    try {
      // TODO: Backend実装後にコメントを解除
      // const response = await apiClient.get('/api/ocr/tasks/', { params })
      // return response.data.results

      // モック実装
      await new Promise(resolve => setTimeout(resolve, 500))
      console.log('Listing tasks:', params)
      return []
    } catch (error) {
      console.error('タスク一覧取得エラー:', error)
      throw new Error('タスク一覧の取得に失敗しました')
    }
  }

  /**
   * タスク詳細を取得
   * 
   * @param {string} taskId - タスクID
   * @returns {Promise<OcrTask>} タスク詳細(全ドキュメントを含む)
   * 
   * @example
   * ```ts
   * const task = await ocrService.getTask('task_123')
   * console.log(task.documents) // 全ドキュメント
   * ```
   */
  async getTask(taskId: string): Promise<OcrTask> {
    try {
      // TODO: Backend実装後にコメントを解除
      // const response = await apiClient.get(`/api/ocr/tasks/${taskId}/`)
      // return response.data

      // モック実装
      await new Promise(resolve => setTimeout(resolve, 500))

      return {
        id: taskId,
        name: 'サンプルタスク',
        status: 'completed',
        documents: [],
        totalDocuments: 0,
        processedDocuments: 0,
        failedDocuments: 0,
        createdBy: 'current-user',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    } catch (error) {
      console.error('タスク取得エラー:', error)
      throw new Error('タスクの取得に失敗しました')
    }
  }

  /**
   * タスク内の特定ドキュメントのOCR結果を更新
   * 
   * @param {string} taskId - タスクID
   * @param {string} documentId - ドキュメントID
   * @param {Partial<OcrResult>} updates - 更新内容
   * @returns {Promise<OcrResult>} 更新されたOCR結果
   * 
   * @example
   * ```ts
   * await ocrService.updateTaskDocument('task_123', 'doc_456', {
   *   fields: [{ id: 'field_1', value: '新しい値', isEdited: true }]
   * })
   * ```
   */
  async updateTaskDocument(
    taskId: string,
    documentId: string,
    updates: Partial<OcrResult>
  ): Promise<OcrResult> {
    try {
      // TODO: Backend実装後にコメントを解除
      // const response = await apiClient.patch(
      //   `/api/ocr/tasks/${taskId}/documents/${documentId}/result/`,
      //   updates
      // )
      // return response.data

      // モック実装
      await new Promise(resolve => setTimeout(resolve, 500))

      console.log('Updating task document:', { taskId, documentId, updates })
      return {
        id: `result_${documentId}`,
        documentId,
        fileName: 'mock-document.pdf',
        fields: [],
        status: 'completed',
        overallConfidence: 0.95,
        processedAt: new Date(),
      }
    } catch (error) {
      console.error('ドキュメント更新エラー:', error)
      throw new Error('ドキュメントの更新に失敗しました')
    }
  }

  /**
   * OCR結果を更新(旧メソッド - 互換性のため残す)
   * 
   * @deprecated updateTaskDocument()を使用してください
   * @param {string} resultId - OCR結果ID
   * @param {Partial<OcrResult>} updates - 更新内容
   * @returns {Promise<OcrResult>} 更新されたOCR結果
   */
  async updateOcrResult(resultId: string, updates: Partial<OcrResult>): Promise<OcrResult> {
    try {
      // TODO: Backend実装後にコメントを解除
      // const response = await apiClient.patch(`/api/ocr/results/${resultId}/`, updates)
      // return response.data

      // モック実装
      await new Promise(resolve => setTimeout(resolve, 500))

      console.log('Updating OCR result:', resultId, updates)
      return {
        id: resultId,
        documentId: 'mock',
        fileName: 'mock-document.pdf',
        fields: [],
        status: 'completed',
        overallConfidence: 0.95,
        processedAt: new Date(),
      }
    } catch (error) {
      console.error('OCR結果更新エラー:', error)
      throw new Error('OCR結果の更新に失敗しました')
    }
  }

  /**
   * タスク内の全変更を保存
   * 
   * @param {string} taskId - タスクID
   * @returns {Promise<void>}
   * 
   * @example
   * ```ts
   * await ocrService.saveTaskChanges('task_123')
   * ```
   */
  async saveTaskChanges(taskId: string): Promise<void> {
    try {
      // TODO: Backend実装後にコメントを解除
      // await apiClient.post(`/api/ocr/tasks/${taskId}/save/`)

      await new Promise(resolve => setTimeout(resolve, 500))
      console.log('Saving task changes:', taskId)
    } catch (error) {
      console.error('変更保存エラー:', error)
      throw new Error('変更の保存に失敗しました')
    }
  }

  /**
   * タスクを削除
   * 
   * @param {string} taskId - タスクID
   * @returns {Promise<void>}
   * 
   * @example
   * ```ts
   * await ocrService.deleteTask('task_123')
   * ```
   */
  async deleteTask(taskId: string): Promise<void> {
    try {
      // TODO: Backend実装後にコメントを解除
      // await apiClient.delete(`/api/ocr/tasks/${taskId}/`)

      await new Promise(resolve => setTimeout(resolve, 500))
      console.log('Deleting task:', taskId)
    } catch (error) {
      console.error('タスク削除エラー:', error)
      throw new Error('タスクの削除に失敗しました')
    }
  }

  /**
   * タスクを再処理
   * 
   * @param {string} taskId - タスクID
   * @returns {Promise<void>}
   * 
   * @example
   * ```ts
   * await ocrService.reprocessTask('task_123')
   * ```
   */
  async reprocessTask(taskId: string): Promise<void> {
    try {
      // TODO: Backend実装後にコメントを解除
      // await apiClient.post(`/api/ocr/tasks/${taskId}/reprocess/`)

      await new Promise(resolve => setTimeout(resolve, 500))
      console.log('Reprocessing task:', taskId)
    } catch (error) {
      console.error('タスク再処理エラー:', error)
      throw new Error('タスクの再処理に失敗しました')
    }
  }

  /**
   * タスクをキャンセル
   * 
   * @param {string} taskId - タスクID
   * @returns {Promise<void>}
   * 
   * @example
   * ```ts
   * await ocrService.cancelTask('task_123')
   * ```
   */
  async cancelTask(taskId: string): Promise<void> {
    try {
      // TODO: Backend実装後にコメントを解除
      // await apiClient.post(`/api/ocr/tasks/${taskId}/cancel/`)

      await new Promise(resolve => setTimeout(resolve, 500))
      console.log('Cancelling task:', taskId)
    } catch (error) {
      console.error('タスクキャンセルエラー:', error)
      throw new Error('タスクのキャンセルに失敗しました')
    }
  }

  // ========================================
  // 旧API (互換性のため残す、非推奨)
  // ========================================

  /**
   * @deprecated createTask()を使用してください
   */
  async uploadDocument(_formData: FormData): Promise<OcrDocument> {
    await new Promise(resolve => setTimeout(resolve, 500))
    return {
      id: `doc_${Date.now()}`,
      name: 'sample.pdf',
      fileName: 'sample.pdf',
      fileType: 'application/pdf',
      fileUrl: '/mock/sample.pdf',
      fileSize: 1024000,
      folderId: 'root',
      status: 'uploaded',
      ocrResult: null,
      uploadedBy: 'current-user',
      uploadedDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
    }
  }

  /**
   * @deprecated getTask()を使用してください
   */
  async getOcrResult(documentId: string): Promise<OcrResult> {
    await new Promise(resolve => setTimeout(resolve, 500))
    return {
      id: `result_${documentId}`,
      documentId,
      fileName: 'mock-document.pdf',
      fields: [],
      status: 'completed',
      overallConfidence: 0.95,
      processedAt: new Date(),
    }
  }

  /**
   * @deprecated deleteTask()を使用してください
   */
  async deleteDocument(documentId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500))
    console.log('Deleting document:', documentId)
  }
}

/**
 * OCRサービスのシングルトンインスタンス
 */
export const ocrService = new OcrService()

/**
 * デフォルトエクスポート
 */
export default ocrService
