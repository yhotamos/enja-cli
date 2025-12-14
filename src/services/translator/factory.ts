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
      return new GASTranslator(config.endpoint, config.apiKey);
    case 'openai':
      if (!config.apiKey) {
        throw new Error('OpenAIを使用するにはAPIキーが必要です');
      }
      return new OpenAITranslator(config.apiKey);
    case 'gemini':
      if (!config.apiKey) {
        throw new Error('Geminiを使用するにはAPIキーが必要です');
      }
      return new GeminiTranslator(config.apiKey);
    default:
      throw new Error(`サポートされていないプロバイダー (${config.provider})`);
  }
}
