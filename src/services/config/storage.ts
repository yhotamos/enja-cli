import { promises as fs } from 'node:fs';
import type { AppConfig, ConfigProfile, TranslatorProvider } from '../../types/index.js';
import { getConfigDir, getConfigFilePath } from '../../utils/paths.js';
import { CustomTranslator } from '../translator/custom.js';
import { GASTranslator } from '../translator/gas.js';
import { GeminiTranslator } from '../translator/gemini.js';
import { LMStudioTranslator } from '../translator/lmstudio.js';
import { OllamaTranslator } from '../translator/ollama.js';
import { OpenAITranslator } from '../translator/openai.js';
import { validateProfileName } from '../validate/profile.js';
import type { ConfigManager } from './index.js';

const DEFAULT_PROVIDER: TranslatorProvider = 'gas';

// プロバイダごとのデフォルト設定
const defaultProfileFactories: Record<TranslatorProvider, () => ConfigProfile> = {
  gas: GASTranslator.getDefaultProfile,
  openai: OpenAITranslator.getDefaultProfile,
  gemini: GeminiTranslator.getDefaultProfile,
  lmstudio: LMStudioTranslator.getDefaultProfile,
  ollama: OllamaTranslator.getDefaultProfile,
  custom: CustomTranslator.getDefaultProfile,
};

const defaultAppConfig: AppConfig = {
  version: '1.1',
  activeProfile: 'default',
  profiles: {
    default: defaultProfileFactories[DEFAULT_PROVIDER](),
  },
};

/** 設定の永続化を管理するクラス */
export class ConfigStorage implements ConfigManager {
  private filePath: string;

  constructor() {
    this.filePath = getConfigFilePath();
  }

  /** 設定を取得 */
  async get(): Promise<ConfigProfile> {
    return await this.readConfig();
  }

  // プロファイル管理メソッド

  /** アクティブプロファイル名を取得 */
  async getActiveProfileName(): Promise<string> {
    const appConfig = await this.readAppConfig();
    return appConfig.activeProfile;
  }

  /** 指定されたプロファイルを取得 */
  async getProfile(name: string): Promise<ConfigProfile> {
    const appConfig = await this.readAppConfig();
    const profile = appConfig.profiles[name];
    if (!profile) {
      throw new Error(`プロファイル '${name}' が見つかりません`);
    }
    return profile;
  }

  /** プロファイル一覧を取得 */
  async listProfiles(): Promise<string[]> {
    const appConfig = await this.readAppConfig();
    return Object.keys(appConfig.profiles);
  }

  /** アクティブプロファイルを変更 */
  async useProfile(name: string): Promise<void> {
    const appConfig = await this.readAppConfig();

    if (!appConfig.profiles[name]) {
      const availableProfiles = Object.keys(appConfig.profiles).join(', ');
      throw new Error(`プロファイル '${name}' が見つかりません\n利用可能なプロファイル: ${availableProfiles}`);
    }

    appConfig.activeProfile = name;
    await this.writeAppConfig(appConfig);
  }

  /** プロファイルを追加 */
  async addProfile(name: string, config?: Partial<ConfigProfile>): Promise<void> {
    validateProfileName(name);

    // プロバイダーのバリデーション（defaultProfileFactories にキーが存在するかで判定）
    if (config?.provider) {
      if (!this.isTranslatorProvider(config.provider)) {
        const available = Object.keys(defaultProfileFactories).join(', ');
        throw new Error(`無効なプロバイダー '${config.provider}': ${available} のいずれかを指定してください`);
      }
    }

    const appConfig = await this.readAppConfig();

    if (appConfig.profiles[name]) {
      throw new Error(`プロファイル '${name}' は既に存在します`);
    }

    // プロバイダに応じたデフォルト設定を取得
    const provider = config?.provider || DEFAULT_PROVIDER;
    const defaultProfile = this.getDefaultProfileByProvider(provider);

    // 指定された設定で上書き
    const newProfile: ConfigProfile = {
      ...defaultProfile,
      ...config,
    };
    appConfig.profiles[name] = newProfile;

    await this.writeAppConfig(appConfig);
  }

  /** プロファイル名を変更 */
  async renameProfile(oldProfileName: string, newProfileName: string): Promise<void> {
    if (oldProfileName === 'default') {
      throw new Error(`'default' プロファイルは名前を変更できません`);
    }
    if (oldProfileName === newProfileName) return;

    validateProfileName(newProfileName);

    const appConfig = await this.readAppConfig();

    if (!appConfig.profiles[oldProfileName]) {
      throw new Error(`プロファイル '${oldProfileName}' が見つかりません`);
    }
    if (appConfig.profiles[newProfileName]) {
      throw new Error(`プロファイル '${newProfileName}' は既に存在します`);
    }

    // 実際のリネーム操作
    appConfig.profiles[newProfileName] = appConfig.profiles[oldProfileName];
    delete appConfig.profiles[oldProfileName];

    // アクティブプロファイルの更新
    if (appConfig.activeProfile === oldProfileName) {
      appConfig.activeProfile = newProfileName;
    }

    await this.writeAppConfig(appConfig);
  }

