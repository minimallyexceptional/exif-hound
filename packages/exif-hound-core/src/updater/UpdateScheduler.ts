/**
 * Update check scheduler.
 *
 * Conservative schedule: one check shortly after startup, then re-checks
 * roughly every 12 hours for very long sessions. Manual checks are handled
 * by the UI, not the scheduler. The scheduler never fires overlapping ticks
 * and never retries on failure (the next interval will).
 *
 * Timer functions are injectable so automated tests can drive the schedule
 * deterministically (or simply never call start()).
 */

export interface SchedulerTimers {
  setTimeout: (fn: () => void, ms: number) => unknown;
  clearTimeout: (handle: unknown) => void;
}

// The DOM/Node global timers satisfy this shape at runtime; cast the
// globals once so tests can inject their own implementations cleanly.
const globalTimers = globalThis as unknown as {
  setTimeout: (fn: () => void, ms: number) => unknown;
  clearTimeout: (handle: unknown) => void;
};

export const DEFAULT_TIMERS: SchedulerTimers = {
  setTimeout: (fn, ms) => globalTimers.setTimeout(fn, ms),
  clearTimeout: handle => globalTimers.clearTimeout(handle),
};

/** Default delay before the first (automatic) check after launch. */
export const INITIAL_CHECK_DELAY_MS = 10_000; // ~10 seconds
/** Default re-check interval for long-running sessions. */
export const RECHECK_INTERVAL_MS = 12 * 60 * 60 * 1000; // 12 hours

export interface ScheduleOptions {
  initialDelayMs?: number;
  intervalMs?: number;
}

export type Tick = () => void | Promise<void>;

export class UpdateScheduler {
  private timers: SchedulerTimers;
  private intervalHandle: unknown = null;
  private initialHandle: unknown = null;
  private running = false;
  private ticking = false;

  constructor(timers: SchedulerTimers = DEFAULT_TIMERS) {
    this.timers = timers;
  }

  isRunning(): boolean {
    return this.running;
  }

  /**
   * Schedules the first check after `initialDelayMs`, then re-checks every
   * `intervalMs`. If a tick is still in flight when the next interval
   * elapses, the overlapping tick is skipped (resilient to slow networks).
   */
  start(tick: Tick, options: ScheduleOptions = {}): void {
    this.stop();
    this.running = true;
    const { initialDelayMs = INITIAL_CHECK_DELAY_MS, intervalMs = RECHECK_INTERVAL_MS } = options;

    const guardedTick = () => {
      if (this.ticking) return;
      this.ticking = true;
      try {
        const result = tick();
        if (result instanceof Promise) {
          void result
            .catch(() => undefined)
            .finally(() => {
              this.ticking = false;
            });
          return;
        }
      } catch {
        // Ticks must be non-throwing; belt-and-braces so a scheduling bug
        // can never break the app. Errors belong inside the tick itself.
      }
      this.ticking = false;
    };

    this.initialHandle = this.timers.setTimeout(guardedTick, initialDelayMs);
    const scheduleNext = () => {
      guardedTick();
      if (this.running) {
        this.intervalHandle = this.timers.setTimeout(scheduleNext, intervalMs);
      }
    };
    this.intervalHandle = this.timers.setTimeout(scheduleNext, initialDelayMs + intervalMs);
  }

  /** Stops all pending checks. Safe to call any number of times. */
  stop(): void {
    this.running = false;
    if (this.initialHandle !== null) {
      this.timers.clearTimeout(this.initialHandle);
      this.initialHandle = null;
    }
    if (this.intervalHandle !== null) {
      this.timers.clearTimeout(this.intervalHandle);
      this.intervalHandle = null;
    }
  }
}
