import { HistoryEntry } from '../../types/index.js';

/** 履歴エントリをフォーマットして文字列として返す */
export function formatHistory(entries: HistoryEntry[], detailed: boolean = false): string {
  if (entries.length === 0) {
    return '履歴はありません';
  }

  if (!detailed) {
    return formatSimple(entries);
  }

  return formatDetailed(entries);
}

/** 簡易フォーマット */
function formatSimple(entries: HistoryEntry[]): string {
  const lines: string[] = [];

  lines.push(`全 ${entries.length} 件の履歴\n`);

  entries.forEach((entry, index) => {
    const date = new Date(entry.timestamp).toLocaleString('ja-JP');
    const preview = entry.sourceText.length > 30
      ? entry.sourceText.substring(0, 30) + '...'
      : entry.sourceText;

    lines.push(`[${index + 1}] ${entry.id.substring(0, 8)} | ${date}`);
    lines.push(`    ${entry.sourceLang} → ${entry.targetLang} | ${preview}`);
    lines.push('');
  });

  return lines.join('\n');
}

/** 詳細フォーマット */
function formatDetailed(entries: HistoryEntry[]): string {
  const lines: string[] = [];

  lines.push(`全 ${entries.length} 件の履歴の詳細\n`);

  entries.forEach((entry, index) => {
    if (index > 0) {
      lines.push('─'.repeat(60));
    }

    const date = new Date(entry.timestamp).toLocaleString('ja-JP');

    lines.push(`ID: ${entry.id}`);
    lines.push(`Date: ${date}`);
    lines.push(`Direction: ${entry.sourceLang} → ${entry.targetLang}`);
    lines.push(`Length: ${entry.textLength} characters`);

    if (entry.options) {
      const opts: string[] = [];
      if (entry.options.inputMethod) opts.push(`input=${entry.options.inputMethod}`);
      if (entry.options.stripHtml) opts.push('stripHtml=true');
      if (entry.options.file) opts.push(`file=${entry.options.file}`);
      if (opts.length > 0) {
        lines.push(`Options: ${opts.join(', ')}`);
      }
    }

    lines.push('');
    lines.push(`Input:`);
    lines.push(entry.sourceText);
    lines.push('');
    lines.push(`Output:`);
    lines.push(entry.translatedText);
    lines.push('');
  });

  return lines.join('\n');
}
