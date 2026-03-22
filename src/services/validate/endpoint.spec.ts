import { describe, it, expect } from 'vitest';
import { validateEndpoint } from './endpoint.js';

describe('validateEndpoint', () => {
  it('accepts valid https URLs with variations', () => {
    expect(validateEndpoint('https://example.com')).toBe(true);
    expect(validateEndpoint('https://example.com/path')).toBe(true);
    expect(validateEndpoint('https://example.com?query=1')).toBe(true);
    expect(validateEndpoint('https://example.com:443')).toBe(true);
    expect(validateEndpoint('HTTPS://example.com')).toBe(true);
    expect(validateEndpoint('HTTP://example.com', { allowHttp: true })).toBe(true);
  });

  it('rejects plain http by default and allows with option', () => {
    expect(() => validateEndpoint('http://example.com')).toThrow('https');
    expect(validateEndpoint('http://example.com', { allowHttp: true })).toBe(true);
  });

  it('rejects URLs with embedded credentials (always)', () => {
    expect(() => validateEndpoint('https://user:pass@example.com')).toThrow('エンドポイント URL に認証情報を埋め込むことは許可されていません');
  });

  // localhost は明示的な許可が必要
  it('requires opt-in for localhost and allows with option', () => {
    expect(() => validateEndpoint('http://localhost:3000')).toThrow(
      'エンドポイント URL は https:// で始まる必要があります' +
      '\nHTTP エンドポイントを使用する必要がある場合は，--allow-http オプションを使用してください' +
      '\nローカルエンドポイントであれば --allow-local-endpoint オプションでも許可されます'
    );
    expect(validateEndpoint('http://localhost:3000', { allowLocalEndpoint: true, allowHttp: true })).toBe(true);
  });

  // private IPv4
  it('rejects private IPv4 by default and allows with option', () => {
    expect(() => validateEndpoint('https://192.168.0.5')).toThrow(
      'プライベート IP エンドポイントの使用は既定で許可されていません' +
      '\n使用する必要がある場合は，--allow-private-endpoint オプションを使用してください'
    );
    expect(validateEndpoint('https://192.168.0.5', { allowPrivateEndpoint: true })).toBe(true);
  });

  // link-local (常にブロック)
  it('blocks link-local IPv4 (always)', () => {
    expect(() => validateEndpoint('http://169.254.169.254')).toThrow('指定されたエンドポイントはセキュリティ上の理由により許可されていません');
    expect(() => validateEndpoint('http://169.254.0.1')).toThrow('指定されたエンドポイントはリンクローカルアドレスのため許可されていません');
  });

  // 認証情報は常に拒否
  it('still rejects embedded credentials even if other options allow the host', () => {
    expect(() =>
      validateEndpoint('https://user:pass@192.168.0.5', { allowPrivateEndpoint: true })
    ).toThrow('エンドポイント URL に認証情報を埋め込むことは許可されていません');

    expect(() =>
      validateEndpoint('http://user:pass@localhost:3000', {
        allowLocalEndpoint: true,
        allowHttp: true,
      })
    ).toThrow('エンドポイント URL に認証情報を埋め込むことは許可されていません');
  });

  // allowHttp だけでは localhost は許可されない
  it('localhost requires allowLocalEndpoint even if allowHttp is true', () => {
    expect(() =>
      validateEndpoint('http://localhost:3000', { allowHttp: true })
    ).toThrow('ローカルエンドポイントの使用はセキュリティリスクがあるため許可されていません');

    expect(
      validateEndpoint('http://localhost:3000', {
        allowLocalEndpoint: true,
        allowHttp: true,
      })
    ).toBe(true);

    expect(validateEndpoint('http://localhost:3000', { allowLocalEndpoint: true })).toBe(true);
  });

  // 不正入力
  it('rejects invalid URLs', () => {
    expect(() => validateEndpoint('not-a-url')).toThrow('エンドポイント URL が不正です');
    expect(() => validateEndpoint('')).toThrow('エンドポイント URL が不正です');
    expect(() => validateEndpoint('example.com')).toThrow('エンドポイント URL が不正です');
  });
});
