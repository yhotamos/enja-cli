import { TranslateOptions } from '../types/index.js';

export interface Config {
  endpoint: string;
  provider: 'gas' | 'custom';
  apiKey?: string;
}

const DEFAULT_GAS_API_URL = "https://script.google.com/macros/s/AKfycbxOSbKD0aBTaQqIzHv00BMzp6WwrtWHBU3gJY0vhB2HblgUO-cgesfT1l-rrfttnWZzew/exec";

export function getConfig(options?: TranslateOptions): Config {
  // 優先順位: コマンドラインオプション > デフォルト値
  const endpoint = options?.endpoint || DEFAULT_GAS_API_URL;
  const apiKey = options?.apiKey || undefined;
  const provider = (options?.provider as 'gas' | 'custom') || 'gas';

  return {
    endpoint,
    provider,
    apiKey,
  };
}
