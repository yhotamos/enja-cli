import { Translator } from './index.js';
import { GASTranslator } from './gas.js';
import { getConfig } from '../../config/index.js';

export function createTranslator(): Translator {
  const config = getConfig();

  switch (config.translationProvider) {
    case 'gas':
      return new GASTranslator(config.gasApiUrl);
    default:
      throw new Error(`Config Error: ${config.translationProvider} はサポートされていない翻訳プロバイダーです`);
  }
}
