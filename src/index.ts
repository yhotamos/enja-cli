#!/usr/bin/env node

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
  .description(`Description: ${pkgJson.description}`)
  .version(pkgJson.version, '-v, --version', 'output the current version');

// 翻訳コマンド (デフォルト)
program
  .argument('[text]', 'テキストを翻訳する')
  .option('-f, --file <path>', 'ファイルを翻訳する')
  .option('-o, --output <path>', 'ファイルに出力する (デフォルト: 標準出力)')
  .option('-s, --strip-html', 'HTMLタグを除去してから翻訳する')
  .option('-N, --no-cache', 'キャッシュを使用せずに再翻訳する')
  .option('-F, --flip', '翻訳方向を逆にする (default: 英語→日本語)')
  .option('-p, --profile <name>', '使用するプロファイルを指定')
  .option('--endpoint <url>', 'カスタム翻訳エンドポイントを指定')
  .option('--api-key <key>', 'API キーを指定')
  .option('--provider <name>', '翻訳プロバイダーを指定 (gas, custom, openai, gemini)')
  .option('--model <name>', '使用するモデル名を指定 (例: gpt-4o-mini, gemini-2.5-flash-lite)')
  .showHelpAfterError()
  .addHelpText('after',
    `\nExamples:
  $ enja "Hello, world!"     # 引数で渡された文字列を翻訳
  $ git --help | enja        # パイプ(標準入力)で渡されたテキストを翻訳
  $ enja -f input.txt        # ファイルからテキストを読み込んで翻訳
  $ enja -f input.txt -o output.txt  # ファイルから読み込み，翻訳結果をファイルに保存
  $ cat README.md | enja -o japanese.md  # パイプとファイル出力の組み合わせ
  $ curl -s https://example.com | enja -s  # HTMLタグを除去して翻訳
  $ enja "Hello" -p work     # work プロファイルを使用して翻訳
  $ enja "Hello, world!" --provider openai --api-key YOUR_OPENAI_API_KEY  # OpenAI API を使用して翻訳`
  )
  .addHelpText('afterAll', `\nEnja CLI v${pkgJson.version}`)
  .addHelpText('afterAll', 'Copyright (c) 2025 yhotta240')
  .addHelpText('afterAll', 'GitHub: https://github.com/yhotamos/enja-cli')
  .action(translate);

// 履歴コマンド
program
  .command('history')
  .description('Description: 翻訳履歴を表示する')
  .argument('[id]', 'ID で履歴を表示する（完全 ID または短縮 ID）')
  .option('-d, --detail', '詳細表示')
  .option('-n, --number <number>', '表示件数', '10')
  .option('--delete <id>', '特定の履歴を削除する')
  .option('--clear', '履歴をクリア')
  .action(history);

// 設定コマンド
program
  .command('config')
  .description('Description: 設定とプロファイルを管理する')
  .argument('[profile]', 'プロファイル名またはサブコマンド (ls, use, rm, add)')
  .argument('[subcommandArg]', 'サブコマンドの引数 (プロファイル名)')
  .option('--provider <name>', 'プロファイルのプロバイダーを設定 (gas, custom, openai, gemini)')
  .option('--endpoint <url>', 'プロファイルのエンドポイントを設定')
  .option('--api-key <key>', 'プロファイルのAPIキーを設定')
  .option('--model <name>', 'プロファイルのモデルを設定')
  .option('--unset <key>', 'プロファイルの指定した設定をリセット')
  .option('--reset', 'プロファイル全体をリセット')
  .addHelpText('after',
    `
注意: --provider, --endpoint, --api-key, --model オプションは
      プロファイル名または 'add' サブコマンドと一緒に使用してください

プロファイル管理:
  $ enja config                                    現在のプロファイルを表示
  $ enja config ls                                 全プロファイルを一覧表示
  $ enja config <profile>                          プロファイルの詳細を表示
  $ enja config use <profile>                      アクティブプロファイルを変更
  $ enja config add <profile> [options]            新しいプロファイルを作成
  $ enja config rm <profile>                       プロファイルを削除

プロファイルの設定:
  $ enja config <profile> --provider <value>       プロファイルの provider を変更
  $ enja config <profile> --model <value>          プロファイルの model を変更
  $ enja config <profile> --unset <key>            設定をリセット
  $ enja config <profile> --reset                  プロファイル全体をリセット

Examples:
  $ enja config                                    現在の設定を表示
  $ enja config ls                                 プロファイル一覧
  $ enja config work                               work プロファイルを表示
  $ enja config use work                           work をアクティブに設定
  $ enja config work --provider openai             work の provider を設定
  $ enja config work --provider openai --model gpt-4o  複数設定を同時変更
  $ enja config add personal --provider gemini     personal プロファイルを作成
  $ enja "Hello" -p work                           work プロファイルで翻訳`
  )
  .action(config);

program.parse();
