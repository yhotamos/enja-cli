import type { TranslatorStyle } from '../../types/index.js';

export interface TranslationResult {
  text: string;
  detectedSourceLang?: string;
}

export interface Translator {
  getModel(): string | null;
  translate(text: string, sourceLang: string, targetLang: string, style?: TranslatorStyle): Promise<TranslationResult>;
}
