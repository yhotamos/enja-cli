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
  .description('Description: 設定を管理する')
  .argument('[key]', '設定キー (endpoint, api-key, provider, model)')
  .argument('[value]', '設定値')
  .option('-l, --list', '設定を一覧表示')
  .option('--unset <key>', '設定を削除（デフォルトに戻す）')
  .option('--reset', 'すべての設定をリセット')
  .addHelpText('after',
    `\nValues for provider: gas, custom, openai, gemini
    \nExamples:
  $ enja config                           # すべての設定を表示
  $ enja config --list                    # すべての設定を表示
  $ enja config endpoint                  # endpoint の値を表示
  $ enja config endpoint <URL>            # endpoint を設定
  $ enja config api-key <KEY>             # API キーを設定
  $ enja config provider gas              # プロバイダーを設定
  $ enja config --unset api-key           # API キーを削除
  $ enja config --reset                   # すべての設定をリセット`
  )
  .action(config);

program.parse();
