import type { ConfigProfile, TranslatorStyle } from '../../types/index.js';
import type { ValidateEndpointOptions } from '../validate/endpoint.js';
import { validateEndpoint } from '../validate/endpoint.js';
import type { TranslationResult, Translator } from './index.js';
import { assertStyleSupported } from './prompt.js';

export class CustomTranslator implements Translator {
  static getDefaultProfile(): ConfigProfile {
    return {
      provider: 'custom',
      allowLocalEndpoint: false,
      allowPrivateEndpoint: false,
      allowHttp: false,
    };
  }

  private endpoint: string;
  private apiKey?: string;
  private model?: string;

  constructor(endpoint?: string, apiKey?: string, model?: string, validateEndpointOptions?: ValidateEndpointOptions) {
    if (!endpoint) {
      throw new Error('エンドポイント URL が必要です');
    }
    validateEndpoint(endpoint, validateEndpointOptions);
    this.endpoint = endpoint;
    this.apiKey = apiKey;
    this.model = model;
  }

  getModel(): string | null {
    return this.model || null;
  }

  async translate(text: string, sourceLang: string, targetLang: string, style?: TranslatorStyle): Promise<TranslationResult> {
    assertStyleSupported('custom', style);

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    }

    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        text,
        sourceLang,
        targetLang,
        ...(this.model ? { model: this.model } : {}),
      }),
    });

    const raw = await res.text();

    if (!res.ok) {
      let message: string | undefined;
      try {
        const parsed: unknown = JSON.parse(raw);
        if (this.isRecord(parsed)) {
          const m =
            this.asString(parsed.error) ??
            (this.isRecord(parsed.error) ? this.asString(parsed.error.message) : null) ??
            this.asString(parsed.message);
          if (m) message = m;
        }
      } catch {
        // ignore
      }
      throw new Error(`Custom: HTTP ${res.status} ${res.statusText}${message ? ` - ${message}` : ''}`);
    }

    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch {
      if (raw.trim()) return { text: raw.trim(), detectedSourceLang: sourceLang };
      throw new Error('Custom: レスポンスの JSON 解析に失敗しました');
    }

    const translated = this.extractText(data);
    if (translated) return { text: translated.trim(), detectedSourceLang: sourceLang };

    throw new Error('Custom: レスポンスから翻訳テキストを取得できませんでした');
  }

  private extractText(data: unknown): string | null {
    if (!this.isRecord(data)) return null;

    // OpenAI Chat API 形式の互換性を優先的に処理
    if (Array.isArray(data.choices) && data.choices.length > 0) {
      const choice = data.choices[0];
      if (this.isRecord(choice)) {
        const content = (this.isRecord(choice.message) ? this.asString(choice.message.content) : null) ?? this.asString(choice.text);
        if (content) return content;
      }
    }

    // outputが配列の場合
    if (Array.isArray(data.output)) {
      for (const item of data.output) {
        const found = this.extractFromItem(item);
        if (found) return found;
      }
    }

    // resultsが配列の場合
    if (Array.isArray(data.results) && data.results.length > 0) {
      const first = data.results[0];
      if (this.isRecord(first)) {
        const r = this.asString(first.content) ?? this.asString(first.text);
        if (r) return r;
      }
    }

    // フラットなレスポンスの場合
    return (
      this.asString(data.translation) ??
      this.asString(data.translated_text) ??
      this.asString(data.translatedText) ??
      this.asString(data.result) ??
      this.asString(data.text) ??
      this.asString(data.content) ??
      this.asString(data.response) ??
      this.asString(data.output) ??
      null
    );
  }

  private extractFromItem(item: unknown): string | null {
    if (typeof item === 'string') return item || null;
    if (!this.isRecord(item)) return null;

    if (item.type === 'message' || item.type === 'text') {
      const r = this.asString(item.content) ?? this.asString(item.text);
      if (r) return r;
    }

    return this.asString(item.content) ?? this.asString(item.text) ?? this.asString(item.response) ?? null;
  }

  private isRecord(v: unknown): v is Record<string, unknown> {
    return typeof v === 'object' && v !== null && !Array.isArray(v);
  }

  private asString(v: unknown): string | null {
    return typeof v === 'string' && v.length > 0 ? v : null;
  }
}
