import { invoke } from '@tauri-apps/api/core';
import { isTauriEnvironment } from 'exif-hound-core';

export async function fetchBytesViaRust(
  command: 'fetch_remote_image_bytes' | 'fetch_map_tile_bytes' | 'fetch_nominatim_bytes',
  url: string,
): Promise<Uint8Array> {
  if (!isTauriEnvironment()) {
    const response = await fetch(url, { credentials: 'omit' });
    if (!response.ok) {
      throw new Error(`HTTP request failed (${response.status})`);
    }
    return new Uint8Array(await response.arrayBuffer());
  }
  const bytes = await invoke<number[]>(command, { url });
  return Uint8Array.from(bytes);
}

async function invokeWhenAvailable<T>(command: string, args: Record<string, unknown>): Promise<T | undefined> {
  if (!isTauriEnvironment()) return undefined;
  try {
    return await invoke<T>(command, args);
  } catch {
    // Partial Tauri mocks in unit tests omit invoke.
    return undefined;
  }
}

export async function syncTrustedProjectRoots(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  await invokeWhenAvailable('register_trusted_project_roots', { roots: paths });
}

export async function syncRemoteImageHosts(hosts: string[]): Promise<void> {
  await invokeWhenAvailable('register_remote_image_hosts', { hosts });
}

export async function syncCustomTileHosts(hosts: string[]): Promise<void> {
  await invokeWhenAvailable('register_custom_tile_hosts', { hosts });
}

/** Sample a Leaflet tile URL template so we can read its hostname. */
export function hostFromTileTemplate(template: string): string | null {
  try {
    const sample = template
      .replace(/\{s\}/gi, 'a')
      .replace(/\{z\}/gi, '0')
      .replace(/\{x\}/gi, '0')
      .replace(/\{y\}/gi, '0');
    return new URL(sample).hostname.toLowerCase();
  } catch {
    return null;
  }
}
