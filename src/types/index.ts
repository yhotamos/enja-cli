export interface TranslateOptions {
  file?: string;
  output?: string;
  stripHtml?: boolean;
  flip?: boolean;
}

export interface HistoryEntry {
  id: string;
  timestamp: string;
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  textLength: number;
  sourceHash?: string;
  options?: {
    stripHtml?: boolean;
    file?: string;
    inputMethod?: 'arg' | 'stdin' | 'file';
    command?: string;
  };
}

export interface HistoryOptions {
  detail?: boolean;
  n?: number;
  clear?: boolean;
  replay?: string;
}