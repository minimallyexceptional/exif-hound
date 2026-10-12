import { openUrl } from '@tauri-apps/plugin-opener';
import { isTauriEnvironment } from './fileSystem';

/**
 * Open an http(s) URL in the system browser (Tauri) or a new tab (browser dev).
 */
export async function openExternalUrl(url: string): Promise<void> {
  if (!isTauriEnvironment()) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }
  await openUrl(url);
}
