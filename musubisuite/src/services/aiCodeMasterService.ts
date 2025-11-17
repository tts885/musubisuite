/**
 * AI Code Master Service
 * 
 * AIを活用してカテゴリに適した色とアイコンを自動生成するサービス
 */

export interface AIGenerateRequest {
  category_name: string;
  category_description?: string;
  existing_codes?: Array<{
    name: string;
    color?: string;
    icon?: string;
  }>;
}

export interface AIGenerateResponse {
  color: string;
  icon: string;
  reasoning?: string;
}

export interface StreamCallbacks {
  onChunk?: (content: string) => void;
  onComplete?: (result: AIGenerateResponse) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
}

class AICodeMasterService {
  /**
   * カテゴリに適した色とアイコンをAIで生成（ストリーミング）
   */
  async generateColorAndIcon(
    request: AIGenerateRequest,
    callbacks?: StreamCallbacks
  ): Promise<AIGenerateResponse> {
    try {
      callbacks?.onStart?.();

      const response = await fetch(`${this.getBaseURL()}/ai-code-master/generate/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('レスポンスボディが空です');
      }

      // SSEストリームをパース
      const result = await this.parseSSEStream(response.body, callbacks);
      
      callbacks?.onComplete?.(result);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
      callbacks?.onError?.(errorMessage);
      throw error;
    }
  }

  /**
   * カテゴリに適した色とアイコンをAIで生成（非ストリーミング）
   */
  async generateColorAndIconSync(request: AIGenerateRequest): Promise<AIGenerateResponse> {
    const response = await fetch(`${this.getBaseURL()}/ai-code-master/generate-sync/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * SSE形式のストリームをパース
   */
  private async parseSSEStream(
    stream: ReadableStream<Uint8Array>,
    callbacks?: StreamCallbacks
  ): Promise<AIGenerateResponse> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullContent = '';

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
            const data = JSON.parse(line.slice(6));

            if (data.error) {
              throw new Error(data.error);
            }

            if (data.done) {
              // 完了時に最終結果をパース
              return this.parseAIResponse(fullContent);
            }

            if (data.content) {
              fullContent += data.content;
              callbacks?.onChunk?.(data.content);
            }
          } catch (e) {
            console.warn('JSON parse error:', line);
          }
        }
      }

      // ストリーム終了時
      return this.parseAIResponse(fullContent);
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * AIレスポンスをパースして色とアイコンを抽出
   */
  private parseAIResponse(content: string): AIGenerateResponse {
    try {
      // JSON形式で返ってくる場合
      const jsonMatch = content.match(/\{[\s\S]*"color"[\s\S]*"icon"[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          color: parsed.color || '#3b82f6',
          icon: parsed.icon || 'Folder',
          reasoning: parsed.reasoning,
        };
      }

      // マークダウン形式で返ってくる場合
      const colorMatch = content.match(/[色カラー][:：]\s*(#[0-9a-fA-F]{6})/i);
      const iconMatch = content.match(/[アイコン][:：]\s*([A-Z][a-zA-Z0-9]*)/i);

      return {
        color: colorMatch ? colorMatch[1] : '#3b82f6',
        icon: iconMatch ? iconMatch[1] : 'Folder',
        reasoning: content,
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return {
        color: '#3b82f6',
        icon: 'Folder',
        reasoning: content,
      };
    }
  }

  /**
   * ベースURLを取得
   */
  private getBaseURL(): string {
    return import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  }
}

export const aiCodeMasterService = new AICodeMasterService();
