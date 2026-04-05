import { getConfig } from '../../config/index.js';
import type { ConfigProfile, TranslateOptions } from '../../types/index.js';
import { ConfigStorage } from '../config/storage.js';
import type { ValidateEndpointOptions } from '../validate/endpoint.js';
import { validateEndpoint } from '../validate/endpoint.js';
import { CustomTranslator } from './custom.js';
import { GASTranslator } from './gas.js';
import { GeminiTranslator } from './gemini.js';
import type { Translator } from './index.js';
import { LMStudioTranslator } from './lmstudio.js';
import { OllamaTranslator } from './ollama.js';
import { OpenAITranslator } from './openai.js';

interface TranslatorProvider {
  translator: Translator;
  config: ConfigProfile;
  activeProfile: string;
}

type ResolveEndpointArgs = {
  defaultUrl: string;
  configUrl?: string;
  optionUrl?: string;
  validateOpts: ValidateEndpointOptions;
};

function resolveEndpoint({ defaultUrl, configUrl, optionUrl, validateOpts }: ResolveEndpointArgs): string {
  if (optionUrl) {
    validateEndpoint(optionUrl, validateOpts);
    return optionUrl;
  }

  if (configUrl) {
    validateEndpoint(configUrl, validateOpts);
    return configUrl;
  }

  validateEndpoint(defaultUrl, { allowLocalEndpoint: true, allowPrivateEndpoint: true, allowHttp: true });
  return defaultUrl;
}

export async function createTranslator(options?: TranslateOptions): Promise<TranslatorProvider> {
  const storage = new ConfigStorage();
  const config: ConfigProfile = await getConfig(options);

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
    allowHttp,
  };

  const { provider, endpoint, apiKey, model } = config;

  switch (provider) {
    case 'custom': {
      if (!endpoint) {
        throw new Error('エンドポイント URL が必要です');
      }
      validateEndpoint(endpoint, validateEndpointOptions);
      return { translator: new CustomTranslator(endpoint, apiKey, model), config, activeProfile };
    }
    case 'gas': {
      if (!endpoint) {
        throw new Error('エンドポイント URL が必要です');
      }
      validateEndpoint(endpoint, validateEndpointOptions);
      return { translator: new GASTranslator(endpoint, apiKey), config, activeProfile };
    }
    case 'openai': {
      if (!apiKey) {
        throw new Error('OpenAI を使用するには API キーが必要です');
      }
      return { translator: new OpenAITranslator(apiKey, model), config, activeProfile };
    }
    case 'gemini': {
      if (!apiKey) {
        throw new Error('Gemini を使用するには API キーが必要です');
      }
      return { translator: new GeminiTranslator(apiKey, model), config, activeProfile };
    }
    case 'lmstudio': {
      if (!model) {
        throw new Error('LM Studio を使用するにはモデル名が必要です');
      }
      const url = resolveEndpoint({
        defaultUrl: LMStudioTranslator.DEFAULT_ENDPOINT,
        configUrl: endpoint,
        optionUrl: options?.endpoint,
        validateOpts: validateEndpointOptions,
      });
      return { translator: new LMStudioTranslator(url, model, apiKey), config, activeProfile };
    }
    case 'ollama': {
      const url = resolveEndpoint({
        defaultUrl: OllamaTranslator.DEFAULT_ENDPOINT,
        configUrl: endpoint,
        optionUrl: options?.endpoint,
        validateOpts: validateEndpointOptions,
      });
      return { translator: new OllamaTranslator(url, model, apiKey), config, activeProfile };
    }
    default:
      throw new Error(`サポートされていないプロバイダー (${provider}) です`);
  }
}
