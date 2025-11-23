import { HistoryOptions } from '../types/index.js';
import { HistoryStorage } from '../services/history/storage.js';
import { formatHistory } from '../services/history/formatter.js';

/** 履歴コマンドの実行 */
export async function history(id: string, options: HistoryOptions): Promise<void> {
  try {
    const storage = new HistoryStorage();

    // 特定IDの履歴表示
    if (id) {
      const trimmed = id.trim();
      if (!trimmed) {
        throw new Error(`空のIDが指定されました`);
      }

      // 完全IDらしければ完全一致で検索
      if (trimmed.length >= 36) {
        const entry = await storage.findById(trimmed);
        if (!entry) {
          throw new Error(`指定されたIDの履歴が見つかりません (${id})`);
        }
        console.log(formatHistory([entry], options.detail));
        return;
      }

      // 短縮IDは最低 8 文字を要求
      if (trimmed.length < 8) {
        throw new Error(`短縮IDは少なくとも8文字を指定してください (${trimmed.length})`);
      }

      // 短縮IDで先頭一致検索
      const matches = await storage.findByShortId(trimmed);
      if (matches.length === 0) {
        throw new Error(`指定されたIDの履歴が見つかりません (${id})`);
      }

      // 複数マッチしても表示する
      const output = formatHistory(matches, options.detail);
      console.log(output);
      return;
    }

    // 履歴削除
    if (options.delete) {
      const delId = options.delete.trim();
      if (!delId) {
        throw new Error(`空のIDが指定されました`);
      }

      // 完全IDらしければ直接削除を試みる
      if (delId.length >= 36) {
        const deleted = await storage.deleteById(delId);
        if (deleted) {
          console.log(`✓ 履歴ID ${delId} を削除しました`);
        } else {
          throw new Error(`指定されたIDの履歴が見つかりません (${delId})`);
        }
        return;
      }

      // 短縮IDは最低 8 文字を要求
      if (delId.length < 8) {
        throw new Error(`短縮IDで削除する場合は少なくとも8文字を指定してください (${delId.length})`);
      }

      // 短縮IDで先頭一致検索（複数ヒットする可能性あり）
      const matches = await storage.findByShortId(delId);
      if (matches.length === 0) {
        throw new Error(`指定されたIDの履歴が見つかりません (${delId})`);
      }

      if (matches.length > 1) {
        console.error('error: 指定された短縮IDは複数の履歴に一致しました．完全なIDを指定してください．');
        const output = formatHistory(matches, false);
        console.error(output);
        process.exit(1);
      }

      // 単一マッチなら削除
      const targetId = matches[0].id;
      const deleted = await storage.deleteById(targetId);
      if (deleted) {
        console.log(`✓ 履歴ID ${targetId} を削除しました`);
      } else {
        throw new Error(`削除に失敗しました (${targetId})`);
      }
      return;
    }

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
    console.error(error instanceof Error ? `error: ${error.message}` : error);
    process.exit(1);
  }
}
