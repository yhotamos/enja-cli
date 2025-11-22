import { Translator } from './index.js';
import { GASTranslator } from './gas.js';
import { getConfig, Config } from '../../config/index.js';
import { TranslateOptions } from '../../types/index.js';

export async function createTranslator(options?: TranslateOptions): Promise<Translator> {
  const config: Config = await getConfig(options);

  switch (config.provider) {
    case 'gas':
    case 'custom':
      return new GASTranslator(config.endpoint, config.apiKey);
    default:
      throw new Error(`Error config provider: ${config.provider} はサポートされていない翻訳プロバイダーです`);
  }
}
