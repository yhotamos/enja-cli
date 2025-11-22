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

  constructor(apiUrl: string, apiKey?: string) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }

  async translate(text: string, sourceLang: string, targetLang: string): Promise<TranslationResult> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          text,
          sourceLang,
          targetLang,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ステータス ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as GASApiResponse;

      if (data.code !== 200 || !data.translatedText) {
        throw new Error(data.error || '翻訳に失敗しました');
      }

      return {
        text: data.translatedText,
        detectedSourceLang: data.detectedSourceLang,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Translation Error: ${error.message}`);
      }
      throw error;
    }
  }
}
