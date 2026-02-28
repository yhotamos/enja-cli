import type { Translator, TranslationResult } from './index.js';

type LMStudioError = {
  message?: string;
  type?: string;
  code?: string;
  param?: string;
}

type LMStudioOutputItem =
  | string
  | {
    type?: string;
    content?: unknown;
    text?: string;
    response?: string;
    output?: unknown;
  };

interface LMStudioResponse {
  output?: LMStudioOutputItem[];
  error?: string | LMStudioError | { [k: string]: unknown };
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
    const data = this.parseJsonSafe(raw, res) as LMStudioResponse | undefined;

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

    const translated = this.extractTranslatedFromOutput(data);
    if (translated) return { text: translated.trim(), detectedSourceLang: sourceLang };

    if (data?.error) throw new Error(`LMStudio: ${data.error || '不明なエラーが発生しました'}`);
    throw new Error('LMStudio: 出力が見つかりません');
  }

  private resolveEndpoint(baseUrl: string): URL {
    let url: URL;
    try {
      url = new URL(baseUrl);
    } catch {
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

  private parseJsonSafe(raw: string, res: Response): LMStudioResponse | undefined {
    if (!raw) return undefined;
    try {
      const parsed = JSON.parse(raw) as LMStudioResponse;
      return parsed;
    } catch {
      if (!res.ok) {
        const snippet = raw ? `${raw.slice(0, 200)}...` : '';
        throw new Error(`LMStudio: 非JSONレスポンス (HTTP ${res.status} ${res.statusText}) ${snippet}`);
      }
      throw new Error(`LMStudio: レスポンスの JSON 解析に失敗しました`);
    }
  }

  private extractTranslatedFromOutput(data?: LMStudioResponse): string | null {
    if (!data || !Array.isArray(data.output) || data.output.length === 0) return null;

    for (const item of data.output) {
      if (item && typeof item === 'object' && item.type === 'message') {
        const found = this.extractFromItem(item);
        if (found) return found;
      }
    }

    for (const item of data.output) {
      const found = this.extractFromItem(item);
      if (found) return found;
    }
    return null;
  }

  private extractFromItem(item: LMStudioOutputItem): string | null {
    if (!item && item !== '') return null;
    if (typeof item === 'string') return item;
    if (Array.isArray(item)) {
      for (const v of item) {
        const r = this.extractFromItem(v);
        if (r) return r;
      }
      return null;
    }
    if (typeof item === 'object') {
      if (typeof item === 'object' && typeof item.text === 'string') return item.text;
      if (typeof item === 'object' && typeof item.response === 'string') return item.response;
      if (typeof item.content === 'string') return item.content;
      if (item.content && typeof item.content === 'object') {
        const content = item.content as { [k: string]: unknown };
        if (typeof content.text === 'string') return content.text;
        if (typeof content.content === 'string') return content.content;
        const rec = this.extractFromItem(content);
        if (rec) return rec;
      }
      if (Array.isArray(item.content)) {
        for (const v of item.content) {
          const r = this.extractFromItem(v);
          if (r) return r;
        }
      }
      if (Array.isArray(item.output)) {
        const nested = this.extractTranslatedFromOutput({ output: item.output });
        if (nested) return nested;
      }
    }
    return null;
  }
}