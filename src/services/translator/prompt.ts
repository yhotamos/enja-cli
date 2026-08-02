import type { TranslatorProvider, TranslatorStyle } from '../../types/index.js';

const TRANSLATOR_STYLES: readonly TranslatorStyle[] = ['formal', 'casual', 'technical', 'academic', 'business'];

const STYLE_INSTRUCTIONS: Record<TranslatorStyle, string> = {
  formal: 'Use a formal, polite, and professional tone.',
  casual: 'Use a natural, friendly, and conversational tone.',
  technical: 'Prioritize technical accuracy and preserve domain-specific terminology.',
  academic: 'Use an objective, precise, and academic writing style.',
  business: 'Use concise, clear, and professional business language.',
};

const STYLE_SUPPORTED_PROVIDERS = new Set<TranslatorProvider>(['openai', 'gemini', 'lmstudio', 'ollama']);

export function assertTranslatorStyle(style: unknown): asserts style is TranslatorStyle | undefined {
  if (style === undefined) return;
  if (typeof style !== 'string' || !(TRANSLATOR_STYLES as readonly string[]).includes(style)) {
    throw new Error(`無効な翻訳スタイルです (${String(style)})\n利用可能なスタイル: ${TRANSLATOR_STYLES.join(', ')}`);
  }
}

export function assertStyleSupported(provider: TranslatorProvider, style?: TranslatorStyle): void {
  if (style && !STYLE_SUPPORTED_PROVIDERS.has(provider)) {
    throw new Error(`${provider === 'gas' ? 'GAS' : 'Custom'} プロバイダーではスタイル指定はサポートされていません`);
  }
}

export function buildSystemPrompt(sourceLang: string, targetLang: string, style?: TranslatorStyle): string {
  assertTranslatorStyle(style);

  const sourceLanguage = mapLanguageCode(sourceLang);
  const targetLanguage = mapLanguageCode(targetLang);

  return [
    'You are a professional translator.',
    `Translate the provided text from ${sourceLanguage} to ${targetLanguage}.`,
    style ? `Additional translation style requirements:\n${STYLE_INSTRUCTIONS[style]}` : undefined,
    'Return only the translated text without explanations or comments.',
  ]
    .filter(Boolean)
    .join('\n\n');
}

function mapLanguageCode(code: string): string {
  const languageMap: Record<string, string> = {
    en: 'English',
    ja: 'Japanese',
  };

  return languageMap[code.toLowerCase()] || code;
}
