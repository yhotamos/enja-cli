import { Translator } from './index.js';
import { GASTranslator } from './gas.js';
import { getConfig } from '../../config/index.js';
import { ConfigProfile, TranslateOptions } from '../../types/index.js';
import { OpenAITranslator } from './openai.js';
import { GeminiTranslator } from './gemini.js';
import { ConfigStorage } from '../config/storage.js';
import { validateEndpoint } from '../validate/endpoint.js';

interface TranslatorProvider {
  translator: Translator;
  config: ConfigProfile;
  activeProfile: string;
}

export async function createTranslator(options?: TranslateOptions): Promise<TranslatorProvider> {
  const storage = new ConfigStorage();
  const config: ConfigProfile = await getConfig(options);

  // activeProfileを取得
  let activeProfile: string;
  if (options?.profile) {
    activeProfile = options.profile;
  } else {
    activeProfile = await storage.getActiveProfileName();
  }

  switch (config.provider) {
    case 'gas':
    case 'custom':
      {
        const { endpoint, apiKey } = config;
        if (!endpoint) {
          throw new Error('エンドポイントURLが必要です');
        }
        validateEndpoint(endpoint, {
          allowLocalEndpoint: options?.allowLocalEndpoint ?? false,
          allowPrivateEndpoint: options?.allowPrivateEndpoint ?? false,
          allowHttp: options?.allowHttp ?? false,
        });
        return { translator: new GASTranslator(endpoint, apiKey), config, activeProfile };
      }
    case 'openai':
      {
        const { apiKey, model } = config;
        if (!apiKey) {
          throw new Error('OpenAIを使用するにはAPIキーが必要です');
        }
        return { translator: new OpenAITranslator(apiKey, model), config, activeProfile };
      }
    case 'gemini':
      {
        const { apiKey, model } = config;
        if (!apiKey) {
          throw new Error('Geminiを使用するにはAPIキーが必要です');
        }
        return { translator: new GeminiTranslator(apiKey, model), config, activeProfile };
      }
    default:
      throw new Error(`サポートされていないプロバイダー (${config.provider})`);
  }
}
