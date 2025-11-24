import * as fs from 'fs';
import { ConfigProfile } from '../../types/index.js';
import { ConfigManager } from './index.js';
import { getConfigFilePath, getConfigDir } from '../../utils/paths.js';

const DEFAULT_CONFIG: ConfigProfile = {
  provider: 'gas',
  endpoint: 'https://script.google.com/macros/s/AKfycbxOSbKD0aBTaQqIzHv00BMzp6WwrtWHBU3gJY0vhB2HblgUO-cgesfT1l-rrfttnWZzew/exec',
  apiKey: undefined,
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

  private async readConfig(): Promise<ConfigProfile> {
    try {
      if (!fs.existsSync(this.filePath)) {
        return { ...DEFAULT_CONFIG };
      }
      const data = fs.readFileSync(this.filePath, 'utf-8');
      const config = JSON.parse(data) as ConfigProfile;
      return { ...DEFAULT_CONFIG, ...config };
    } catch (error) {
      console.warn('設定読み込みに失敗しました．規定値を使用します');
      return { ...DEFAULT_CONFIG };
    }
  }

  private async writeConfig(config: ConfigProfile): Promise<void> {
    try {
      this.ensureConfigDir();
      fs.writeFileSync(this.filePath, JSON.stringify(config, null, 2), 'utf-8');
    } catch (error) {
      throw new Error(`設定ファイルの書き込みに失敗しました`);
    }
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
        if (value !== 'gas' && value !== 'custom') {
          throw new Error(`無効なプロバイダー (${value}): gas または custom を指定してください`);
        }
        config.provider = value;
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
      default:
        throw new Error(`無効な設定キー (${key})`);
    }

    await this.writeConfig(config);
  }

  /** 設定をリセット */
  async reset(): Promise<void> {
    await this.writeConfig({ ...DEFAULT_CONFIG });
  }
}
