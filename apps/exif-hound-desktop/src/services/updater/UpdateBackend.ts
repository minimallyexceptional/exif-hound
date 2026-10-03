/**
 * Updater backend interface.
 *
 * Isolates every platform/plugin-specific detail behind a small interface so
 * the UpdateService and the UI can be developed and tested against an
 * in-memory fake. The only production implementation is TauriUpdaterBackend.
 *
 * Signature verification happens inside the Rust updater plugin before
 * `download` resolves — the frontend never handles unsigned bytes.
 */

import { check as pluginCheck, Update } from '@tauri-apps/plugin-updater';
import { relaunch as pluginRelaunch } from '@tauri-apps/plugin-process';
import { UpdateInfo, DownloadProgress } from './UpdateState';

export type ProgressCallback = (progress: DownloadProgress) => void;

export interface UpdaterBackend {
  /** True when the updater could plausibly work (Tauri runtime present). */
  isConfigured(): boolean;
  /** Returns update info, or null when the app is up to date. */
  check(): Promise<UpdateInfo | null>;
  /** Downloads the update, reporting progress. Signature is verified here. */
  download(onProgress: ProgressCallback): Promise<void>;
  /** Installs the previously downloaded update. */
  install(): Promise<void>;
  /** Relaunches the app (macOS/Linux). On Windows the installer relaunches. */
  relaunch(): Promise<void>;
}

/**
 * Production backend wrapping @tauri-apps/plugin-updater and
 * @tauri-apps/plugin-process.
 */
export class TauriUpdaterBackend implements UpdaterBackend {
  private current: Update | null = null;

  isConfigured(): boolean {
    try {
      if (typeof window === 'undefined') return false;
      // Tauri v2 always injects __TAURI_INTERNALS__ into its webview (the npm
      // APIs are built on it). window.__TAURI__ only exists when
      // app.withGlobalTauri is enabled, which this app does not use.
      return !!(
        (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ ??
        (window as unknown as { __TAURI__?: unknown }).__TAURI__
      );
    } catch {
      return false;
    }
  }

  async check(): Promise<UpdateInfo | null> {
    const update = await pluginCheck();
    if (!update) {
      // A prior AVAILABLE state may still own a Rust resource. A re-check
      // that reports CURRENT supersedes it, so release it before returning.
      await this.dispose();
      return null;
    }
    // Close any previously held resource before replacing it.
    await this.dispose();
    this.current = update;
    return {
      version: update.version,
      date: update.date,
      notes: update.body ?? undefined,
    };
  }

  async download(onProgress: ProgressCallback): Promise<void> {
    const update = this.requireCurrent();
    let receivedBytes = 0;
    let totalBytes: number | undefined;
    await update.download(event => {
      if (event.event === 'Started') {
        totalBytes = event.data.contentLength;
      } else if (event.event === 'Progress') {
        receivedBytes += event.data.chunkLength;
      } else if (event.event === 'Finished') {
        return;
      }
      onProgress({ receivedBytes, totalBytes });
    });
  }

  async install(): Promise<void> {
    const update = this.requireCurrent();
    try {
      // On Windows this exits the app after launching the installer
      // (which relaunches it). On macOS/Linux it returns normally.
      await update.install({ restartAfterInstall: true });
    } finally {
      // Installation consumes the downloaded bytes but the Update resource
      // itself remains open until explicitly closed.
      this.current = null;
      await update.close().catch(() => undefined);
    }
  }

  async relaunch(): Promise<void> {
    await pluginRelaunch();
  }

  async dispose(): Promise<void> {
    if (this.current) {
      const update = this.current;
      this.current = null;
      await update.close();
    }
  }

  private requireCurrent(): Update {
    if (!this.current) {
      throw new Error('No update is available to operate on');
    }
    return this.current;
  }
}
