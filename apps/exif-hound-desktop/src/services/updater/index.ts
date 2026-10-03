/**
 * Public surface of the update system.
 *
 * USAGE
 *   const service = getUpdateService();
 *   service.startAutomaticChecks();          // silent discovery (~10s after launch, then every 12h)
 *   await service.check({ silent: false });  // manual check (Help -> Check for Updates)
 *   await service.download(onProgress);
 *   await service.installAndRestart();
 *
 * PRIVACY CONTRACT (see docs/updater.md)
 *   Update checks perform exactly one anonymous HTTPS GET of a static
 *   manifest (e.g. https://updates.exifhound.com/stable/latest.json)
 *   and compare versions locally. No analytics, telemetry, persistent
 *   identifiers, license data, filenames, image metadata, or investigation
 *   data is ever transmitted, stored, or correlated.
 */

export { UpdateService } from './UpdateService';
export type { CheckOptions, CheckResult, UpdateStateListener } from './UpdateService';
export { UpdateScheduler, DEFAULT_TIMERS, INITIAL_CHECK_DELAY_MS, RECHECK_INTERVAL_MS } from './UpdateScheduler';
export type { SchedulerTimers, ScheduleOptions, Tick } from './UpdateScheduler';
export { TauriUpdaterBackend } from './UpdateBackend';
export type { UpdaterBackend, ProgressCallback } from './UpdateBackend';
export {
  UpdateError,
  UpdateErrorCode,
  makeUpdateError,
  mapPluginError,
} from './UpdateError';
export {
  ALLOWED_TRANSITIONS,
  IDLE_STATE,
  InvalidTransitionError,
  assertTransition,
  canTransition,
  errorState,
} from './UpdateState';
export type { UpdateInfo, UpdateState, UpdateStateName, DownloadProgress } from './UpdateState';
export {
  UPDATE_CHANNELS,
  UPDATE_FEED_BASE_URL,
  getUpdateConfiguration,
  resolveFeedUrl,
} from './UpdateConfiguration';
export type { UpdateChannel, UpdateConfiguration } from './UpdateConfiguration';

import { UpdateService } from './UpdateService';
import { TauriUpdaterBackend } from './UpdateBackend';
import { UpdateScheduler } from './UpdateScheduler';

let singleton: UpdateService | null = null;

/** Factory used by the app and by tests that need a service over a custom backend. */
export function createUpdateService(backend = new TauriUpdaterBackend()): UpdateService {
  return new UpdateService({ backend, scheduler: new UpdateScheduler() });
}

/**
 * Lazily-created app-wide service instance. Intentionally minimal global
 * state: one service per process, created on first use.
 */
export function getUpdateService(): UpdateService {
  if (!singleton) {
    singleton = createUpdateService();
  }
  return singleton;
}

/** Test hook: clears the singleton so tests get a fresh service. */
export function resetUpdateService(): void {
  singleton?.stopAutomaticChecks();
  singleton = null;
}
