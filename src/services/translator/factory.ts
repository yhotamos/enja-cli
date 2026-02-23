import { Translator } from './index.js';
import { GASTranslator } from './gas.js';
import { getConfig } from '../../config/index.js';
import { ConfigProfile, TranslateOptions } from '../../types/index.js';
import { OpenAITranslator } from './openai.js';
import { GeminiTranslator } from './gemini.js';
import { LMStudioTranslator } from './lmstudio.js';
import { ConfigStorage } from '../config/storage.js';
import { validateEndpoint, ValidateEndpointOptions } from '../validate/endpoint.js';

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

  const allowLocalEndpoint = options?.allowLocalEndpoint ?? false;
  const allowPrivateEndpoint = options?.allowPrivateEndpoint ?? false;
  const allowHttp = options?.allowHttp ?? false;
  const validateEndpointOptions: ValidateEndpointOptions = {
    allowLocalEndpoint,
    allowPrivateEndpoint,
    allowHttp
  };

  switch (config.provider) {
    case 'gas':
    case 'custom':
      {
        const { endpoint, apiKey } = config;
        if (!endpoint) {
          throw new Error('エンドポイント URL が必要です');
        }
        validateEndpoint(endpoint, validateEndpointOptions);
        return { translator: new GASTranslator(endpoint, apiKey), config, activeProfile };
      }
    case 'openai':
      {
        const { apiKey, model } = config;
        if (!apiKey) {
          throw new Error('OpenAI を使用するには API キーが必要です');
        }
        return { translator: new OpenAITranslator(apiKey, model), config, activeProfile };
      }
    case 'gemini':
      {
        const { apiKey, model } = config;
        if (!apiKey) {
          throw new Error('Gemini を使用するには API キーが必要です');
        }
        return { translator: new GeminiTranslator(apiKey, model), config, activeProfile };
      }
    case 'lmstudio':
      {
        let { endpoint } = config;
        if (options?.endpoint) {
          validateEndpoint(options.endpoint, validateEndpointOptions);
          endpoint = options.endpoint;
        } else if (endpoint) {
          validateEndpoint(endpoint, validateEndpointOptions);
        } else {
          // どちらにも指定がなければデフォルトのローカルエンドポイントを使う
          // このケースではローカル / HTTP を許可する
          endpoint = LMStudioTranslator.DEFAULT_ENDPOINT;
          validateEndpoint(endpoint, {
            allowLocalEndpoint: true,
            allowPrivateEndpoint: true,
            allowHttp: true,
          });
        }
        if (!config.model) {
          throw new Error('LM Studio を使用するにはモデル名が必要です');
        }
        return { translator: new LMStudioTranslator(endpoint, config.model, config.apiKey), config, activeProfile };
      }
    default:
      throw new Error(`サポートされていないプロバイダー (${config.provider})`);
  }
}
