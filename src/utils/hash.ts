import { createHash } from 'crypto';

/** テキストの SHA-256 ハッシュを計算して返す */
export function hashText(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}
