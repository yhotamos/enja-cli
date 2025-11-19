import { Translator, TranslationResult } from './index.js';

interface GASApiResponse {
  code: number;
  translatedText?: string;
  detectedSourceLang?: string;
  error?: string;
}

export class GASTranslator implements Translator {
  private apiUrl: string;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  async translate(text: string, sourceLang: string, targetLang: string): Promise<TranslationResult> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
