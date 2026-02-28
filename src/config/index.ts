import type { ConfigProfile, TranslateOptions, TranslatorProvider } from '../types/index.js';
import { ConfigStorage } from '../services/config/storage.js';

export async function getConfig(options?: TranslateOptions): Promise<ConfigProfile> {
  const storage = new ConfigStorage();

  // プロファイル指定がある場合はそのプロファイルを取得
  let fileConfig: ConfigProfile;
  if (options?.profile) {
    try {
      fileConfig = await storage.getProfile(options.profile);
    } catch {
      const profiles = await storage.listProfiles();
      throw new Error(
        `プロファイル '${options.profile}' が見つかりません\n利用可能なプロファイル: ${profiles.join(', ')}`
      );
    }
  } else {
    // アクティブプロファイルを取得
    fileConfig = await storage.get();
  }

  // 優先順位: コマンドラインオプション > プロファイル > デフォルト値
  const provider: TranslatorProvider =
    options?.provider ||
    fileConfig.provider ||
    'gas';

  const endpoint: string | undefined =
    options?.endpoint ||
    fileConfig.endpoint;

  const apiKey: string | undefined =
    options?.apiKey ||
    fileConfig.apiKey;

  const model: string | undefined =
    options?.model ||
    fileConfig.model;

  return {
    endpoint,
    provider,
    apiKey,
    model,
  };
}
