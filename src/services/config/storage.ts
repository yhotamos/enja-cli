import * as fs from 'fs';
import type { ConfigProfile, TranslatorProvider, AppConfig } from '../../types/index.js';
import type { ConfigManager } from './index.js';
import { getConfigFilePath, getConfigDir } from '../../utils/paths.js';
import { LMStudioTranslator } from '../translator/lmstudio.js';
import { GASTranslator } from '../translator/gas.js';
import { OpenAITranslator } from '../translator/openai.js';
import { GeminiTranslator } from '../translator/gemini.js';

// プロバイダごとのデフォルト設定
const DEFAULT_PROFILES_BY_PROVIDER: Record<TranslatorProvider, Partial<ConfigProfile>> = {
  gas: {
    provider: 'gas',
    endpoint: GASTranslator.DEFAULT_ENDPOINT,
  },
  openai: {
    provider: 'openai',
    model: OpenAITranslator.DEFAULT_MODEL,
  },
  gemini: {
    provider: 'gemini',
    model: GeminiTranslator.DEFAULT_MODEL,
  },
  lmstudio: {
    provider: 'lmstudio',
    endpoint: LMStudioTranslator.DEFAULT_ENDPOINT,
  },
  custom: {
    provider: 'custom',
  },
};

const DEFAULT_APP_CONFIG: AppConfig = {
  version: '1.1',
  activeProfile: 'default',
  profiles: {
    default: { ...DEFAULT_PROFILES_BY_PROVIDER['gas'] as ConfigProfile },
  },
};

const VALID_PROVIDERS: TranslatorProvider[] = ['gas', 'custom', 'openai', 'gemini', 'lmstudio'];

const RESERVED_WORDS = ['ls', 'list', 'use', 'rm', 'delete', 'add', 'rename', 'copy', 'provider', 'endpoint', 'api-key', 'model', 'default'];

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

      return config as AppConfig;
    } catch {
      console.warn('設定読み込みに失敗しました．規定値を使用します');
      return { ...DEFAULT_APP_CONFIG };
    }
  }

  private async writeAppConfig(config: AppConfig): Promise<void> {
    try {
      this.ensureConfigDir();
      fs.writeFileSync(this.filePath, JSON.stringify(config, null, 2), 'utf-8');
    } catch {
      throw new Error(`設定ファイルの書き込みに失敗しました`);
    }
  }

  private async readConfig(): Promise<ConfigProfile> {
    const appConfig = await this.readAppConfig();
    const activeProfile = appConfig.profiles[appConfig.activeProfile];
    return activeProfile || { ...DEFAULT_PROFILES_BY_PROVIDER['gas'] as ConfigProfile };
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

    validateProfileName(name);

    // プロバイダーのバリデーション
    if (config?.provider) {
      if (!VALID_PROVIDERS.includes(config.provider as TranslatorProvider)) {
        throw new Error(`無効なプロバイダー '${config.provider}': ${VALID_PROVIDERS.join(', ')} のいずれかを指定してください`);
      }
    }

    const appConfig = await this.readAppConfig();

    if (appConfig.profiles[name]) {
      throw new Error(`プロファイル '${name}' は既に存在します`);
    }

    // プロバイダに応じたデフォルト設定を取得
    const provider = config?.provider || 'gas';
    const defaultProfile = DEFAULT_PROFILES_BY_PROVIDER[provider] as ConfigProfile;

    // 指定された設定で上書き
    const newProfile: ConfigProfile = {
      ...defaultProfile,
      ...config,
    };
    appConfig.profiles[name] = newProfile;

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
        if (!VALID_PROVIDERS.includes(value as TranslatorProvider)) {
          throw new Error(`無効なプロバイダー (${value}): ${VALID_PROVIDERS.join(', ')} のいずれかを指定してください`);
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
    const provider = profile.provider || 'gas';
    const defaultProfile = DEFAULT_PROFILES_BY_PROVIDER[provider] as ConfigProfile;

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
  async resetProfile(profileName: string): Promise<void> {
    const appConfig = await this.readAppConfig();

    if (!appConfig.profiles[profileName]) {
      throw new Error(`プロファイル '${profileName}' が見つかりません`);
    }
    const defaultProfile = DEFAULT_PROFILES_BY_PROVIDER['gas'] as ConfigProfile;

    appConfig.profiles[profileName] = { ...defaultProfile };
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
}

/**
 * プロファイル名のバリデーション
 * @param name プロファイル名
 * @throws 無効なプロファイル名の場合にエラーをスロー
 */
function validateProfileName(name: string): void {
  if (RESERVED_WORDS.includes(name.toLowerCase())) {
    throw new Error(`プロファイル名 '${name}' は予約語のため使用できません`);
  }
  if (!name.match(/^[a-zA-Z0-9_-]+$/)) {
    throw new Error(`無効なプロファイル名 (${name}): 英数字，ハイフン，アンダースコアのみ使用できます`);
  }
}
