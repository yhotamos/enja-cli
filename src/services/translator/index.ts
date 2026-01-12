export interface TranslationResult {
  text: string;
  detectedSourceLang?: string;
}

export interface Translator {
  getModel(): string | null;
  translate(text: string, sourceLang: string, targetLang: string): Promise<TranslationResult>;
}
