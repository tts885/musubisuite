/**
 * アプリケーション全体で使用する統一ログユーティリティ
 * 本番環境では自動的にログを無効化
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

class Logger {
  private isDevelopment: boolean

  constructor() {
    this.isDevelopment = import.meta.env.MODE === 'development'
  }

  /**
   * 開発環境でのみデバッグログを出力
   */
  debug(message: string, ...args: unknown[]): void {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, ...args)
    }
  }

  /**
   * 情報ログ（開発環境のみ）
   */
  info(message: string, ...args: unknown[]): void {
    if (this.isDevelopment) {
      console.info(`[INFO] ${message}`, ...args)
    }
  }

  /**
   * 警告ログ（本番環境でも出力）
   */
  warn(message: string, ...args: unknown[]): void {
    console.warn(`[WARN] ${message}`, ...args)
  }

  /**
   * エラーログ（本番環境でも出力し、監視ツールに送信）
   */
  error(message: string, error?: unknown, ...args: unknown[]): void {
    console.error(`[ERROR] ${message}`, error, ...args)
    
    // 本番環境では監視ツール（例: Sentry）にエラーを送信
    if (!this.isDevelopment && error instanceof Error) {
      // TODO: エラー監視サービスへの送信実装
      // Sentry.captureException(error, { extra: { message, ...args } })
    }
  }

  /**
   * APIリクエスト/レスポンスのログ
   */
  api(method: string, url: string, data?: unknown): void {
    if (this.isDevelopment) {
      console.log(`[API] ${method} ${url}`, data || '')
    }
  }

  /**
   * パフォーマンス計測
   */
  performance(label: string, startTime: number): void {
    if (this.isDevelopment) {
      const duration = performance.now() - startTime
      console.log(`[PERF] ${label}: ${duration.toFixed(2)}ms`)
    }
  }
}

// シングルトンインスタンスをエクスポート
export const logger = new Logger()

// 型定義のエクスポート
export type { LogLevel }
