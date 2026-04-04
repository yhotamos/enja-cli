export interface TranslateOptions {
  file?: string;
  output?: string;
  stripHtml?: boolean;
  cache?: boolean;
  flip?: boolean;
  endpoint?: string;
  apiKey?: string;
  provider?: TranslatorProvider;
  model?: string;
  profile?: string;
  allowLocalEndpoint?: boolean;
  allowPrivateEndpoint?: boolean;
  allowHttp?: boolean;
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
  profile?: string;
  provider?: TranslatorProvider;
  model?: string;
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
  endpoint?: string;
  apiKey?: string;
  model?: string;
}

export interface AppConfig {
  version: string;
  activeProfile: string;
  profiles: Record<string, ConfigProfile>;
}

export interface ConfigOptions {
  unset?: ConfigKey;
  reset?: boolean;

  // profile と add 用のオプション
  provider?: TranslatorProvider;
  endpoint?: string;
  apiKey?: string;
  model?: string;
}

export type ConfigKey = 'endpoint' | 'api-key' | 'provider' | 'model';

export type TranslatorProvider = 'gas' | 'custom' | 'openai' | 'gemini' | 'lmstudio';
