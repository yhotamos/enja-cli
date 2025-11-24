import * as fs from 'fs';
import ora from 'ora';
import { TranslateOptions } from '../types/index.js';
import { createTranslator } from '../services/translator/factory.js';
import { HistoryStorage } from '../services/history/storage.js';
import { hashText } from '../utils/hash.js';
import kleur from 'kleur';

export async function translate(text: string | undefined, options: TranslateOptions): Promise<void> {
  try {
    // 標準入力からの読み込み処理
    if (!text && !options.file && !process.stdin.isTTY) {
      const stdin = await readStdin();
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
    if (text) {
      await processTranslation(text, options, 'arg');
      return;
    }

    console.error('error: 入力が提供されていません');
    console.error('使い方: enja <テキスト> または enja -f <ファイル> または パイプ入力');
    process.exit(1);
  } catch (error) {
    console.error(error instanceof Error ? `error: ${error.message}` : error);
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

  // 翻訳サービスの初期化
  const translator = await createTranslator(options);
  const historyStorage = new HistoryStorage();

  // 翻訳処理
  const sourceLang = options.flip ? 'ja' : 'en';
  const targetLang = options.flip ? 'en' : 'ja';

  // キャッシュチェック
  const textHash = hashText(processedText);
  const cachedEntry = await historyStorage.findByHash(textHash, sourceLang, targetLang);

  if (cachedEntry && options.cache !== false) {
    console.log(`${kleur.green('✔')} キャッシュから翻訳結果を取得しました`);
    const translated = cachedEntry.translatedText;

    // 出力処理
    if (options.output) {
      try {
        fs.writeFileSync(options.output, translated, 'utf-8');
        console.log(`${kleur.green('✔')} ${options.output} に翻訳結果を保存しました`);
      } catch (error) {
        throw new Error(`ファイルへの書き込みに失敗しました (${options.output})`);
      }
    } else {
      console.log(translated);
    }
    return;
  }

  const dir = `(${sourceLang} → ${targetLang})`;
  const spinner = ora(`翻訳中... ${dir}`).start();
  try {
    const result = await translator.translate(processedText, sourceLang, targetLang);
    const translated = result.text;
    spinner.succeed(`翻訳完了 ${dir}`);

    // 履歴に保存
    await historyStorage.add({
      sourceText: processedText,
      translatedText: translated,
      sourceLang,
      targetLang,
      textLength: processedText.length,
      sourceHash: textHash,
      options: {
        stripHtml: options.stripHtml,
        file: options.file,
        inputMethod,
      },
    });

    // 出力処理
    if (options.output) {
      try {
        fs.writeFileSync(options.output, translated, 'utf-8');
        console.log(`${kleur.green('✔')} ${options.output} に翻訳結果を保存しました`);
      } catch (error) {
        throw new Error(`ファイルへの書き込みに失敗しました (${options.output})`);
      }
    } else {
      console.log(translated);
    }
  } catch (error) {
    spinner.fail(`翻訳失敗 ${dir}`);
    throw error;
  }
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
