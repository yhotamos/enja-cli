import { Translator } from './index.js';
import { GASTranslator } from './gas.js';
import { getConfig } from '../../config/index.js';
import { ConfigProfile, TranslateOptions } from '../../types/index.js';
import { OpenAITranslator } from './openai.js';
import { GeminiTranslator } from './gemini.js';

export async function createTranslator(options?: TranslateOptions): Promise<Translator> {
  const config: ConfigProfile = await getConfig(options);

  switch (config.provider) {
    case 'gas':
    case 'custom':
      {
        const { endpoint, apiKey } = config;
        if (!endpoint) {
          throw new Error('エンドポイントURLが必要です');
        }
        return new GASTranslator(endpoint, apiKey);
      }
    case 'openai':
      {
        const { apiKey, model } = config;
        if (!apiKey) {
          throw new Error('OpenAIを使用するにはAPIキーが必要です');
        }
        return new OpenAITranslator(apiKey, model);
      }
    case 'gemini':
      {
        const { apiKey, model } = config;
        if (!apiKey) {
          throw new Error('Geminiを使用するにはAPIキーが必要です');
        }
        return new GeminiTranslator(apiKey, model);
      }
    default:
      throw new Error(`サポートされていないプロバイダー (${config.provider})`);
  }
}
