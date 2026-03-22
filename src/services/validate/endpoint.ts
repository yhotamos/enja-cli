const ALWAYS_BLOCK_HOSTS = new Set(['169.254.169.254']);

export type ValidateEndpointOptions = {
  allowLocalEndpoint?: boolean;
  allowPrivateEndpoint?: boolean;
  allowHttp?: boolean;
};

function parseIPv4Octets(hostname: string): number[] | null {
  const m = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return null;
  const octets = m.slice(1).map(n => Number(n));
  if (octets.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return null;
  return octets;
}

function hasIPv4Prefix(o: number[], a: number, b: number): boolean {
  return o[0] === a && o[1] === b;
}

function isIPv4InRFC1918(o: number[]): boolean {
  const [a, b] = o;
  if (a === 10) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  return false;
}

function isIPv4Loopback(o: number[]): boolean {
  return o[0] === 127;
}

function isIPv4LinkLocal(o: number[]): boolean {
  return hasIPv4Prefix(o, 169, 254);
}

function isIPv6Loopback(hostname: string): boolean {
  return hostname === '::1' || hostname === '0:0:0:0:0:0:0:1';
}

function isIPv6LinkLocal(hostname: string): boolean {
  return hostname.toLowerCase().startsWith('fe80:');
}

const LOCALHOST_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

const PRIVATE_IPV4_PREFIXES = new Set([
  '10.', // 10.0.0.0/8
  '192.168.', // 192.168.0.0/16
  // 172.16.0.0/12 は prefix だけでは表現しづらいので数値判定に寄せる
]);

export function validateEndpoint(endpoint: string, options: ValidateEndpointOptions = {}): true {
  const { allowLocalEndpoint = false, allowPrivateEndpoint = false, allowHttp = false } = options;

  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    throw new Error('エンドポイント URL が不正です');
  }

  const protocol = url.protocol;

  if (protocol !== 'https:' && protocol !== 'http:') {
    throw new Error('エンドポイント URL は http:// または https:// で始まる必要があります');
  }

  // URL に user:pass@host の形式で認証情報が含まれていないか確認
  if (url.username || url.password) {
    throw new Error('エンドポイント URL に認証情報を埋め込むことは許可されていません');
  }

  const hostname = url.hostname;

  if (ALWAYS_BLOCK_HOSTS.has(hostname)) {
    throw new Error('指定されたエンドポイントはセキュリティ上の理由により許可されていません');
  }

  const ipv4 = parseIPv4Octets(hostname);
  const isIPv4 = ipv4 !== null;

  const isLocalhost =
    LOCALHOST_HOSTS.has(hostname) ||
    (isIPv4 ? isIPv4Loopback(ipv4 as number[]) : false) ||
    isIPv6Loopback(hostname);

  const isLinkLocal =
    (isIPv4 ? isIPv4LinkLocal(ipv4 as number[]) : false) ||
    isIPv6LinkLocal(hostname);

  if (isLinkLocal) {
    throw new Error('指定されたエンドポイントはリンクローカルアドレスのため許可されていません');
  }

  // RFC1918（IPv4）
  const isPrivateIpv4 =
    isIPv4
      ? isIPv4InRFC1918(ipv4 as number[])
      : Array.from(PRIVATE_IPV4_PREFIXES).some(p => hostname.startsWith(p)); // 基本ここには来ないが保険

  // 既定は https 強制
  if (protocol === 'http:') {
    if (!(allowHttp || (allowLocalEndpoint && isLocalhost))) {
      throw new Error(
        'エンドポイント URL は https:// で始まる必要があります' +
        '\nHTTP エンドポイントを使用する必要がある場合は，--allow-http オプションを使用してください' +
        '\nローカルエンドポイントであれば --allow-local-endpoint オプションでも許可されます'
      );
    }
  }

  // localhostはオプトイン必須
  if (isLocalhost && !allowLocalEndpoint) {
    throw new Error(
      'ローカルエンドポイントの使用はセキュリティリスクがあるため許可されていません' +
      '\nローカルエンドポイントを使用する必要がある場合は，--allow-local-endpoint オプションを使用してください'
    );
  }

  // RFC1918は既定で拒否
  if (isPrivateIpv4 && !allowPrivateEndpoint) {
    throw new Error(
      'プライベート IP エンドポイントの使用は既定で許可されていません' +
      '\n使用する必要がある場合は，--allow-private-endpoint オプションを使用してください'
    );
  }

  return true;
}