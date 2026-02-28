import kleur from 'kleur';
import type { HistoryEntry } from '../../types/index.js';

/** 履歴エントリをフォーマットして文字列として返す */
export function formatHistory(entries: HistoryEntry[], detailed: boolean = false): string {
  if (entries.length === 0) {
    return '履歴はありません';
  }

  return detailed ? formatDetailed(entries) : formatSimple(entries);
}

/** 簡易フォーマット */
function formatSimple(entries: HistoryEntry[]): string {
  const lines: string[] = [`全 ${entries.length} 件の履歴\n`];

  entries.forEach((entry, index) => {
    const date = formatDate(entry.timestamp);
    const profileInfo = getProfileInfo(entry);

    const srcPreview = getPreview(entry.sourceText, 20);
    const tgtPreview = getPreview(entry.translatedText || '', 20);

    const infoLine = [
      kleur.cyan(`[${index + 1}]`),
      entry.id.substring(0, 8),
      date,
      profileInfo || null
    ].filter(Boolean).join(' | ');

    lines.push(infoLine);
    lines.push(`    ${entry.sourceLang} → ${entry.targetLang} | ${srcPreview} → ${tgtPreview}`);
    lines.push('');
  });

  return lines.join('\n');
}

/** 詳細フォーマット */
function formatDetailed(entries: HistoryEntry[]): string {
  const lines: string[] = [`全 ${entries.length} 件の履歴の詳細\n`];

  entries.forEach((entry, index) => {
    if (index > 0) lines.push('─'.repeat(60));

    const labelWidth = 14;

    lines.push(`${kleur.cyan('ID:'.padEnd(labelWidth))} ${entry.id}`);
    lines.push(`${kleur.cyan('Date:'.padEnd(labelWidth))} ${formatDate(entry.timestamp)}`);
    lines.push(`${kleur.cyan('Direction:'.padEnd(labelWidth))} ${entry.sourceLang} → ${entry.targetLang}`);
    lines.push(`${kleur.cyan('InputLength:'.padEnd(labelWidth))} ${entry.textLength} characters`);
    lines.push(`${kleur.cyan('OutputLength:'.padEnd(labelWidth))} ${entry.translatedText.length} characters`);
    if (entry.profile) lines.push(`${kleur.cyan('Profile:'.padEnd(labelWidth))} ${entry.profile}`);
    if (entry.provider) lines.push(`${kleur.cyan('Provider:'.padEnd(labelWidth))} ${entry.provider}`);
    if (entry.model) lines.push(`${kleur.cyan('Model:'.padEnd(labelWidth))} ${entry.model}`);

    if (entry.options) {
      const opts = [
        entry.options.inputMethod && `input=${entry.options.inputMethod}`,
        entry.options.stripHtml && 'stripHtml=true',
        entry.options.file && `file=${entry.options.file}`
      ].filter(Boolean).join(', ');

      if (opts) lines.push(`${kleur.cyan('Options:'.padEnd(labelWidth))} ${opts}`);
    }

    lines.push('', `${kleur.cyan('Input:')}`, entry.sourceText);
    lines.push('', `${kleur.cyan('Output:')}`, entry.translatedText || '', '');
  });

  return lines.join('\n');
}

function formatDate(timestamp: string): string {
  return new Date(timestamp).toLocaleString('ja-JP');
}

function getPreview(text: string, maxLength: number): string {
  const normalized = text.replace(/[\r\n]+/g, ' ');
  return normalized.length > maxLength ? normalized.substring(0, maxLength) + '...' : normalized;
}

function getProfileInfo(entry: HistoryEntry): string {
  return [
    entry.profile,
    entry.provider,
    entry.model
  ]
    .filter((val): val is string => Boolean(val))
    .map((val) => kleur.magenta(val))
    .join(kleur.dim('・'));
}
