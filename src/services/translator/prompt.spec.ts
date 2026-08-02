import { describe, expect, it } from 'vitest';
import type { TranslatorStyle } from '../../types/index.js';
import { assertStyleSupported, assertTranslatorStyle, buildSystemPrompt } from './prompt.js';

const translatorStyles: readonly TranslatorStyle[] = ['formal', 'casual', 'technical', 'academic', 'business'];

const expectedInstructions: Record<TranslatorStyle, string> = {
  formal: 'formal, polite, and professional',
  casual: 'natural, friendly, and conversational',
  technical: 'technical accuracy',
  academic: 'objective, precise, and academic',
  business: 'professional business language',
};

describe('translator style', () => {
  it.each(translatorStyles)('adds the %s instruction to the prompt', (style) => {
    const prompt = buildSystemPrompt('en', 'ja', style);

    expect(prompt).toContain('English');
    expect(prompt).toContain('Japanese');
    expect(prompt).toContain(expectedInstructions[style]);
  });

  it('omits style requirements when style is not specified', () => {
    expect(buildSystemPrompt('en', 'ja')).not.toContain('Additional translation style requirements');
  });

  it('rejects an invalid runtime style', () => {
    expect(() => assertTranslatorStyle('pirate')).toThrow('無効な翻訳スタイルです');
  });

  it.each(['gas', 'custom'] as const)('rejects style for the %s provider', (provider) => {
    expect(() => assertStyleSupported(provider, 'formal')).toThrow('スタイル指定はサポートされていません');
  });

  it.each(['openai', 'gemini', 'lmstudio', 'ollama'] as const)('accepts style for the %s provider', (provider) => {
    expect(() => assertStyleSupported(provider, 'formal')).not.toThrow();
  });
});