  /** プロファイルをコピー */
  async copyProfile(sourceProfileName: string, targetProfileName: string): Promise<void> {
    if (sourceProfileName === targetProfileName) {
      throw new Error(`コピー元とコピー先のプロファイル名が同じです`);
    }

    validateProfileName(targetProfileName);

    const appConfig = await this.readAppConfig();

    if (!appConfig.profiles[sourceProfileName]) {
      throw new Error(`プロファイル '${sourceProfileName}' が見つかりません`);
    }
    if (appConfig.profiles[targetProfileName]) {
      throw new Error(`プロファイル '${targetProfileName}' は既に存在します`);
    }

    appConfig.profiles[targetProfileName] = { ...appConfig.profiles[sourceProfileName] };

    await this.writeAppConfig(appConfig);
  }

  /** プロファイルを削除 */
  async deleteProfile(name: string): Promise<void> {
    if (name === 'default') {
      throw new Error(`'default' プロファイルは削除できません`);
    }

    const appConfig = await this.readAppConfig();

    if (!appConfig.profiles[name]) {
      throw new Error(`プロファイル '${name}' が見つかりません`);
    }

    delete appConfig.profiles[name];

    // アクティブプロファイルが削除された場合は default に戻す
    if (appConfig.activeProfile === name) {
      appConfig.activeProfile = 'default';
    }

    await this.writeAppConfig(appConfig);
  }

  /** プロファイルの設定を変更 */
  async setProfileConfig(profileName: string, key: string, value: string): Promise<void> {
    const appConfig = await this.readAppConfig();

    // プロファイルが存在しない場合はエラー
    if (!appConfig.profiles[profileName]) {
      throw new Error(`プロファイル '${profileName}' が見つかりません．'enja config add ${profileName}' で作成してください`);
    }

    const profile = appConfig.profiles[profileName];

    switch (key) {
      case 'endpoint':
        profile.endpoint = value;
        break;
      case 'api-key':
        profile.apiKey = value;
        break;
      case 'provider':
        if (!this.isTranslatorProvider(value)) {
          const available = Object.keys(defaultProfileFactories).join(', ');
          throw new Error(`無効なプロバイダー (${value}): ${available} のいずれかを指定してください`);
        }
        profile.provider = value;
        break;
      case 'model':
        profile.model = value;
        break;
      default:
        throw new Error(`無効な設定キー (${key})`);
    }

    await this.writeAppConfig(appConfig);
  }

  /** プロファイルの設定をリセット */
  async unsetProfileConfig(profileName: string, key: string): Promise<void> {
    const appConfig = await this.readAppConfig();

    if (!appConfig.profiles[profileName]) {
      throw new Error(`プロファイル '${profileName}' が見つかりません`);
    }

    const profile = appConfig.profiles[profileName];
    const provider = profile.provider || DEFAULT_PROVIDER;
    const defaultProfile = this.getDefaultProfileByProvider(provider);

    switch (key) {
      case 'provider':
        profile.provider = defaultProfile.provider;
        break;
      case 'endpoint':
        profile.endpoint = defaultProfile.endpoint;
        break;
      case 'api-key':
        profile.apiKey = defaultProfile.apiKey;
        break;
      case 'model':
        profile.model = defaultProfile.model;
        break;
      default:
        throw new Error(`無効な設定キー (${key})`);
    }

    await this.writeAppConfig(appConfig);
  }

  /** プロファイル全体をリセット */
  async resetProfileConfig(profileName: string): Promise<void> {
    const appConfig = await this.readAppConfig();

    if (!appConfig.profiles[profileName]) {
      throw new Error(`プロファイル '${profileName}' が見つかりません`);
    }
    const defaultProfile = this.getDefaultProfile();

    appConfig.profiles[profileName] = { ...defaultProfile };
    await this.writeAppConfig(appConfig);
  }

  private static isAppConfig(obj: unknown): obj is AppConfig {
    if (!obj || typeof obj !== 'object') return false;
    if (!('profiles' in obj) || !('activeProfile' in obj)) return false;
    if (typeof obj.activeProfile !== 'string') return false;
    if (typeof obj.profiles !== 'object' || obj.profiles === null) return false;
    return true;
  }

  private getDefaultProfile(): ConfigProfile {
    return defaultProfileFactories[DEFAULT_PROVIDER]();
  }

  private getDefaultProfileByProvider(provider: TranslatorProvider): ConfigProfile {
    return defaultProfileFactories[provider]();
  }

  private isTranslatorProvider(value: string): value is TranslatorProvider {
    return value in defaultProfileFactories;
  }

  private async ensureConfigDir(): Promise<void> {
    const configDir = getConfigDir();
    await fs.mkdir(configDir, { recursive: true });
  }

  private async readAppConfig(): Promise<AppConfig> {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      const parsed = JSON.parse(data);
      if (ConfigStorage.isAppConfig(parsed)) {
        return parsed;
      }
      console.warn('設定ファイルの形式が不正です．規定値を使用します');
      return { ...defaultAppConfig };
    } catch {
      console.warn('設定読み込みに失敗しました．規定値を使用します');
      return { ...defaultAppConfig };
    }
  }

  private async writeAppConfig(config: AppConfig): Promise<void> {
    try {
      await this.ensureConfigDir();
      const tmpPath = `${this.filePath}.${Date.now()}.tmp`;
      const data = JSON.stringify(config, null, 2);
      await fs.writeFile(tmpPath, data, 'utf-8');
      await fs.rename(tmpPath, this.filePath);
    } catch {
      throw new Error(`設定ファイルの書き込みに失敗しました`);
    }
  }

  private async readConfig(): Promise<ConfigProfile> {
    const appConfig = await this.readAppConfig();
    const activeProfile = appConfig.profiles[appConfig.activeProfile];
    return activeProfile || this.getDefaultProfile();
  }
}
