export interface Config {
  gasApiUrl: string;
  translationProvider: 'gas';
}

const GAS_API_URL = "https://script.google.com/macros/s/AKfycbxOSbKD0aBTaQqIzHv00BMzp6WwrtWHBU3gJY0vhB2HblgUO-cgesfT1l-rrfttnWZzew/exec";

export function getConfig(): Config {
  const gasApiUrl = GAS_API_URL;

  if (!gasApiUrl || !gasApiUrl.startsWith('https://script.google.com/macros/s/')) {
    throw new Error('Config Error: 無効なGAS API URLです。');
  }

  return {
    gasApiUrl,
    translationProvider: 'gas',
  };
}
