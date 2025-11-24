import * as fs from 'fs';
import { promises as fsp } from 'fs';
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
      const data = await fsp.readFile(this.filePath, 'utf-8');
      return JSON.parse(data) as HistoryEntry[];
    } catch (error: any) {
      // ファイルが存在しない場合は空配列を返す
      if (error && error.code === 'ENOENT') {
        return [];
      }
      // それ以外の読み取り/パースエラーは警告を出して空配列を返す
      console.warn('履歴の読み込みに失敗しました．空配列を返します');
      return [];
    }
  }

  /** 履歴ファイルに書き込む */
  private async writeHistory(entries: HistoryEntry[]): Promise<void> {
    try {
      this.ensureConfigDir();
      const tmpPath = `${this.filePath}.tmp`;
      const data = JSON.stringify(entries, null, 2);
      await fsp.writeFile(tmpPath, data, 'utf-8');
      await fsp.rename(tmpPath, this.filePath);
    } catch (error) {
      throw new Error(`履歴ファイルの書き込みに失敗しました`);
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

  /** 履歴を削除 */
  async deleteById(id: string): Promise<boolean> {
    const entries = await this.readHistory();
    const filteredEntries = entries.filter(entry => entry.id !== id);
    // 変更がなければ書き込みを行わない
    if (filteredEntries.length === entries.length) return false;
    await this.writeHistory(filteredEntries);
    return true;
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

  /**
   * 短縮IDで履歴を検索（先頭一致）  
   * 複数マッチする可能性があるため配列を返す
   */
  async findByShortId(id: string): Promise<HistoryEntry[]> {
    const entries = await this.readHistory();
    return entries.filter(entry => entry.id.startsWith(id));
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
