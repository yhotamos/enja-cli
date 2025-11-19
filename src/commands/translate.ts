import * as fs from 'fs';
import { TranslateOptions } from '../types/index.js';
import { createTranslator } from '../services/translator/factory.js';

export async function translate(text: string | undefined, options: TranslateOptions): Promise<void> {
  try {
    // 標準入力からの読み込み処理
    if (!text && !options.file && !process.stdin.isTTY) {
      const stdin = await readStdin();
      await processTranslation(stdin, options);
      return;
    }

    // ファイルからの読み込み処理
    if (options.file) {
      if (!fs.existsSync(options.file)) {
        throw new Error(`File Not Found Error: ${options.file} が見つかりません`);
      }
      const fileContent = fs.readFileSync(options.file, 'utf-8');
      await processTranslation(fileContent, options);
      return;
    }

    // 引数で渡されたテキストの処理
    if (text) {
      await processTranslation(text, options);
      return;
    }

    console.error('Error: 入力が提供されていません');
    console.error('Usage: enja <テキスト> または enja -f <ファイル> または パイプ入力');
    process.exit(1);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function processTranslation(text: string, options: TranslateOptions): Promise<void> {
  if (!text || text.trim().length === 0) {
    throw new Error('Translation Error: 翻訳するテキストが空です');
  }

  // HTMLタグ除去
  let processedText = text;
  if (options.stripHtml) {
    processedText = stripHtmlTags(text);
    if (!processedText || processedText.trim().length === 0) {
      throw new Error('Translation Error: HTMLタグを除去した結果，翻訳するテキストが空になりました');
    }
  }

  // 翻訳サービスの初期化
  const translator = createTranslator();

  // 翻訳処理
  const result = await translator.translate(processedText, 'en', 'ja');
  const translated = result.text;

  // 出力処理
  if (options.output) {
    try {
      fs.writeFileSync(options.output, translated, 'utf-8');
      console.log(`✓ ${options.output} に翻訳結果を保存しました`);
    } catch (error) {
      throw new Error(`File Write Error: ${options.output} への書き込みに失敗しました - ${error instanceof Error ? error.message : error}`);
    }
  } else {
    console.log(translated);
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