import { ApiError, GenerateContentResponse, GoogleGenAI, Model, Pager } from "@google/genai";
import { Translator, TranslationResult } from './index.js';

export class GeminiTranslator implements Translator {
  private client: GoogleGenAI;
  private model: string;

  constructor(apiKey: string, model: string = 'gemini-2.5-flash-lite') {
    this.client = new GoogleGenAI({ apiKey: apiKey });
    this.model = model;
  }

  async translate(text: string, sourceLang: string, targetLang: string): Promise<TranslationResult> {
    try {
      const sourceLanguage = this.mapLanguageCode(sourceLang);
      const targetLanguage = this.mapLanguageCode(targetLang);

      const systemPrompt = `You are a professional translator. Translate the following text from ${sourceLanguage} to ${targetLanguage}. Only return the translated text without any additional explanation or comments.`;

      const response: GenerateContentResponse = await this.client.models.generateContent({
        model: this.model,
        contents: text,
        config: {
          systemInstruction: systemPrompt,
        }
      });

      const translatedText = response.text;

      if (!translatedText) {
        throw new Error('翻訳に失敗しました');
      }

      return {
        text: translatedText.trim(),
        detectedSourceLang: sourceLang,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        const message = JSON.parse(error.message).error.message;
        throw new Error(`Gemini翻訳APIエラー: ${message}`);
      } else if (error instanceof Error) {
        throw new Error(`Gemini翻訳エラー: ${error.message}`);
      }
      throw error;
    }
  }

  private mapLanguageCode(code: string): string {
    const languageMap: Record<string, string> = {
      'en': 'English',
      'ja': 'Japanese',
    };

    return languageMap[code.toLowerCase()] || code;
  }
}
