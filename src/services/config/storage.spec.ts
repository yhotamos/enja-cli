import { describe, expect, it, vi } from 'vitest';
import type { AppConfig, ConfigProfile } from '../../types/index.js';
import { ConfigStorage } from './storage.js';

const defaultProfile: ConfigProfile = {
  provider: 'gas',
  endpoint: 'https://script.google.com/macros/s/default/exec',
  allowLocalEndpoint: false,
  allowPrivateEndpoint: false,
  allowHttp: false,
};

const workProfile: ConfigProfile = {
  provider: 'ollama',
  endpoint: 'http://localhost:11434',
  model: 'test-model',
  allowLocalEndpoint: true,
  allowPrivateEndpoint: false,
  allowHttp: false,
};

function appConfig(activeProfile: string): AppConfig {
  return {
    version: '1.1',
    activeProfile,
    profiles: {
      default: defaultProfile,
      work: workProfile,
    },
  };
}

function mockAppConfig(storage: ConfigStorage, config: AppConfig) {
  return vi.spyOn(storage as unknown as { readAppConfig(): Promise<AppConfig> }, 'readAppConfig').mockResolvedValue(config);
}

describe('ConfigStorage.getResolvedProfile', () => {
  it('returns the active profile name and config from one read', async () => {
    const storage = new ConfigStorage();
    const readAppConfig = mockAppConfig(storage, appConfig('work'));

    await expect(storage.getResolvedProfile()).resolves.toEqual({
      profileName: 'work',
      config: workProfile,
    });
    expect(readAppConfig).toHaveBeenCalledOnce();
  });

  it('returns an explicitly selected profile', async () => {
    const storage = new ConfigStorage();
    const readAppConfig = mockAppConfig(storage, appConfig('work'));

    await expect(storage.getResolvedProfile('default')).resolves.toEqual({
      profileName: 'default',
      config: defaultProfile,
    });
    expect(readAppConfig).toHaveBeenCalledOnce();
  });

  it('falls back consistently when the active profile does not exist', async () => {
    const storage = new ConfigStorage();
    mockAppConfig(storage, appConfig('missing'));

    await expect(storage.getResolvedProfile()).resolves.toEqual({
      profileName: 'default',
      config: defaultProfile,
    });
  });

  it('reports available profiles when an explicitly selected profile does not exist', async () => {
    const storage = new ConfigStorage();
    mockAppConfig(storage, appConfig('work'));

    await expect(storage.getResolvedProfile('missing')).rejects.toThrow(
      "プロファイル 'missing' が見つかりません\n利用可能なプロファイル: default, work",
    );
  });
});
