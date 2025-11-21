/**
 * AI Streaming Service
 * 
 * SSE (Server-Sent Events) を使用したAIストリーミングレスポンスの処理
 * 
 * 使用例:
 * ```typescript
 * const service = new AIStreamService();
 * 
 * await service.streamPrompt(
 *   '/api/ai-settings/providers/1/test-prompt/',
 *   { prompt: 'こんにちは' },
 *   {
 *     onChunk: (content) => console.log(content),
 *     onComplete: () => console.log('完了'),
 *     onError: (error) => console.error(error)
 *   }
 * );
 * ```
 */

export interface StreamCallbacks {
  onChunk: (content: string) => void;
  onComplete?: () => void;
  onError?: (error: string) => void;
  onStart?: () => void;
}

export interface StreamResponse {
  content?: string;
  done?: boolean;
  error?: string;
}

export class AIStreamService {
  private abortController: AbortController | null = null;

  /**
   * AIプロンプトをストリーミング実行
   * 
   * @param url - APIエンドポイントURL
   * @param data - リクエストボディ
   * @param callbacks - コールバック関数
   */
  async streamPrompt(
    url: string,
    data: Record<string, any>,
    callbacks: StreamCallbacks
  ): Promise<void> {
    this.abortController = new AbortController();
    
    try {
      callbacks.onStart?.();

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify(data),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('レスポンスボディが空です');
      }

      // ReadableStreamをSSE形式でパース
      await this.parseSSEStream(response.body, callbacks);

    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.log('Stream was aborted');
        } else {
          callbacks.onError?.(error.message);
        }
      } else {
        callbacks.onError?.('不明なエラーが発生しました');
      }
    } finally {
      this.abortController = null;
    }
  }

  /**
   * SSE形式のストリームをパース（最適化版）
   */
  private async parseSSEStream(
    stream: ReadableStream<Uint8Array>,
    callbacks: StreamCallbacks
  ): Promise<void> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // 行単位で処理
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;

          try {
            const data: StreamResponse = JSON.parse(line.slice(6));

            if (data.error) {
              callbacks.onError?.(data.error);
              return;
            }

            if (data.done) {
              callbacks.onComplete?.();
              return;
            }

            if (data.content) {
              callbacks.onChunk(data.content);
            }
          } catch (e) {
            console.warn('JSON parse error:', line);
          }
        }
      }
      
      // ストリーム終了時も完了扱い
      callbacks.onComplete?.();
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * ストリーミングを中断
   */
  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }
}

// シングルトンインスタンス
export const aiStreamService = new AIStreamService();
