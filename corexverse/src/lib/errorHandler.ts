import { logger } from './logger'

/**
 * エラーハンドリングユーティリティ
 */

export interface ErrorResult {
  success: false
  error: Error
  message: string
}

export interface SuccessResult<T> {
  success: true
  data: T
}

export type Result<T> = SuccessResult<T> | ErrorResult

/**
 * 非同期関数を安全に実行し、エラーをキャッチ
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  errorMessage = 'エラーが発生しました'
): Promise<Result<T>> {
  try {
    const data = await fn()
    return { success: true, data }
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error))
    logger.error(errorMessage, errorObj)
    return {
      success: false,
      error: errorObj,
      message: errorMessage
    }
  }
}

/**
 * エラーメッセージを取得
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'Unknown error occurred'
}

/**
 * APIエラーレスポンスの処理
 */
export function handleApiError(error: unknown): string {
  if (error instanceof Error) {
    // Axiosエラーの場合
    if ('response' in error && error.response) {
      const response = error.response as { data?: { message?: string }; status?: number }
      if (response.data?.message) {
        return response.data.message
      }
      if (response.status) {
        switch (response.status) {
          case 400:
            return 'リクエストが無効です'
          case 401:
            return '認証が必要です'
          case 403:
            return 'アクセス権限がありません'
          case 404:
            return 'リソースが見つかりません'
          case 500:
            return 'サーバーエラーが発生しました'
          default:
            return `エラーが発生しました (${response.status})`
        }
      }
    }
    return error.message
  }
  return 'エラーが発生しました'
}

/**
 * リトライ機能付き非同期実行
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error | undefined

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      logger.warn(`Retry attempt ${attempt}/${maxRetries} failed:`, lastError.message)

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt))
      }
    }
  }

  throw lastError || new Error('All retry attempts failed')
}
