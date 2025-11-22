import { Translator } from './index.js';
import { GASTranslator } from './gas.js';
import { getConfig, Config } from '../../config/index.js';
import { TranslateOptions } from '../../types/index.js';

export function createTranslator(options?: TranslateOptions): Translator {
  const config: Config = getConfig(options);

  switch (config.provider) {
    case 'gas':
    case 'custom':
      return new GASTranslator(config.endpoint, config.apiKey);
    default:
      throw new Error(`Config Error: ${config.provider} はサポートされていない翻訳プロバイダーです`);
  }
}
