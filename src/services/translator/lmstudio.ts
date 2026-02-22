import { Translator, TranslationResult } from './index.js';

type LMStudioError = {
  message: string;
  type?: string;
  code?: string;
  param?: string;
}

type LMStudioMessage = {
  type: 'message';
  content: string;
}

export class LMStudioTranslator implements Translator {
  public static readonly DEFAULT_ENDPOINT = 'http://localhost:1234/api/v1/chat';
  private baseUrl: string;
  private model: string;
  private apiKey?: string;

  constructor(endpoint: string = LMStudioTranslator.DEFAULT_ENDPOINT, model: string, apiKey?: string) {
    this.baseUrl = endpoint;
    this.model = model;
    this.apiKey = apiKey;
  }

  getModel(): string | null {
    return this.model || null;
  }

  async translate(text: string, sourceLang: string, targetLang: string): Promise<TranslationResult> {
    const systemPrompt = `You are a professional translator. Translate the following text from ${sourceLang} to ${targetLang}. Only return the translated text without any additional explanation.`;

    const url = this.resolveEndpoint(this.baseUrl);

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {}),
    };

    const body: BodyInit = JSON.stringify({
      model: this.model,
      system_prompt: systemPrompt,
      input: text,
    });

    const res = await fetch(url.toString(), {
      method: 'POST',
      headers,
      body,
    });

    const raw = await res.text();
    const data = this.parseJsonSafe(raw, res);

    if (!res.ok) {
      // parseJsonSafe が既に data.error の基本チェックは行わないためここで処理
      if (data?.error) {
        if (typeof data.error === 'string') {
          throw new Error(`LMStudio: ${data.error}`);
        }
        const { message, code }: LMStudioError = data.error;
        if (code === 'model_not_found') {
          throw new Error(`LMStudio: モデル "${this.model}" が見つかりません。モデル名を確認してください。`);
        }
        if (code === 'invalid_api_key') {
          throw new Error('LMStudio: APIキーが無効です。API キーを確認してください。');
        }
        const base = message || 'LMStudio: 不明なエラーが発生しました';
        throw new Error(base);
      }
      throw new Error(`LMStudio: HTTP ${res.status} ${res.statusText}`);
    }

    // POST /api/v1/chat の場合は data.output が配列で返る
    // data.output[0] がシステムプロンプトのエコー，data.output[1] が翻訳結果になる
    if (data && Array.isArray(data.output) && data.output.length >= 2) {
      const output: LMStudioMessage | any = data.output[1];
      if (output.type !== 'message') {
        throw new Error('LMStudio: 予期しない出力形式です');
      }

      const content = output.content;
      let translatedText: string | null = null;

      if (typeof content === 'string') {
        translatedText = content;
      } else if (content && typeof content.text === 'string') {
        translatedText = content.text; // text フィールドを優先
      } else if (content && typeof content.content === 'string') {
        translatedText = content.content;
      } else if (Array.isArray(content) && content.length > 0 && typeof content[0] === 'string') {
        translatedText = content[0];
      }

      if (!translatedText) {
        throw new Error('LMStudio: 翻訳結果が空です');
      }

      return { text: translatedText, detectedSourceLang: sourceLang };
    }

    if (data?.error) {
      throw new Error(`LMStudio: ${data.error || '不明なエラーが発生しました'}`);
    }

    throw new Error('LMStudio: 出力が見つかりません');
  }

  private resolveEndpoint(baseUrl: string): URL {
    let url: URL;
    try {
      url = new URL(baseUrl);
    } catch (e) {
      throw new Error('LMStudio: エンドポイントの URL が不正です（例: http://localhost:1234/）');
    }

    const normalizedPath = url.pathname.replace(/\/+$/, '');
    if (normalizedPath === '' || normalizedPath === '/') {
      url.pathname = '/api/v1/chat';
    } else if (normalizedPath === '/api/v1/chat') {
      // そのまま
    } else {
      throw new Error('LMStudio: エンドポイント URL は "/api/v1/chat" を含めるか，パスを空にしてください');
    }

    return url;
  }

  private parseJsonSafe(raw: string, res: any): any {
    if (!raw) return undefined;
    try {
      return JSON.parse(raw);
    } catch (e) {
      if (!res.ok) {
        const snippet = raw ? `${raw.slice(0, 200)}...` : '';
        throw new Error(`LMStudio: 非JSONレスポンス (HTTP ${res.status}) ${snippet}`);
      }
      throw new Error(`LMStudio: レスポンスの JSON 解析に失敗しました`);
    }
  }
}