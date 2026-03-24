import { readFileSync } from "fs";
import { Command } from 'commander';
import { translate } from "./commands/translate.js";
import { history } from "./commands/history.js";
import { config } from "./commands/config.js";

const pkgJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf-8"));

const program = new Command();

program
  .name('enja')
  .usage('[arguments] [options]')
  .description(pkgJson.description)
  .version(pkgJson.version, '-v, --version', 'output the current version');

// 翻訳コマンド
program
  .argument('[text]', '翻訳するテキスト（省略した場合はファイルまたは標準入力から読み込む）')
  .option('-f, --file <path>', 'ファイルを翻訳する')
  .option('-o, --output <path>', 'ファイルに出力する (デフォルト: 標準出力)')
  .option('-s, --strip-html', 'HTMLタグを除去してから翻訳する')
  .option('-N, --no-cache', 'キャッシュを使用せずに再翻訳する')
  .option('-F, --flip', '翻訳方向を逆にする (default: 英語→日本語)')
  .option('-p, --profile <name>', '使用するプロファイルを指定')
  .option('--endpoint <url>', '一時的にカスタム翻訳エンドポイントを指定（現在のプロファイルに適用）')
  .option('--api-key <key>', '一時的に API キーを指定（現在のプロファイルに適用）')
  .option('--provider <name>', '一時的に翻訳プロバイダーを指定 (例: gas, openai, gemini, lmstudio; 現在のプロファイルに適用)')
  .option('--model <name>', '一時的に使用するモデル名を指定 (例: gpt-4o-mini, gemini-2.5-flash-lite; 現在のプロファイルに適用)')
  .option('--allow-local-endpoint', 'localhost（127.0.0.1）のエンドポイントを許可する')
  .option('--allow-private-endpoint', 'プライベートネットワーク（例: 192.168.x.x）のエンドポイントを許可する')
  .option('--allow-http', 'HTTP（非 TLS）のエンドポイントを許可する')
  .addHelpText('after',
    `\nExamples:
    $ enja "Hello, world!"     # 文字列を翻訳
    $ docker --help | enja     # 標準入力を翻訳
    $ enja -f input.txt -o output.txt  # ファイル入出力
    $ enja "Hello" -p work     # プロファイルを指定して翻訳
    $ enja "Hello" --provider openai --api-key YOUR_API_KEY  # 一時的にプロバイダーを指定して翻訳`
  )
  .addHelpText('afterAll', `\nEnja CLI v${pkgJson.version}`)
  .addHelpText('afterAll', 'Copyright (c) 2025-2026 yhotta240')
  .addHelpText('afterAll', 'GitHub: https://github.com/yhotamos/enja-cli')
  .action(translate);

// 履歴コマンド
program
  .command('history')
  .description('翻訳履歴を表示する')
  .argument('[id]', 'ID で履歴を表示する（完全 ID または短縮 ID）')
  .option('-d, --detail', '詳細表示')
  .option('-n, --number <number>', '表示件数', '10')
  .option('--delete <id>', '特定の履歴を削除する')
  .option('--clear', '履歴をクリア')
  .action(history);

// 設定コマンド
program
  .command('config')
  .usage('[profile|subcommand] [options]')
  .description('設定とプロファイルを管理する')
  .allowExcessArguments(true)
  .argument('[profile|subcommand]', `プロファイル名またはサブコマンド

Profiles:
  <profile>           指定したプロファイルの詳細を表示
  <profile> [options] 指定したプロファイルの設定を変更

Subcommands:
  list, ls                全プロファイルを一覧表示
  use <profile>           アクティブプロファイルを変更
  add <profile> [options] 新しいプロファイルを作成
  rename <old> <new>      プロファイル名を変更
  copy <source> <target>  プロファイルをコピー
  delete, rm <profile>    プロファイルを削除
  `)
  .option('--provider <name>', 'プロファイルのプロバイダーを設定 (例: gas, openai, gemini, lmstudio)')
  .option('--endpoint <url>', 'プロファイルのエンドポイントを設定')
  .option('--api-key <api-key>', 'プロファイルの API キーを設定')
  .option('--model <name>', 'プロファイルのモデルを設定')
  .option('--unset <key>', 'プロファイルの指定した設定をリセット')
  .option('--reset', 'プロファイル全体をリセット')
  .addHelpText('after', `
  --provider Names:
    gas, custom, openai, gemini, lmstudio

  --unset Keys:
    provider, endpoint, api-key, model

  注意: --provider, --endpoint, --api-key, --model オプションは
      プロファイル名または 'add' サブコマンドと一緒に使用してください
      --unset, --reset はプロファイル名と一緒に使用してください

Examples:
  $ enja config                                 現在の設定を表示
  $ enja config ls                              プロファイル一覧
  $ enja config work                            work プロファイルを表示
  $ enja config use work                        work をアクティブに設定
  $ enja config work --provider openai          work の provider を設定
  $ enja config add personal --provider gemini  personal プロファイルを作成
  $ enja config copy personal work              personal プロファイルを work にコピー
  $ enja "Hello" -p work                        work プロファイルで翻訳`
  )
  .action(config);

program.parse();
