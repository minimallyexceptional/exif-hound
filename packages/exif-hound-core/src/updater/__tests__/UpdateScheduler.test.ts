import { UpdateScheduler, SchedulerTimers, INITIAL_CHECK_DELAY_MS, RECHECK_INTERVAL_MS } from '../UpdateScheduler';

/**
 * Deterministic fake timer set: records scheduled callbacks with virtual
 * timestamps and fires them in order as `advance` is called.
 */
class FakeTimers implements SchedulerTimers {
  private nextId = 1;
  private scheduled = new Map<number, { fn: () => void; at: number }>();
  now = 0;

  setTimeout(fn: () => void, ms: number): unknown {
    const id = this.nextId++;
    this.scheduled.set(id, { fn, at: this.now + ms });
    return id;
  }

  clearTimeout(handle: unknown): void {
    this.scheduled.delete(handle as number);
  }

  /** Runs every callback scheduled within the next `ms` of virtual time. */
  advance(ms: number): void {
    const target = this.now + ms;
    // Loop so callbacks that schedule new work inside advance() are honored.
    for (;;) {
      const due = [...this.scheduled.entries()]
        .filter(([, s]) => s.at <= target)
        .sort((a, b) => a[1].at - b[1].at)[0];
      if (!due) break;
      const [id, s] = due;
      this.scheduled.delete(id);
      this.now = s.at;
      s.fn();
    }
    this.now = target;
  }

  get pendingCount(): number {
    return this.scheduled.size;
  }
}

describe('UpdateScheduler', () => {
  it('fires the initial check after ~10 seconds, then re-checks every 12 hours', () => {
    const timers = new FakeTimers();
    const scheduler = new UpdateScheduler(timers);
    const tick = jest.fn();
    scheduler.start(tick);

    expect(tick).not.toHaveBeenCalled();
    timers.advance(INITIAL_CHECK_DELAY_MS - 1);
    expect(tick).not.toHaveBeenCalled();
    timers.advance(1);
    expect(tick).toHaveBeenCalledTimes(1);

    timers.advance(RECHECK_INTERVAL_MS);
    expect(tick).toHaveBeenCalledTimes(2);
    timers.advance(RECHECK_INTERVAL_MS);
    expect(tick).toHaveBeenCalledTimes(3);
  });

  it('supports custom schedules (used by tests of the service)', () => {
    const timers = new FakeTimers();
    const scheduler = new UpdateScheduler(timers);
    const tick = jest.fn();
    scheduler.start(tick, { initialDelayMs: 100, intervalMs: 500 });

    timers.advance(100);
    expect(tick).toHaveBeenCalledTimes(1);
    timers.advance(500);
    expect(tick).toHaveBeenCalledTimes(2);
  });

  it('stop() cancels all pending checks', () => {
    const timers = new FakeTimers();
    const scheduler = new UpdateScheduler(timers);
    const tick = jest.fn();
    scheduler.start(tick, { initialDelayMs: 100, intervalMs: 500 });

    scheduler.stop();
    expect(scheduler.isRunning()).toBe(false);
    timers.advance(10_000);
    expect(tick).not.toHaveBeenCalled();
  });

  it('stop() is idempotent', () => {
    const timers = new FakeTimers();
    const scheduler = new UpdateScheduler(timers);
    scheduler.start(jest.fn());
    scheduler.stop();
    expect(() => scheduler.stop()).not.toThrow();
  });

  it('restart via start() replaces the previous schedule', () => {
    const timers = new FakeTimers();
    const scheduler = new UpdateScheduler(timers);
    const tick = jest.fn();
    scheduler.start(tick, { initialDelayMs: 10_000, intervalMs: 1000 });
    scheduler.start(tick, { initialDelayMs: 100, intervalMs: 500 });

    timers.advance(1000);
    expect(tick).toHaveBeenCalledTimes(2); // initial + first interval, old schedule gone
  });

  it('survives ticks that throw', () => {
    const timers = new FakeTimers();
    const scheduler = new UpdateScheduler(timers);
    const tick = jest.fn(() => {
      throw new Error('boom');
    });
    scheduler.start(tick, { initialDelayMs: 100, intervalMs: 1000 });

    expect(() => timers.advance(1200)).not.toThrow();
    expect(tick).toHaveBeenCalledTimes(2);
  });

  it('re-checks continue after a failed tick (resilient schedule)', () => {
    const timers = new FakeTimers();
    const scheduler = new UpdateScheduler(timers);
    const tick = jest.fn();
    scheduler.start(tick, { initialDelayMs: 100, intervalMs: 1000 });

    timers.advance(1200);
    expect(tick).toHaveBeenCalledTimes(2);
    expect(scheduler.isRunning()).toBe(true);
    expect(timers.pendingCount).toBeGreaterThan(0);
  });

  it('skips an interval while an asynchronous tick is still running', async () => {
    const timers = new FakeTimers();
    const scheduler = new UpdateScheduler(timers);
    let finish!: () => void;
    const tick = jest.fn(
      () => new Promise<void>(resolve => {
        finish = resolve;
      })
    );
    scheduler.start(tick, { initialDelayMs: 100, intervalMs: 1000 });

    timers.advance(100);
    expect(tick).toHaveBeenCalledTimes(1);
    timers.advance(1000);
    expect(tick).toHaveBeenCalledTimes(1);

    finish();
    await Promise.resolve();
    await Promise.resolve();
    timers.advance(1000);
    expect(tick).toHaveBeenCalledTimes(2);
  });
});
