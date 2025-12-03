import { ConfigProfile, TranslateOptions, TranslatorProvider } from '../types/index.js';
import { ConfigStorage } from '../services/config/storage.js';

const DEFAULT_GAS_API_URL = "https://script.google.com/macros/s/AKfycbxOSbKD0aBTaQqIzHv00BMzp6WwrtWHBU3gJY0vhB2HblgUO-cgesfT1l-rrfttnWZzew/exec";

export async function getConfig(options?: TranslateOptions): Promise<ConfigProfile> {
  // 設定ファイルから読み込み
  const storage = new ConfigStorage();
  const fileConfig = await storage.get();

  // 優先順位: コマンドラインオプション > 設定ファイル > デフォルト値
  const endpoint: string =
    options?.endpoint ||
    fileConfig.endpoint ||
    DEFAULT_GAS_API_URL;

  const apiKey: string | undefined =
    options?.apiKey ||
    fileConfig.apiKey;

  const provider: TranslatorProvider =
    options?.provider ||
    fileConfig.provider ||
    'gas';

  return {
    endpoint,
    provider,
    apiKey,
  };
}
