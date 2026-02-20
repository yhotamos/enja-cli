import { Translator, TranslationResult } from './index.js';

interface GASApiResponse {
  code: number;
  translatedText?: string;
  detectedSourceLang?: string;
  error?: string;
}

const GAS_ENDPOINT_URL_PATTERN: RegExp = /^https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]+\/exec$/;

export class GASTranslator implements Translator {
  private apiUrl: string;
  private apiKey?: string;

  constructor(endpoint: string, apiKey?: string) {
    if (!GAS_ENDPOINT_URL_PATTERN.test(endpoint)) {
      throw new Error('無効なGASエンドポイントURLです');
    }
    this.apiUrl = endpoint;
    this.apiKey = apiKey;
  }

  getModel(): string | null {
    return null;
  }

  async translate(text: string, sourceLang: string, targetLang: string): Promise<TranslationResult> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ text, sourceLang, targetLang }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as GASApiResponse;

    if (data.code !== 200 || !data.translatedText) {
      throw new Error(`${data.error || '翻訳に失敗しました'}`);
    }

    return {
      text: data.translatedText,
      detectedSourceLang: data.detectedSourceLang,
    };
  }
}
