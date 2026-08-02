import { beforeEach, describe, expect, it, vi } from 'vitest';

const { resolveConfig } = vi.hoisted(() => ({
  resolveConfig: vi.fn(),
}));

vi.mock('../../config/index.js', () => ({
  resolveConfig,
}));

import { createTranslator } from './factory.js';
import { LMStudioTranslator } from './lmstudio.js';
import { OllamaTranslator } from './ollama.js';

describe('createTranslator', () => {
  beforeEach(() => {
    resolveConfig.mockReset();
  });

  it('returns only the translator and non-sensitive metadata', async () => {
    resolveConfig.mockResolvedValue({
      profileName: 'local',
      config: {
        provider: 'ollama',
        endpoint: 'http://localhost:11434',
        apiKey: 'secret',
        model: 'test-model',
        allowLocalEndpoint: true,
        allowPrivateEndpoint: false,
        allowHttp: false,
      },
    });

    const result = await createTranslator();

    expect(result.translator).toBeInstanceOf(OllamaTranslator);
    expect(result).toMatchObject({ profileName: 'local', provider: 'ollama' });
    expect(result).not.toHaveProperty('config');
  });

  it('passes endpoint policy to the translator constructor', async () => {
    resolveConfig.mockResolvedValue({
      profileName: 'unsafe',
      config: {
        provider: 'ollama',
        endpoint: 'http://localhost:11434',
        model: 'test-model',
        allowLocalEndpoint: false,
        allowPrivateEndpoint: false,
        allowHttp: false,
      },
    });

    await expect(createTranslator()).rejects.toThrow('エンドポイント URL は https:// で始まる必要があります');
  });

  it('rejects GAS selected over a profile without an endpoint', async () => {
    resolveConfig.mockResolvedValue({
      profileName: 'openai',
      config: {
        provider: 'gas',
        apiKey: 'openai-secret',
        model: 'openai-model',
        allowLocalEndpoint: false,
        allowPrivateEndpoint: false,
        allowHttp: false,
      },
    });

    await expect(createTranslator()).rejects.toThrow('エンドポイント URL が必要です');
  });

  it('uses the trusted built-in endpoint when no endpoint is configured', async () => {
    resolveConfig.mockResolvedValue({
      profileName: 'local',
      config: {
        provider: 'lmstudio',
        model: 'test-model',
        allowLocalEndpoint: false,
        allowPrivateEndpoint: false,
        allowHttp: false,
      },
    });

    const result = await createTranslator();

    expect(result.translator).toBeInstanceOf(LMStudioTranslator);
    expect(result.provider).toBe('lmstudio');
  });
});
