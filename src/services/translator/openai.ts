import OpenAI from 'openai';
import type { Translator, TranslationResult } from './index.js';

export class OpenAITranslator implements Translator {
  public static readonly DEFAULT_MODEL = process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini';
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = OpenAITranslator.DEFAULT_MODEL) {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  getModel(): string {
    return this.model;
  }

  async translate(text: string, sourceLang: string, targetLang: string): Promise<TranslationResult> {
    try {
      const sourceLanguage = this.mapLanguageCode(sourceLang);
      const targetLanguage = this.mapLanguageCode(targetLang);

      const systemPrompt = `You are a professional translator. Translate the following text from ${sourceLanguage} to ${targetLanguage}. Only return the translated text without any additional explanation or comments.`;

      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: text,
          },
        ],
        temperature: 0.3,
      });

      const translatedText = completion.choices[0]?.message?.content;

      if (!translatedText) {
        throw new Error('翻訳に失敗しました');
      }

      return {
        text: translatedText.trim(),
        detectedSourceLang: sourceLang,
      };
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        throw new Error(`OpenAI翻訳APIエラー: ${error.message}`);
      } else if (error instanceof Error) {
        throw new Error(`OpenAI翻訳エラー: ${error.message}`);
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
