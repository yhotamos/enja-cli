import type { ConfigProfile } from '../../types/index.js';

export interface ResolvedProfile {
  profileName: string;
  config: ConfigProfile;
}

export interface ConfigManager {
  get(): Promise<ConfigProfile>;
  getResolvedProfile(name?: string): Promise<ResolvedProfile>;
  getActiveProfileName(): Promise<string>;
  getProfile(name: string): Promise<ConfigProfile>;
  listProfiles(): Promise<string[]>;
  useProfile(name: string): Promise<void>;
  addProfile(name: string, config?: Partial<ConfigProfile>): Promise<void>;
  renameProfile(oldProfileName: string, newProfileName: string): Promise<void>;
  copyProfile(sourceProfileName: string, targetProfileName: string): Promise<void>;
  deleteProfile(name: string): Promise<void>;
  setProfileConfig(profileName: string, key: string, value: string): Promise<void>;
  unsetProfileConfig(profileName: string, key: string): Promise<void>;
  resetProfileConfig(profileName: string): Promise<void>;
}
