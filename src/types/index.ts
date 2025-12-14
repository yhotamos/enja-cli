export interface TranslateOptions {
  file?: string;
  output?: string;
  stripHtml?: boolean;
  cache?: boolean;
  flip?: boolean;
  endpoint?: string;
  apiKey?: string;
  provider?: TranslatorProvider;
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
  id?: string;
  detail?: boolean;
  number?: number;
  delete?: string;
  clear?: boolean;
  replay?: string;
}

export interface ConfigProfile {
  provider: TranslatorProvider;
  endpoint: string;
  apiKey?: string;
}

export interface ConfigOptions {
  list?: boolean;
  unset?: ConfigKey;
  reset?: boolean;
}

export type ConfigKey = 'endpoint' | 'api-key' | 'provider';

export type TranslatorProvider = 'gas' | 'custom' | 'openai' | 'gemini';