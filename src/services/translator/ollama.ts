import type { ConfigProfile } from '../../types/index.js';
import type { TranslationResult, Translator } from './index.js';

type OllamaResponse = {
  response: string;
  done: boolean;
};

type OllamaError = {
  error: string;
};

export class OllamaTranslator implements Translator {
  static readonly PROVIDER_NAME = 'ollama';
  static readonly DEFAULT_ENDPOINT = 'http://localhost:11434';
  static readonly DEFAULT_MODEL = 'gpt-oss:120b-cloud';

  static getDefaultProfile(): ConfigProfile {
    return {
      provider: OllamaTranslator.PROVIDER_NAME,
      endpoint: OllamaTranslator.DEFAULT_ENDPOINT,
      model: OllamaTranslator.DEFAULT_MODEL,
    };
  }

  private baseUrl: string;
  private model: string;
  private apiKey?: string;

  constructor(endpoint?: string, model?: string, apiKey?: string) {
    this.baseUrl = endpoint || OllamaTranslator.DEFAULT_ENDPOINT;
    this.model = model || OllamaTranslator.DEFAULT_MODEL;
    this.apiKey = apiKey;
  }

  getModel(): string | null {
    return this.model || null;
  }

  async translate(text: string, sourceLang: string, targetLang: string): Promise<TranslationResult> {
    const systemPrompt = `You are a professional translator. Translate the following text from ${sourceLang} to ${targetLang}. Only return the translated text without any additional explanation or comments.`;

    const url = this.baseUrl.endsWith('/api/generate') ? this.baseUrl : `${this.baseUrl}/api/generate`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
    };

    const body: BodyInit = JSON.stringify({
      model: this.model,
      prompt: text,
      system: systemPrompt,
      stream: false,
    });

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body,
    });

    if (!res.ok) {
      const error: OllamaError = await res.json();
      throw new Error(`Ollama HTTP ${res.status} ${res.statusText}: ${error.error}`);
    }

    const data: OllamaResponse = await res.json();

    const textOut = data.response;

    if (!textOut) {
      throw new Error('Ollama: 応答から翻訳テキストを取得できませんでした');
    }

    return { text: String(textOut).trim(), detectedSourceLang: sourceLang };
  }
}
