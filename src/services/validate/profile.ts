import { RESERVED_WORDS } from '../../config/constants';

/**
 * プロファイル名のバリデーション
 * @param name プロファイル名
 * @throws 無効なプロファイル名の場合にエラーをスロー
 */
export function validateProfileName(name: string): void {
  if (RESERVED_WORDS.includes(name.toLowerCase())) {
    throw new Error(`プロファイル名 '${name}' は予約語のため使用できません`);
  }
  if (!name.match(/^[a-zA-Z0-9_-]+$/)) {
    throw new Error(`無効なプロファイル名 (${name}): 英数字，ハイフン，アンダースコアのみ使用できます`);
  }
}
