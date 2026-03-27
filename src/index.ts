import { readFileSync } from "fs";
import { Command } from 'commander';
import { translateCommand } from "./commands/translate.js";
import { historyCommand } from "./commands/history.js";
import { configCommand } from "./commands/config.js";

const pkgJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf-8"));

const program = new Command();

program
  .name('enja')
  .usage('[arguments] [options]')
  .description(pkgJson.description)
  .version(pkgJson.version, '-v, --version', 'output the current version')
  .addHelpText('afterAll', `\nEnja CLI v${pkgJson.version}`)
  .addHelpText('afterAll', 'Copyright (c) 2025-2026 yhotta240')
  .addHelpText('afterAll', 'GitHub: https://github.com/yhotamos/enja-cli')

// 翻訳コマンド（トップレベル引数・サブコマンド化しない）
translateCommand(program);

// 履歴コマンド
historyCommand(program);

// 設定コマンド
configCommand(program);

program.parse();
