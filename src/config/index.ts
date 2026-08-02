import { ConfigStorage } from '../services/config/storage.js';
import type { ConfigProfile, TranslateOptions } from '../types/index.js';

export interface ResolvedConfig {
  profileName: string;
  config: ConfigProfile;
}

export async function resolveConfig(options?: TranslateOptions): Promise<ResolvedConfig> {
  const storage = new ConfigStorage();
  const { profileName, config: fileConfig } = await storage.getResolvedProfile(options?.profile);

  // 優先順位: コマンドラインオプション > プロファイル > デフォルト値
  const config: ConfigProfile = {
    provider: options?.provider || fileConfig.provider || 'gas',
    endpoint: options?.endpoint || fileConfig.endpoint,
    apiKey: options?.apiKey || fileConfig.apiKey,
    model: options?.model || fileConfig.model,
    allowLocalEndpoint: options?.allowLocalEndpoint ?? fileConfig.allowLocalEndpoint ?? false,
    allowPrivateEndpoint: options?.allowPrivateEndpoint ?? fileConfig.allowPrivateEndpoint ?? false,
    allowHttp: options?.allowHttp ?? fileConfig.allowHttp ?? false,
  };

  return { profileName, config };
}
