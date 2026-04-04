import { confirm, select } from '@inquirer/prompts';
import kleur from 'kleur';

export async function selectProfile(profiles: string[], activeProfile: string): Promise<string> {
  const choices = profiles.map((profile) => ({
    name: profile === activeProfile ? kleur.green(`${profile} (active)`) : profile,
    value: profile,
  }));
  try {
    const response = await select({ message: 'プロファイルを選択してください', choices });
    return response;
  } catch {
    throw new Error('プロファイルの選択がキャンセルされました');
  }
}

export async function confirmDeleteProfile(profileName: string): Promise<boolean> {
  try {
    const confirmed = await confirm({ message: `プロファイル '${profileName}' を削除してもよろしいですか？` });
    if (!confirmed) {
      console.log('プロファイルの削除がキャンセルされました');
      return false;
    }
  } catch {
    throw new Error('プロファイルの削除がキャンセルされました');
  }
  return true;
}
