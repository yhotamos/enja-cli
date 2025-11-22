#!/usr/bin/env node

import { readFileSync } from "fs";
import { Command } from 'commander';
import { translate } from "./commands/translate.js";
import { history } from "./commands/history.js";

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
  .option('-F, --flip', '翻訳方向を逆にする (デフォルト: 英語→日本語)')
  .option('--endpoint <url>', 'カスタム翻訳エンドポイントを指定')
  .option('--api-key <key>', 'API キーを指定')
  .option('--provider <name>', '翻訳プロバイダーを指定 (gas, custom)')
  .showHelpAfterError()
  .addHelpText('after',
    `\nExamples:
  $ enja "Hello, world!"     # 引数で渡された文字列を翻訳
  $ git --help | enja        # パイプ(標準入力)で渡されたテキストを翻訳
  $ enja -f input.txt        # ファイルからテキストを読み込んで翻訳
  $ enja -f input.txt -o output.txt  # ファイルから読み込み，翻訳結果をファイルに保存
  $ cat README.md | enja -o japanese.md  # パイプとファイル出力の組み合わせ
  $ curl -s https://example.com | enja -s  # HTMLタグを除去して翻訳
  $ enja "Hello" --endpoint https://api.example.com/translate --api-key YOUR_KEY  # カスタムエンドポイント`
  )
  .addHelpText('afterAll', `\nEnja CLI v${pkgJson.version}`)
  .addHelpText('afterAll', 'Copyright (c) 2025 yhotta240')
  .addHelpText('afterAll', 'GitHub: https://github.com/yhotamos/enja-cli')
  .action(translate);

// 履歴コマンド
program
  .command('history')
  .description('翻訳履歴を表示する')
  .option('-d, --detail', '詳細表示')
  .option('-n <number>', '表示件数 (デフォルト: 10)', '10')
  .option('--clear', '履歴をクリア')
  .action(history);

program.parse();
