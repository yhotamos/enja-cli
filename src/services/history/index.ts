import { HistoryEntry } from '../../types/index.js';

export interface HistoryManager {
  add(entry: Omit<HistoryEntry, 'id' | 'timestamp'>): Promise<void>;
  getAll(): Promise<HistoryEntry[]>;
  getRecent(limit: number): Promise<HistoryEntry[]>;
  deleteById(id: string): Promise<boolean>;
  clear(): Promise<void>;
  findById(id: string): Promise<HistoryEntry | null>;
  findByShortId(id: string): Promise<HistoryEntry[]>;
  findByHash(hash: string, sourceLang: string, targetLang: string): Promise<HistoryEntry | null>;
}
