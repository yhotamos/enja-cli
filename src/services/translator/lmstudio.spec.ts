import { describe, it, expect } from 'vitest';
import { LMStudioTranslator } from './lmstudio.js';

describe('LMStudioTranslator helpers', () => {
  const t = new LMStudioTranslator(undefined as any, 'model-x');

  it('parses valid JSON', () => {
    const raw = JSON.stringify({ output: [{}, { type: 'message', content: 'こんにちは世界' }] });
    const data = (t as any).parseJsonSafe(raw, { ok: true, status: 200 });
    const translated = (t as any).extractTranslatedFromOutput(data);
    expect(translated).toBe('こんにちは世界');
  });

  it('extracts text field if present', () => {
    const raw = JSON.stringify({ output: [{}, { type: 'message', content: { text: 'こんにちは世界' } }] });
    const data = (t as any).parseJsonSafe(raw, { ok: true, status: 200 });
    const translated = (t as any).extractTranslatedFromOutput(data);
    expect(translated).toBe('こんにちは世界');
  });

  it('throws on non-JSON when response not ok', () => {
    const raw = '<html>error</html>';
    expect(() => (t as any).parseJsonSafe(raw, { ok: false, status: 500 })).toThrow();
  });

  it('throws on invalid JSON even when ok', () => {
    const raw = '<html>ok</html>';
    expect(() => (t as any).parseJsonSafe(raw, { ok: true, status: 200 })).toThrow();
  });

  it('translated text is not trimmed', () => {
    const raw = JSON.stringify({ output: [{}, { type: 'message', content: '  こんにちは世界  ' }] });
    const data = (t as any).parseJsonSafe(raw, { ok: true, status: 200 });
    const translated = (t as any).extractTranslatedFromOutput(data);
    expect(translated).toBe('  こんにちは世界  ');
  });

  it('translated text keeps newlines', () => {
    const raw = JSON.stringify({ output: [{}, { type: 'message', content: 'line1\nline2' }] });
    const data = (t as any).parseJsonSafe(raw, { ok: true, status: 200 });
    const translated = (t as any).extractTranslatedFromOutput(data);
    expect(translated).toBe('line1\nline2');
  });

  it('returns undefined for empty raw', () => {
    const raw = '';
    const data = (t as any).parseJsonSafe(raw, { ok: true, status: 200 });
    expect(data).toBeUndefined();
  });

  it('extracts when output[1] is a plain string', () => {
    const raw = JSON.stringify({ output: [{}, '直接の文字列'] });
    const data = (t as any).parseJsonSafe(raw, { ok: true, status: 200 });
    const translated = (t as any).extractTranslatedFromOutput(data);
    expect(translated).toBe('直接の文字列');
  });

  it('extracts when output[1] is an array of strings', () => {
    const raw = JSON.stringify({ output: [{}, ['一つ目', '二つ目']] });
    const data = (t as any).parseJsonSafe(raw, { ok: true, status: 200 });
    const translated = (t as any).extractTranslatedFromOutput(data);
    expect(translated).toBe('一つ目');
  });

  it('extracts from nested content.content field', () => {
    const raw = JSON.stringify({ output: [{}, { type: 'message', content: { content: 'ネストされた内容' } }] });
    const data = (t as any).parseJsonSafe(raw, { ok: true, status: 200 });
    const translated = (t as any).extractTranslatedFromOutput(data);
    expect(translated).toBe('ネストされた内容');
  });

  it('returns null for unsupported shapes', () => {
    const raw = JSON.stringify({ output: [{}, { type: 'message', content: { foo: 123 } }] });
    const data = (t as any).parseJsonSafe(raw, { ok: true, status: 200 });
    const translated = (t as any).extractTranslatedFromOutput(data);
    expect(translated).toBeNull();
  });
});
