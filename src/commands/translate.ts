import * as fs from 'fs';
import { TranslateOptions } from '../types';

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
    process.exit(1);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function processTranslation(text: string, options: TranslateOptions): Promise<void> {
  // TODO: 実際の翻訳処理を実装
  const translated = `[翻訳結果] ${text}`;

  // 出力処理
  if (options.output) {
    fs.writeFileSync(options.output, translated, 'utf-8');
    console.log(`${options.output} に翻訳結果を保存しました`);
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