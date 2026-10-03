import { UpdaterBackend, ProgressCallback } from '../UpdateBackend';
import { UpdateInfo, DownloadProgress } from '../UpdateState';

/**
 * In-memory UpdaterBackend for tests. Simulates the Tauri plugin boundary:
 * check / download (with progress events) / install / relaunch, plus
 * failure injection for every phase.
 */
export class FakeUpdaterBackend implements UpdaterBackend {
  configured = true;
  /** What the next check() returns (null = up to date). */
  nextCheck: UpdateInfo | null = null;
  checkError?: unknown;
  downloadError?: unknown;
  installError?: unknown;
  relaunchError?: unknown;
  /** Simulates Windows, where install() launches the installer and exits. */
  installExitsProcess = false;

  calls = { check: 0, download: 0, install: 0, relaunch: 0, close: 0 };

  private hasDownloaded = false;

  isConfigured(): boolean {
    return this.configured;
  }

  async check(): Promise<UpdateInfo | null> {
    this.calls.check++;
    if (this.checkError !== undefined) throw this.checkError;
    return this.nextCheck;
  }

  async download(onProgress: ProgressCallback): Promise<void> {
    this.calls.download++;
    if (this.downloadError !== undefined) throw this.downloadError;
    // Emit a realistic Started/Progress.../Finished sequence.
    onProgress({ receivedBytes: 0, totalBytes: 1000 });
    for (let i = 1; i <= 5; i++) {
      onProgress({ receivedBytes: i * 200, totalBytes: 1000 });
    }
    this.hasDownloaded = true;
  }

  async install(): Promise<void> {
    this.calls.install++;
    if (!this.hasDownloaded) throw new Error('no downloaded update to install');
    if (this.installError !== undefined) throw this.installError;
  }

  async relaunch(): Promise<void> {
    this.calls.relaunch++;
    if (this.relaunchError !== undefined) throw this.relaunchError;
  }

  async dispose(): Promise<void> {
    this.calls.close++;
  }
}

export const UPDATE_2_7_0: UpdateInfo = {
  version: '2.7.0',
  date: '2026-10-12T18:00:00Z',
  notes: 'Improved map tools\nFixed Linux compatibility',
};

export function percentOf(progress: DownloadProgress | undefined): number | null {
  if (!progress?.totalBytes) return null;
  return Math.round((progress.receivedBytes / progress.totalBytes) * 100);
}
