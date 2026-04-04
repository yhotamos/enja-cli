import * as os from 'node:os';
import * as path from 'node:path';

/** OS の設定ディレクトリのパスを取得 */
export function getConfigDir(): string {
  const platform = process.platform;

  if (platform === 'win32') {
    const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    if (!appData) {
      throw new Error('APPDATA 環境変数が設定されておらず，代替パスの取得に失敗しました');
    }
    return path.join(appData, 'enja-cli');
  }

  const homeDir = os.homedir();
  return path.join(homeDir, '.config', 'enja-cli');
}

/** 履歴ファイルのパスを取得 */
export function getHistoryFilePath(): string {
  return path.join(getConfigDir(), 'history.json');
}

/** 設定ファイルのパスを取得 */
export function getConfigFilePath(): string {
  return path.join(getConfigDir(), 'config.json');
}
