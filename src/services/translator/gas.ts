import { Translator, TranslationResult } from './index.js';

interface GASApiResponse {
  code: number;
  translatedText?: string;
  detectedSourceLang?: string;
  error?: string;
}

export class GASTranslator implements Translator {
  private apiUrl: string;
  private apiKey?: string;

  constructor(endpoint: string, apiKey?: string) {
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
