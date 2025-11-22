import { ConfigProfile } from '../../types/index.js';

export interface ConfigManager {
  get(): Promise<ConfigProfile>;
  set(key: string, value: string): Promise<void>;
  unset(key: string): Promise<void>;
  reset(): Promise<void>;
}
