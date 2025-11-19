export interface TranslationResult {
  text: string;
  detectedSourceLang?: string;
}

export interface Translator {
  translate(text: string, sourceLang: string, targetLang: string): Promise<TranslationResult>;
}
