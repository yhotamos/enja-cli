import { HistoryOptions } from '../types/index.js';
import { HistoryStorage } from '../services/history/storage.js';
import { formatHistory } from '../services/history/formatter.js';

/** 履歴コマンドの実行 */
export async function history(options: HistoryOptions): Promise<void> {
  try {
    const storage = new HistoryStorage();

    // 履歴クリア
    if (options.clear) {
      await storage.clear();
      console.log('✓ 履歴をクリアしました');
      return;
    }

    // 履歴表示
    const limit = options.n || 10;
    const entries = await storage.getRecent(limit);

    const output = formatHistory(entries, options.detail);
    console.log(output);

  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
