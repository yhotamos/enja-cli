import * as fs from 'fs';
import { randomUUID } from 'crypto';
import { HistoryEntry } from '../../types/index.js';
import { HistoryManager } from './index.js';
import { getHistoryFilePath, getConfigDir } from '../../utils/paths.js';

const MAX_HISTORY_ENTRIES = 100;

/** 履歴管理のためのストレージクラス */
export class HistoryStorage implements HistoryManager {
  private filePath: string;

  constructor() {
    this.filePath = getHistoryFilePath();
  }

  /** 設定ディレクトリが存在しない場合は作成 */
  private ensureConfigDir(): void {
    const configDir = getConfigDir();
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
  }

  /** 履歴ファイルを読み込む */
  private async readHistory(): Promise<HistoryEntry[]> {
    try {
      if (!fs.existsSync(this.filePath)) {
        return [];
      }
      const data = fs.readFileSync(this.filePath, 'utf-8');
      return JSON.parse(data) as HistoryEntry[];
    } catch (error) {
      return [];
    }
  }

  /** 履歴ファイルに書き込む */
  private async writeHistory(entries: HistoryEntry[]): Promise<void> {
    try {
      this.ensureConfigDir();
      fs.writeFileSync(this.filePath, JSON.stringify(entries, null, 2), 'utf-8');
    } catch (error) {
      throw new Error(`error: 履歴ファイルの書き込みに失敗しました`);
    }
  }

  /** 履歴にエントリを追加 */
  async add(entry: Omit<HistoryEntry, 'id' | 'timestamp'>): Promise<void> {
    const entries = await this.readHistory();

    const newEntry: HistoryEntry = {
      ...entry,
      id: randomUUID(),
      timestamp: new Date().toISOString(),
    };

    entries.unshift(newEntry);

    // 最大エントリ数を超えた場合は古いエントリを削除
    if (entries.length > MAX_HISTORY_ENTRIES) {
      entries.splice(MAX_HISTORY_ENTRIES);
    }

    await this.writeHistory(entries);
  }

  /** すべての履歴を取得 */
  async getAll(): Promise<HistoryEntry[]> {
    return await this.readHistory();
  }

  /** 最近の履歴を取得 */
  async getRecent(limit: number): Promise<HistoryEntry[]> {
    const entries = await this.readHistory();
    return entries.slice(0, limit);
  }

  /** 履歴をクリア */
  async clear(): Promise<void> {
    await this.writeHistory([]);
  }

  /** IDで履歴を検索 */
  async findById(id: string): Promise<HistoryEntry | null> {
    const entries = await this.readHistory();
    return entries.find(entry => entry.id === id) || null;
  }

  /** ハッシュと翻訳方向で履歴を検索 */
  async findByHash(hash: string, sourceLang: string, targetLang: string): Promise<HistoryEntry | null> {
    const entries = await this.readHistory();
    return entries.find(entry =>
      entry.sourceHash === hash &&
      entry.sourceLang === sourceLang &&
      entry.targetLang === targetLang
    ) || null;
  }
}
