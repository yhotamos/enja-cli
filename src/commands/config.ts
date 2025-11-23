import { ConfigKey, ConfigOptions } from '../types/index.js';
import { ConfigStorage } from '../services/config/storage.js';
import kleur from 'kleur';

/** 設定コマンドの実行 */
export async function config(key?: ConfigKey, value?: string, options?: ConfigOptions): Promise<void> {
  const storage = new ConfigStorage();

  try {
    // --reset: すべての設定をリセット
    if (options?.reset) {
      await storage.reset();
      console.log(`${kleur.green('✔')} 設定をリセットしました`);
      return;
    }

    // --unset: 指定したキーを削除（デフォルトに戻す）
    if (options?.unset) {
      await storage.unset(options.unset);
      console.log(`${kleur.green('✔')} ${options.unset} をリセットしました`);
      return;
    }

    // key と value が指定された場合: 設定を保存
    if (key && value) {
      await storage.set(key, value);
      console.log(`${kleur.green('✔')} ${key} を設定しました`);
      return;
    }

    // key のみ指定された場合: その設定値を表示
    if (key && !value) {
      const config = await storage.get();

      if (key === 'endpoint') {
        console.log(config.endpoint);
      } else if (key === 'api-key') {
        console.log(config.apiKey ? maskApiKey(config.apiKey) : '(not set)');
      } else if (key === 'provider') {
        console.log(config.provider);
      } else {
        console.error(`error: 無効な設定キー (${key})`);
        process.exit(1);
      }
      return;
    }

    // --list または引数なし: すべての設定を表示
    const config = await storage.get();
    console.log(`${kleur.blue('provider:')} ${config.provider}`);
    console.log(`${kleur.blue('endpoint:')} ${config.endpoint}`);
    console.log(`${kleur.blue('apiKey:')} ${config.apiKey ? maskApiKey(config.apiKey) : '(not set)'}`);

  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

// APIキーのマスキング表示
function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 8) {
    return '*'.repeat(apiKey.length);
  }
  const visible = 4;
  const start = apiKey.slice(0, visible);
  const end = apiKey.slice(-visible);
  const masked = '*'.repeat(apiKey.length - visible * 2);
  return `${start}${masked}${end}`;
}
