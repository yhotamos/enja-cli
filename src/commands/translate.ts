import * as fs from 'node:fs';
import { createInterface, type Key } from 'node:readline';
import type { Command } from 'commander';
import kleur from 'kleur';
import ora from 'ora';
import { resolveConfig } from '../config/index.js';
import { HistoryStorage } from '../services/history/storage.js';
import { createTranslator } from '../services/translator/factory.js';
import { assertStyleSupported, assertTranslatorStyle } from '../services/translator/prompt.js';
import type { TranslateOptions } from '../types/index.js';
import { hashText } from '../utils/hash.js';

/** トップレベル引数として翻訳を登録（サブコマンド化しない） */
export function translateCommand(program: Command): void {
  program
    .argument('[text]', '翻訳するテキスト（省略した場合はファイルまたは標準入力から読み込む）')
    .option('-f, --file <path>', 'ファイルを翻訳する')
    .option('-o, --output <path>', 'ファイルに出力する (デフォルト: 標準出力)')
    .option('-s, --strip-html', 'HTMLタグを除去してから翻訳する')
    .option('-N, --no-cache', 'キャッシュを使用せずに再翻訳する')
    .option('--style <style>', '翻訳のスタイルを指定（formal, casual, technical, academic, business）')
    .option('-F, --flip', '翻訳方向を逆にする (default: 英語→日本語)')
    .option('-p, --profile <name>', '使用するプロファイルを指定')
    .option('--endpoint <url>', '一時的にカスタム翻訳エンドポイントを指定（現在のプロファイルに適用）')
    .option('--api-key <key>', '一時的に API キーを指定（現在のプロファイルに適用）')
    .option('--provider <name>', '一時的に翻訳プロバイダーを指定（現在のプロファイルに適用）')
    .option('--model <name>', '一時的に使用するモデル名を指定（現在のプロファイルに適用）')
    .option('--allow-local-endpoint', 'localhost（127.0.0.1）のエンドポイントを許可する')
    .option('--allow-private-endpoint', 'プライベートネットワーク（例: 192.168.x.x）のエンドポイントを許可する')
    .option('--allow-http', 'HTTP（非 TLS）のエンドポイントを許可する')
    .addHelpText(
      'after',
      `\nExamples:
    $ enja "Hello, world!"     # 文字列を翻訳
    $ docker --help | enja     # 標準入力を翻訳
    $ enja -f input.txt -o output.txt  # ファイル入出力
    $ enja "Hello" -p work     # プロファイルを指定して翻訳
    $ enja "Hello" --provider openai --api-key YOUR_API_KEY  # 一時的にプロバイダーを指定して翻訳`,
    )
    .action(translate);
}

export async function translate(text: string | undefined, options: TranslateOptions): Promise<void> {
  try {
    // 標準入力からの読み込み処理
    if (text === undefined && !options.file) {
      const stdin = process.stdin.isTTY ? await readInteractiveStdin() : await readStdin();
      await processTranslation(stdin, options, 'stdin');
      return;
    }

    // ファイルからの読み込み処理
    if (options.file) {
      if (!fs.existsSync(options.file)) {
        throw new Error(`ファイルが見つかりません (${options.file})`);
      }
      const fileContent = fs.readFileSync(options.file, 'utf-8');
      await processTranslation(fileContent, options, 'file');
      return;
    }

    // 引数で渡されたテキストの処理
    if (text !== undefined) {
      await processTranslation(text, options, 'arg');
      return;
    }
  } catch (error) {
    console.error(`error: ${formatErrorMessage(error)}`);
    process.exit(1);
  }
}

