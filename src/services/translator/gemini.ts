import type { GenerateContentResponse } from '@google/genai';
import { ApiError, GoogleGenAI } from '@google/genai';
import type { ConfigProfile, TranslatorStyle } from '../../types/index.js';
import type { TranslationResult, Translator } from './index.js';
import { buildSystemPrompt } from './prompt.js';

export class GeminiTranslator implements Translator {
  static readonly DEFAULT_MODEL = process.env.GEMINI_DEFAULT_MODEL || 'gemini-2.5-flash-lite';

  static getDefaultProfile(): ConfigProfile {
    return {
      provider: 'gemini',
      model: GeminiTranslator.DEFAULT_MODEL,
      allowLocalEndpoint: false,
      allowPrivateEndpoint: false,
      allowHttp: false,
    };
  }

  private client: GoogleGenAI;
  private model: string;

  constructor(apiKey?: string, model: string = GeminiTranslator.DEFAULT_MODEL) {
    if (!apiKey) {
      throw new Error('Gemini を使用するには API キーが必要です');
    }
    this.client = new GoogleGenAI({ apiKey });
    this.model = model;
  }

  getModel(): string {
    return this.model;
  }

  async translate(text: string, sourceLang: string, targetLang: string, style?: TranslatorStyle): Promise<TranslationResult> {
    try {
      const systemPrompt = buildSystemPrompt(sourceLang, targetLang, style);

      const response: GenerateContentResponse = await this.client.models.generateContent({
        model: this.model,
        contents: text,
        config: {
          systemInstruction: systemPrompt,
        },
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
}
