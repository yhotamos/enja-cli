import type { ConfigProfile } from '../../types/index.js';

export interface ConfigManager {
  get(): Promise<ConfigProfile>;
  getActiveProfileName(): Promise<string>;
  getProfile(name: string): Promise<ConfigProfile>;
  listProfiles(): Promise<string[]>;
  createProfile(name: string, config?: Partial<ConfigProfile>): Promise<void>;
  deleteProfile(name: string): Promise<void>;
  useProfile(name: string): Promise<void>;
  setProfileConfig(profileName: string, key: string, value: string): Promise<void>;
  unsetProfileConfig(profileName: string, key: string): Promise<void>;
  resetProfile(profileName: string): Promise<void>;
}
