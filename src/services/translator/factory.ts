import { resolveConfig } from '../../config/index.js';
import type { TranslateOptions, TranslatorProvider } from '../../types/index.js';
import type { ValidateEndpointOptions } from '../validate/endpoint.js';
import { CustomTranslator } from './custom.js';
import { GASTranslator } from './gas.js';
import { GeminiTranslator } from './gemini.js';
import type { Translator } from './index.js';
import { LMStudioTranslator } from './lmstudio.js';
import { OllamaTranslator } from './ollama.js';
import { OpenAITranslator } from './openai.js';

export interface CreatedTranslator {
  translator: Translator;
  profileName: string;
  provider: TranslatorProvider;
}

export async function createTranslator(options?: TranslateOptions): Promise<CreatedTranslator> {
  const { config, profileName } = await resolveConfig(options);
  const { provider, endpoint, apiKey, model, allowLocalEndpoint, allowPrivateEndpoint, allowHttp } = config;
  const validateEndpointOptions: ValidateEndpointOptions = {
    allowLocalEndpoint,
    allowPrivateEndpoint,
    allowHttp,
  };

  let translator: Translator;

  switch (provider) {
    case 'custom':
      translator = new CustomTranslator(endpoint, apiKey, model, validateEndpointOptions);
      break;
    case 'gas':
      translator = new GASTranslator(endpoint, apiKey, validateEndpointOptions);
      break;
    case 'openai':
      translator = new OpenAITranslator(apiKey, model);
      break;
    case 'gemini':
      translator = new GeminiTranslator(apiKey, model);
      break;
    case 'lmstudio':
      translator = new LMStudioTranslator(endpoint, model, apiKey, validateEndpointOptions);
      break;
    case 'ollama':
      translator = new OllamaTranslator(endpoint, model, apiKey, validateEndpointOptions);
      break;
    default:
      throw new Error(`サポートされていないプロバイダー (${provider}) です`);
  }

  return { translator, profileName, provider };
}
