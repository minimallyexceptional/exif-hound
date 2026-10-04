/**
 * The centralized update service.
 *
 * All update behavior flows through this class — UI components never call
 * Tauri updater APIs directly. It owns:
 *
 *  - the update state machine (UpdateState)
 *  - silent (automatic) vs manual (user-initiated) check semantics:
 *      * automatic check failures are swallowed; EXIF HOUND keeps working
 *      * manual check failures surface a clear, non-technical message
 *  - download with progress, install, and relaunch
 *  - a single-flight guard so checks/downloads cannot race
 *
 * The backend (Tauri plugins) and the scheduler are injected, which keeps
 * the service fully unit-testable. This service is privacy-inert: it sends
 * nothing, stores nothing, and generates no identifiers.
 */

import { UpdaterBackend, ProgressCallback } from './UpdateBackend';
import {
  UpdateState,
  UpdateStateName,
  UpdateInfo,
  DownloadProgress,
  assertTransition,
  errorState,
} from './UpdateState';
import { UpdateError, UpdateErrorCode, makeUpdateError, mapPluginError } from './UpdateError';
import { UpdateScheduler, ScheduleOptions } from './UpdateScheduler';

export type UpdateStateListener = (state: UpdateState) => void;

export interface CheckOptions {
  /**
   * true (default): automatic background check — all failures are silent.
   * false: user-initiated check — failures are surfaced in the ERROR state.
   */
  silent?: boolean;
}

export interface UpdateServiceOptions {
  backend: UpdaterBackend;
  scheduler?: UpdateScheduler;
  schedule?: ScheduleOptions;
}

export type CheckResult = 'available' | 'current' | 'failed';

export class UpdateService {
  private backend: UpdaterBackend;
  private scheduler: UpdateScheduler;
  private scheduleOptions: ScheduleOptions;
  private state: UpdateState = { name: 'idle' };
  private listeners = new Set<UpdateStateListener>();
  private checkInFlight = false;
  private downloadInFlight = false;
  /** Records the last silent failure for diagnostics without surfacing UI. */
  lastSilentError: UpdateError | null = null;

  constructor(options: UpdateServiceOptions) {
    this.backend = options.backend;
    this.scheduler = options.scheduler ?? new UpdateScheduler();
    this.scheduleOptions = options.schedule ?? {};
  }

  // ------------------------------------------------------------------ state

  getState(): UpdateState {
    return this.state;
  }

