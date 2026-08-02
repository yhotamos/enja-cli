import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ConfigProfile } from '../types/index.js';

const { getResolvedProfile } = vi.hoisted(() => ({
  getResolvedProfile: vi.fn(),
}));

vi.mock('../services/config/storage.js', () => ({
  ConfigStorage: class {
    getResolvedProfile = getResolvedProfile;
  },
}));

import { resolveConfig } from './index.js';

const profile: ConfigProfile = {
  provider: 'gas',
  endpoint: 'https://script.google.com/macros/s/example/exec',
  apiKey: 'profile-key',
  model: 'profile-model',
  allowLocalEndpoint: false,
  allowPrivateEndpoint: false,
  allowHttp: false,
};

describe('resolveConfig', () => {
  beforeEach(() => {
    getResolvedProfile.mockReset();
    getResolvedProfile.mockResolvedValue({ profileName: 'work', config: profile });
  });

  it('resolves the active profile and its config together', async () => {
    const result = await resolveConfig();

    expect(getResolvedProfile).toHaveBeenCalledOnce();
    expect(getResolvedProfile).toHaveBeenCalledWith(undefined);
    expect(result).toEqual({ profileName: 'work', config: profile });
  });

  it('passes an explicitly selected profile to storage', async () => {
    await resolveConfig({ profile: 'personal' });

    expect(getResolvedProfile).toHaveBeenCalledOnce();
    expect(getResolvedProfile).toHaveBeenCalledWith('personal');
  });

  it('applies command options over the selected profile', async () => {
    const result = await resolveConfig({
      provider: 'ollama',
      endpoint: 'http://localhost:11434',
      apiKey: 'option-key',
      model: 'option-model',
      allowLocalEndpoint: true,
      allowHttp: true,
    });

    expect(result).toEqual({
      profileName: 'work',
      config: {
        provider: 'ollama',
        endpoint: 'http://localhost:11434',
        apiKey: 'option-key',
        model: 'option-model',
        allowLocalEndpoint: true,
        allowPrivateEndpoint: false,
        allowHttp: true,
      },
    });
  });
});
