/**
 * FsPort bound to the Tauri plugin-fs JS API. All paths are project-absolute
 * (already joined by the package's joinPath), permitted by the fs capability
 * scope. mkdir is recursive so nested data/ + images/ trees create cleanly.
 */
import type { FsPort } from 'investigation-archive';

export class TauriFsPort implements FsPort {
  async exists(path: string): Promise<boolean> {
    const { exists } = await import('@tauri-apps/plugin-fs');
    return exists(path);
  }

  async mkdir(path: string): Promise<void> {
    const { mkdir } = await import('@tauri-apps/plugin-fs');
    await mkdir(path, { recursive: true });
  }

  async writeFile(path: string, data: Uint8Array): Promise<void> {
    const { writeFile } = await import('@tauri-apps/plugin-fs');
    await writeFile(path, data);
  }

  async readFile(path: string): Promise<Uint8Array> {
    const { readFile } = await import('@tauri-apps/plugin-fs');
    const bytes = await readFile(path);
    return bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  }

  async deleteFile(path: string): Promise<void> {
    const { remove } = await import('@tauri-apps/plugin-fs');
    await remove(path);
  }

  async removeDir(path: string): Promise<void> {
    const { remove } = await import('@tauri-apps/plugin-fs');
    await remove(path, { recursive: true });
  }
}