  subscribe(listener: UpdateStateListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private setState(state: UpdateState): void {
    this.state = state;
    for (const listener of this.listeners) {
      try {
        listener(state);
      } catch {
        // A broken subscriber must never break the update flow.
      }
    }
  }

  private transition(to: UpdateStateName, patch: Partial<UpdateState> = {}): void {
    assertTransition(this.state.name, to);
    this.setState({ ...patch, name: to });
  }

  // ------------------------------------------------------------------ check

  /**
   * Checks for an update. See CheckOptions for silent vs manual semantics.
   */
  async check(options: CheckOptions = {}): Promise<CheckResult> {
    const silent = options.silent ?? true;
    if (this.checkInFlight) return 'failed';

    // A check replaces the backend's currently held Update resource. Never
    // allow one to run while a downloaded artifact is in flight or waiting
    // to install, otherwise a manual check could discard a verified update.
    if (
      this.state.name === 'downloading' ||
      this.state.name === 'ready-to-install' ||
      this.state.name === 'installing' ||
      this.state.name === 'restarting'
    ) {
      return 'failed';
    }

    if (!this.backend.isConfigured()) {
      return this.handleCheckError(makeUpdateError(UpdateErrorCode.Unavailable), silent, /* unavailable */ true);
    }

    this.checkInFlight = true;
    try {
      this.transition('checking');
      const update: UpdateInfo | null = await this.backend.check();
      if (update === null) {
        // Up to date. Manual checks surface CURRENT; silent checks return
        // to IDLE so the app shows nothing at all.
        this.transition(silent ? 'idle' : 'current');
        return 'current';
      }
      this.transition('available', { update });
      return 'available';
    } catch (error) {
      return this.handleCheckError(mapPluginError(error, 'check'), silent, false);
    } finally {
      this.checkInFlight = false;
    }
  }

  private handleCheckError(error: UpdateError, silent: boolean, unavailable: boolean): CheckResult {
    if (silent) {
      // Automatic checks fail quietly and never disturb the user.
      this.lastSilentError = error;
      if (this.state.name === 'checking') this.transition('idle');
      return 'failed';
    }
    // Manual checks surface the error so the user can act on it.
    if (this.state.name === 'checking') {
      this.transition('error', { error, errorVisible: true });
    } else {
      this.setState(errorState(error, true));
    }
    if (unavailable) this.scheduler.stop();
    return 'failed';
  }

  // --------------------------------------------------------------- download

  /**
   * Downloads the discovered update, reporting progress. Signature
   * verification happens inside the backend; a VerifyFailed error rejects
   * the update entirely.
   */
  async download(onProgress?: ProgressCallback): Promise<void> {
    if (this.downloadInFlight) return;
    if (this.state.name !== 'available' || !this.state.update) {
      throw mapPluginError(new Error('no update available to download'), 'download');
    }

    this.downloadInFlight = true;
    try {
      this.transition('downloading', {
        update: this.state.update,
        progress: { receivedBytes: 0 },
      });
      const handleProgress: ProgressCallback = (progress: DownloadProgress) => {
        // Progress updates bypass the transition guard (state stays
        // DOWNLOADING) but still notify subscribers.
        this.setState({ ...this.state, name: 'downloading', progress });
        onProgress?.(progress);
      };
      await this.backend.download(handleProgress);
      this.transition('ready-to-install', {
        update: this.state.update,
        progress: undefined,
      });
    } catch (error) {
      const mapped = mapPluginError(error, 'download');
      if (this.getState().name === 'downloading') {
        this.setState(errorState(mapped, true));
      }
      throw mapped;
    } finally {
      this.downloadInFlight = false;
    }
  }

  // ---------------------------------------------------------------- install

  /**
   * Installs the downloaded update without restarting. On Windows this
   * exits the app (the installer relaunches it). Prefer `installAndRestart`.
   */
  async install(): Promise<void> {
    if (this.state.name !== 'ready-to-install') {
      throw mapPluginError(new Error('no downloaded update ready to install'), 'install');
    }
    this.transition('installing', { update: this.state.update });
    try {
      await this.backend.install();
      this.transition('idle');
    } catch (error) {
      const mapped = mapPluginError(error, 'install');
      if (this.getState().name === 'installing') {
        this.setState(errorState(mapped, true));
      }
      throw mapped;
    }
  }

  /**
   * Installs the downloaded update and relaunches into the new version.
   * Callers are responsible for confirming there is no unsaved work first —
   * this method never force-closes the app.
   */
  async installAndRestart(): Promise<void> {
    if (this.state.name !== 'ready-to-install') {
      throw mapPluginError(new Error('no downloaded update ready to install'), 'install');
    }
    this.transition('installing', { update: this.state.update });
    try {
      await this.backend.install();
      // On Windows `install` exits the process and the installer relaunches;
      // on macOS/Linux we relaunch explicitly. RESTARTING is terminal until
      // the new process takes over — stop background checks so they never
      // fire into a dying process.
      this.scheduler.stop();
      this.transition('restarting', { update: this.state.update });
    } catch (error) {
      const mapped = mapPluginError(error, 'install');
      if (this.getState().name === 'installing') {
        this.setState(errorState(mapped, true));
      }
      throw mapped;
    }

    try {
      await this.backend.relaunch();
    } catch (error) {
      const mapped = mapPluginError(error, 'relaunch');
      if (this.getState().name === 'restarting') {
        this.transition('error', { error: mapped, errorVisible: true });
      }
      throw mapped;
    }
  }

  // --------------------------------------------------------------- schedule

  /**
   * Starts automatic discovery: one check shortly after startup, then
   * re-checks roughly every 12 hours. Silent failures keep the app running
   * untouched. If the updater turns out to be unavailable (dev/web builds)
   * the scheduler stops itself so no pointless background work happens.
   */
  startAutomaticChecks(): void {
    if (!this.backend.isConfigured()) return;
    this.scheduler.start(
      () => this.check({ silent: true }).then(() => undefined),
      this.scheduleOptions
    );
  }

  /** Stops automatic discovery, primarily when the owning UI unmounts. */
  stopAutomaticChecks(): void {
    this.scheduler.stop();
  }

  /** Dismisses a visible error or returns from CURRENT/AVAILABLE to IDLE. */
  dismiss(): void {
    if (this.state.name === 'error' || this.state.name === 'current' || this.state.name === 'available') {
      this.transition('idle');
    }
  }
}
