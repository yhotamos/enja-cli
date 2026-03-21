import type { ConfigOptions } from '../types/index.js';
import { ConfigStorage } from '../services/config/storage.js';
import kleur from 'kleur';
import type { Command } from 'commander';

/** 設定コマンドの実行 */
export async function config(
  profileOrSubcommand?: string,
  _options?: ConfigOptions,
  command?: Command
): Promise<void> {
  const storage = new ConfigStorage();

  // Commander.jsでは，サブコマンドのオプションが正しく認識されていない場合，
  // 親コマンドにオプションが渡されることがある
  const commandOpts = command?.opts() || {};
  const parentOpts = command?.parent?.opts() || {};

  // サブコマンドと親コマンドのオプションをマージ (サブコマンドを優先)
  const options: ConfigOptions = { ...parentOpts, ...commandOpts };

  try {
    // ヘルプに表示したくないため，追加位置引数は `command.args` から取得する
    const argsFromCommand = command?.args ?? [];
    const argsLength = argsFromCommand.length;
    const [, subcommandArg, subcommandArg2] = argsFromCommand;

    // サブコマンド: ls - プロファイル一覧
    if (profileOrSubcommand === 'ls' || profileOrSubcommand === 'list') {
      if (argsLength > 1) {
        throw new Error('引数が多すぎます\n\n使用例:\n  enja config ls');
      }

      const profiles = await storage.listProfiles();
      const activeProfile = await storage.getActiveProfileName();

      console.log(kleur.bold('Profiles:'));
      for (const profile of profiles) {
        const isActive = profile === activeProfile;
        const config = await storage.getProfile(profile);
        const marker = isActive ? kleur.green('*') : ' ';
        const modelInfo = config.model ? ` - ${config.model}` : '';
        console.log(`  ${marker} ${profile} (${config.provider})${modelInfo}`);
      }
      return;
    }

    // サブコマンド: use - プロファイル切り替え
    if (profileOrSubcommand === 'use') {
      if (!subcommandArg) {
        throw new Error('プロファイル名を指定してください\n\n使用例:\n  enja config use <profile>');
      }
      if (argsLength > 2) {
        throw new Error('引数が多すぎます\n\n使用例:\n  enja config use <profile>');
      }
      await storage.useProfile(subcommandArg);
      console.log(`${kleur.green('✔')} アクティブプロファイルを '${subcommandArg}' に設定しました`);
      return;
    }

    // サブコマンド: rm - プロファイル削除
    if (profileOrSubcommand === 'rm' || profileOrSubcommand === 'delete') {
      if (!subcommandArg) {
        throw new Error('プロファイル名を指定してください\n\n使用例:\n  enja config rm <profile>');
      }
      if (argsLength > 2) {
        throw new Error('引数が多すぎます\n\n使用例:\n  enja config rm <profile>');
      }
      await storage.deleteProfile(subcommandArg);
      console.log(`${kleur.green('✔')} プロファイル '${subcommandArg}' を削除しました`);
      return;
    }

    // サブコマンド: add - プロファイル作成
    if (profileOrSubcommand === 'add') {
      if (!subcommandArg) {
        throw new Error('プロファイル名を指定してください\n\n使用例:\n  enja config add <profile> [options]');
      }
      if (argsLength > 2) {
        throw new Error('引数が多すぎます\n\n使用例:\n  enja config add <profile> [options]');
      }
      const profileConfig: Partial<ConfigOptions> = {};
      if (options?.provider) profileConfig.provider = options.provider;
      if (options?.endpoint) profileConfig.endpoint = options.endpoint;
      if (options?.apiKey) profileConfig.apiKey = options.apiKey;
      if (options?.model) profileConfig.model = options.model;

      await storage.createProfile(subcommandArg, profileConfig);
      console.log(`${kleur.green('✔')} プロファイル '${subcommandArg}' を作成しました`);
      return;
    }

    // サブコマンド: rename - プロファイル名変更
    if (profileOrSubcommand === 'rename') {
      if (!subcommandArg) {
        throw new Error('変更前のプロファイル名を指定してください\n\n使用例:\n  enja config rename <oldProfile> <newProfile>');
      }
      if (!subcommandArg2) {
        throw new Error('新しいプロファイル名を指定してください\n\n使用例:\n  enja config rename <oldProfile> <newProfile>');
      }
      if (argsLength > 3) {
        throw new Error('引数が多すぎます\n\n使用例:\n  enja config rename <oldProfile> <newProfile>');
      }
      await storage.renameProfile(subcommandArg, subcommandArg2);
      console.log(`${kleur.green('✔')} プロファイル '${subcommandArg}' を '${subcommandArg2}' に変更しました`);
      return;
    }

    // 引数なし: 現在のプロファイルを表示
    if (!profileOrSubcommand) {
      // プロファイル名なしでオプションが指定された場合はエラー
      if (options?.provider || options?.endpoint || options?.apiKey || options?.model || options?.reset || options?.unset) {
        throw new Error(
          'プロファイル名を指定してください\n\n' +
          '使用例:\n' +
          '  enja config work --provider openai           プロファイルの設定を変更\n' +
          '  enja config add personal --provider gemini   プロファイルを作成'
        );
      }

      const activeProfile = await storage.getActiveProfileName();
      const config = await storage.get();
      console.log(`${kleur.bold('Active Profile:')} ${activeProfile}`);
      console.log(`${kleur.blue('provider:')} ${config.provider}`);
      console.log(`${kleur.blue('endpoint:')} ${config.endpoint || '(not set)'}`);
      console.log(`${kleur.blue('apiKey:')} ${config.apiKey ? maskApiKey(config.apiKey) : '(not set)'}`);
      console.log(`${kleur.blue('model:')} ${config.model || '(not set)'}`);
      return;
    }

    // プロファイル + オプション: プロファイルの設定を変更 (プロファイル表示より先に判定)
    if (profileOrSubcommand && !subcommandArg && (options?.provider || options?.endpoint || options?.apiKey || options?.model)) {
      let updated = false;

      if (options.provider) {
        await storage.setProfileConfig(profileOrSubcommand, 'provider', options.provider);
        updated = true;
      }
      if (options.endpoint) {
        await storage.setProfileConfig(profileOrSubcommand, 'endpoint', options.endpoint);
        updated = true;
      }
      if (options.apiKey) {
        await storage.setProfileConfig(profileOrSubcommand, 'api-key', options.apiKey);
        updated = true;
      }
      if (options.model) {
        await storage.setProfileConfig(profileOrSubcommand, 'model', options.model);
        updated = true;
      }

      if (updated) {
        console.log(`${kleur.green('✔')} プロファイル '${profileOrSubcommand}' の設定を更新しました`);
      }
      return;
    }

    // プロファイル名のみ: そのプロファイルを表示 (オプションが指定されていない場合のみ)
    if (profileOrSubcommand && !subcommandArg &&
      !options?.reset && !options?.unset &&
      !options?.provider && !options?.endpoint && !options?.apiKey && !options?.model) {
      const config = await storage.getProfile(profileOrSubcommand);
      console.log(`${kleur.bold('Profile:')} ${profileOrSubcommand}`);
      console.log(`${kleur.blue('provider:')} ${config.provider}`);
      console.log(`${kleur.blue('endpoint:')} ${config.endpoint || '(not set)'}`);
      console.log(`${kleur.blue('apiKey:')} ${config.apiKey ? maskApiKey(config.apiKey) : '(not set)'}`);
      console.log(`${kleur.blue('model:')} ${config.model || '(not set)'}`);
      return;
    }

    // プロファイル + --reset: プロファイルをリセット
    if (profileOrSubcommand && options?.reset) {
      await storage.resetProfile(profileOrSubcommand);
      console.log(`${kleur.green('✔')} プロファイル '${profileOrSubcommand}' をリセットしました`);
      return;
    }

    // プロファイル + --unset <key>: プロファイルの設定をリセット
    if (profileOrSubcommand && options?.unset) {
      await storage.unsetProfileConfig(profileOrSubcommand, options.unset);
      console.log(`${kleur.green('✔')} プロファイル '${profileOrSubcommand}' の ${options.unset} をリセットしました`);
      return;
    }

    // 不正な引数
    throw new Error(
      '無効なコマンド形式です．\n\n' +
      '使用例:\n' +
      '  enja config                                  現在の設定を表示\n' +
      '  enja config ls                               プロファイル一覧\n' +
      '  enja config work                             プロファイル表示\n' +
      '  enja config use work                         プロファイル切り替え\n' +
      '  enja config work --provider openai           設定変更\n' +
      '  enja config add personal --provider gemini   プロファイル作成\n' +
      '  enja config rename oldProfile newProfile     プロファイル名変更\n'
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error(`error: ${error.message}`);
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
