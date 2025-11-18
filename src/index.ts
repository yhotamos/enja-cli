#!/usr/bin/env node

import { readFileSync } from "fs";
import { Command } from 'commander';

const pkgJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf-8"));

const program = new Command();

program
  .name('enja')
  .usage('[arguments] [options]')
  .description(`Description: ${pkgJson.description}`)
  .version(pkgJson.version, '-v, --version', 'output the current version')
  .showHelpAfterError()
  .addHelpText('after',
  `\nExamples:
  $ enja "Hello, world!"     # 引数で渡された文字列を翻訳
  $ git --help | enja        # パイプ(標準入力)で渡されたテキストを翻訳
  $ enja -f input.txt        # ファイルからテキストを読み込んで翻訳
  $ enja -f input.txt -o output.txt  # ファイルから読み込み，翻訳結果をファイルに保存
  $ cat README.md | enja -o japanese.md  # パイプとファイル出力の組み合わせ`
  )
  .addHelpText('afterAll', `\nEnja CLI v${pkgJson.version}`)
  .addHelpText('afterAll', 'Copyright (c) 2025 yhotta240')
  .addHelpText('afterAll', 'GitHub: https://github.com/yhotamos/enja-cli');

program.parse();