async function processTranslation(text: string, options: TranslateOptions, inputMethod: 'arg' | 'stdin' | 'file'): Promise<void> {
  if (!text || text.trim().length === 0) {
    throw new Error('翻訳するテキストが空です');
  }

  // HTMLタグ除去
  let processedText = text;
  if (options.stripHtml) {
    processedText = stripHtmlTags(text);
    if (!processedText || processedText.trim().length === 0) {
      throw new Error('HTMLタグを除去した結果，翻訳するテキストが空になりました');
    }
  }

  const historyStorage = new HistoryStorage();
  assertTranslatorStyle(options.style);

  const styledConfig = options.style ? await resolveConfig(options) : undefined;
  if (styledConfig) assertStyleSupported(styledConfig.config.provider, options.style);

  // 翻訳処理
  const sourceLang = options.flip ? 'ja' : 'en';
  const targetLang = options.flip ? 'en' : 'ja';

  // キャッシュチェック
  const cacheSource = styledConfig
    ? JSON.stringify({
        text: processedText,
        style: options.style,
        profile: styledConfig.profileName,
        provider: styledConfig.config.provider,
        model: styledConfig.config.model,
        endpoint: styledConfig.config.endpoint,
      })
    : processedText;
  const textHash = hashText(cacheSource);
  const cachedEntry = await historyStorage.findByHash(textHash, sourceLang, targetLang);

  if (cachedEntry && options.cache !== false) {
    console.log(`${kleur.green('✔')} キャッシュから翻訳結果を取得しました`);
    const translated = cachedEntry.translatedText;

    // 出力処理
    if (options.output) {
      try {
        fs.writeFileSync(options.output, translated, 'utf-8');
        console.log(`${kleur.green('✔')} ${options.output} に翻訳結果を保存しました`);
      } catch {
        throw new Error(`ファイルへの書き込みに失敗しました (${options.output})`);
      }
    } else {
      console.log(translated);
    }
    return;
  }

  // キャッシュにない場合のみ翻訳サービスを初期化
  const { translator, profileName, provider } = await createTranslator(options);
  const dir = `(${sourceLang} → ${targetLang})`;
  const model = translator.getModel();
  const profileInfo = `[${profileName} | ${provider}${model ? ` | ${model}` : ''}]`;

  const spinner = ora(`翻訳中... ${dir} ${profileInfo}`).start();
  try {
    const result = await translator.translate(processedText, sourceLang, targetLang, options.style);
    const translated = result.text;
    spinner.succeed(`翻訳完了 ${dir} ${profileInfo}`);
    // 履歴に保存
    await historyStorage.add({
      sourceText: processedText,
      translatedText: translated,
      sourceLang,
      targetLang,
      textLength: processedText.length,
      sourceHash: textHash,
      profile: profileName,
      provider,
      model: model ?? undefined,
      options: {
        stripHtml: options.stripHtml,
        style: options.style,
        file: options.file,
        inputMethod,
      },
    });

    // 出力処理
    if (options.output) {
      try {
        fs.writeFileSync(options.output, translated, 'utf-8');
        console.log(`${kleur.green('✔')} ${options.output} に翻訳結果を保存しました`);
      } catch {
        throw new Error(`ファイルへの書き込みに失敗しました (${options.output})`);
      }
    } else {
      console.log(translated);
    }
  } catch (error) {
    spinner.fail(`翻訳失敗 ${dir} ${profileInfo}`);
    throw error;
  }
}

function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  try {
    return String(error);
  } catch {
    return 'Unknown error';
  }
}

function readInteractiveStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    const lines: string[] = [];
    let cancelled = false;
    const readline = createInterface({
      input: process.stdin,
      output: process.stderr,
      terminal: true,
      prompt: '› ',
    });

    console.error(`${kleur.cyan('翻訳するテキスト')} ${kleur.dim('（Ctrl+D で翻訳）')}`);
    readline.prompt();

    const handleKeypress = (_character: string | undefined, key: Key) => {
      if (!key.ctrl || key.name !== 'd') return;
      if (readline.line.length > 0) lines.push(readline.line);
      process.stderr.write('\n');
      readline.close();
    };
    process.stdin.prependListener('keypress', handleKeypress);

    readline.on('line', (line) => {
      lines.push(line);
      readline.prompt();
    });

    readline.on('SIGINT', () => {
      cancelled = true;
      process.stderr.write('\n');
      readline.close();
    });

    readline.on('close', () => {
      process.stdin.removeListener('keypress', handleKeypress);
      if (cancelled) {
        reject(new Error('入力をキャンセルしました'));
        return;
      }
      resolve(lines.join('\n'));
    });
  });
}

function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf-8');

    process.stdin.on('data', (chunk) => {
      data += chunk;
    });

    process.stdin.on('end', () => {
      resolve(data);
    });

    process.stdin.on('error', (error) => {
      reject(error);
    });
  });
}

function stripHtmlTags(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n\s*\n/g, '\n')
    .trim();
}
