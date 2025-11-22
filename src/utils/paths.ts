import * as path from 'path';
import * as os from 'os';

/** OS の設定ディレクトリのパスを取得 */
export function getConfigDir(): string {
  const platform = process.platform;

  if (platform === 'win32') {
    const appData = process.env.APPDATA;
    if (!appData) {
      throw new Error('error: APPDATA 環境変数が設定されていません');
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
