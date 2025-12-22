import * as fs from 'fs';
import { ConfigProfile, TranslatorProvider, AppConfig } from '../../types/index.js';
import { ConfigManager } from './index.js';
import { getConfigFilePath, getConfigDir } from '../../utils/paths.js';

const DEFAULT_CONFIG: ConfigProfile = {
  provider: 'gas',
  endpoint: 'https://script.google.com/macros/s/AKfycbxOSbKD0aBTaQqIzHv00BMzp6WwrtWHBU3gJY0vhB2HblgUO-cgesfT1l-rrfttnWZzew/exec',
  apiKey: undefined,
  model: undefined,
};

const DEFAULT_APP_CONFIG: AppConfig = {
  version: '1.1',
  activeProfile: 'default',
  profiles: {
    default: { ...DEFAULT_CONFIG },
  },
};

/** 設定の永続化を管理するクラス */
export class ConfigStorage implements ConfigManager {
  private filePath: string;

  constructor() {
    this.filePath = getConfigFilePath();
  }

  private ensureConfigDir(): void {
    const configDir = getConfigDir();
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
  }

  private async readAppConfig(): Promise<AppConfig> {
    try {
      if (!fs.existsSync(this.filePath)) {
        return { ...DEFAULT_APP_CONFIG };
      }
      const data = fs.readFileSync(this.filePath, 'utf-8');
      const config = JSON.parse(data);

      // マイグレーション: 古い形式を検出
      if (!config.version || config.version === '1' || !config.profiles) {
        console.log('設定ファイルを新しい形式に移行しています...');
        const oldConfig: ConfigProfile = {
          provider: config.provider || DEFAULT_CONFIG.provider,
          endpoint: config.endpoint || DEFAULT_CONFIG.endpoint,
          apiKey: config.apiKey,
          model: config.model,
        };

        const newConfig: AppConfig = {
          version: '1.1',
          activeProfile: 'default',
          profiles: {
            default: oldConfig,
          },
        };

        await this.writeAppConfig(newConfig);
        return newConfig;
      }

      return config as AppConfig;
    } catch (error) {
      console.warn('設定読み込みに失敗しました．規定値を使用します');
      return { ...DEFAULT_APP_CONFIG };
    }
  }

  private async writeAppConfig(config: AppConfig): Promise<void> {
    try {
      this.ensureConfigDir();
      fs.writeFileSync(this.filePath, JSON.stringify(config, null, 2), 'utf-8');
    } catch (error) {
      throw new Error(`設定ファイルの書き込みに失敗しました`);
    }
  }

  private async readConfig(): Promise<ConfigProfile> {
    const appConfig = await this.readAppConfig();
    const activeProfile = appConfig.profiles[appConfig.activeProfile];
    if (!activeProfile) {
      return { ...DEFAULT_CONFIG };
    }
    return { ...DEFAULT_CONFIG, ...activeProfile };
  }

  private async writeConfig(config: ConfigProfile): Promise<void> {
    const appConfig = await this.readAppConfig();
    appConfig.profiles[appConfig.activeProfile] = config;
    await this.writeAppConfig(appConfig);
  }

  /** 設定を取得 */
  async get(): Promise<ConfigProfile> {
    return await this.readConfig();
  }

  /** 設定を保存 */
  async set(key: string, value: string): Promise<void> {
    const config = await this.readConfig();

    switch (key) {
      case 'endpoint':
        config.endpoint = value;
        break;
      case 'api-key':
        config.apiKey = value;
        break;
      case 'provider':
        const validProviders = ['gas', 'custom', 'openai', 'gemini'];
        if (!validProviders.includes(value)) {
          throw new Error(`無効なプロバイダー (${value}): 'gas', 'custom', 'openai', 'gemini' のいずれかを指定してください`);
        }
        config.provider = value as TranslatorProvider;
        break;
      case 'model':
        config.model = value;
        break;
      default:
        throw new Error(`無効な設定キー (${key})`);
    }

    await this.writeConfig(config);
  }

  /** 指定したキーを削除（デフォルトに戻す） */
  async unset(key: string): Promise<void> {
    const config = await this.readConfig();

    switch (key) {
      case 'endpoint':
        config.endpoint = DEFAULT_CONFIG.endpoint;
        break;
      case 'api-key':
        config.apiKey = undefined;
        break;
      case 'provider':
        config.provider = DEFAULT_CONFIG.provider;
        break;
      case 'model':
        config.model = DEFAULT_CONFIG.model;
        break;
      default:
        throw new Error(`無効な設定キー (${key})`);
    }

    await this.writeConfig(config);
  }

  /** 設定をリセット */
  async reset(): Promise<void> {
    await this.writeConfig({ ...DEFAULT_CONFIG });
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

  /** プロファイルを作成 */
  async createProfile(name: string, config?: Partial<ConfigProfile>): Promise<void> {
    // 予約語チェック
    const reservedWords = ['ls', 'list', 'use', 'rm', 'delete', 'add', 'provider', 'endpoint', 'api-key', 'model'];
    if (reservedWords.includes(name.toLowerCase())) {
      throw new Error(`プロファイル名 '${name}' は予約語のため使用できません`);
    }

    if (!name.match(/^[a-zA-Z0-9_-]+$/)) {
      throw new Error(`無効なプロファイル名 (${name}): 英数字，ハイフン，アンダースコアのみ使用できます`);
    }

    // プロバイダーのバリデーション
    if (config?.provider) {
      const validProviders: TranslatorProvider[] = ['gas', 'custom', 'openai', 'gemini'];
      if (!validProviders.includes(config.provider as TranslatorProvider)) {
        throw new Error(`無効なプロバイダー '${config.provider}': gas, custom, openai, gemini のいずれかを指定してください`);
      }
    }

    const appConfig = await this.readAppConfig();

    if (appConfig.profiles[name]) {
      throw new Error(`プロファイル '${name}' は既に存在します`);
    }

    // 新規プロファイル作成時は provider のみデフォルト設定
    appConfig.profiles[name] = {
      provider: config?.provider || 'gas',
      endpoint: config?.endpoint,
      apiKey: config?.apiKey,
      model: config?.model,
    };

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
        const validProviders = ['gas', 'custom', 'openai', 'gemini'];
        if (!validProviders.includes(value)) {
          throw new Error(`無効なプロバイダー (${value}): 'gas', 'custom', 'openai', 'gemini' のいずれかを指定してください`);
        }
        profile.provider = value as TranslatorProvider;
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

    switch (key) {
      case 'endpoint':
        profile.endpoint = DEFAULT_CONFIG.endpoint;
        break;
      case 'api-key':
        profile.apiKey = undefined;
        break;
      case 'provider':
        profile.provider = DEFAULT_CONFIG.provider;
        break;
      case 'model':
        profile.model = undefined;
        break;
      default:
        throw new Error(`無効な設定キー (${key})`);
    }

    await this.writeAppConfig(appConfig);
  }

  /** プロファイル全体をリセット */
  async resetProfile(profileName: string): Promise<void> {
    if (profileName === 'default') {
      throw new Error(`'default' プロファイルはリセットのみ可能です`);
    }

    const appConfig = await this.readAppConfig();

    if (!appConfig.profiles[profileName]) {
      throw new Error(`プロファイル '${profileName}' が見つかりません`);
    }

    appConfig.profiles[profileName] = { ...DEFAULT_CONFIG };
    await this.writeAppConfig(appConfig);
  }
}
