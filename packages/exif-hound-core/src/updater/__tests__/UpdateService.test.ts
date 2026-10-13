import { UpdateService } from '../UpdateService';
import { UpdateErrorCode } from '../UpdateError';
import { FakeUpdaterBackend, UPDATE_2_7_0 } from './FakeUpdaterBackend';

function makeService(backend = new FakeUpdaterBackend()) {
  // The default constructor creates a real (never-started) UpdateScheduler;
  // these tests only call startAutomaticChecks when explicitly testing it.
  const service = new UpdateService({ backend });
  return { service, backend };
}

describe('UpdateService', () => {
  // ------------------------------------------------------------ silent checks

  it('automatic check with no update returns silently to idle', async () => {
    const { service, backend } = makeService();
    backend.nextCheck = null;
    await expect(service.check({ silent: true })).resolves.toBe('current');
    expect(service.getState().name).toBe('idle');
  });

  it('automatic check that finds an update exposes it non-disruptively', async () => {
    const { service, backend } = makeService();
    backend.nextCheck = UPDATE_2_7_0;
    await expect(service.check({ silent: true })).resolves.toBe('available');
    expect(service.getState()).toMatchObject({ name: 'available', update: UPDATE_2_7_0 });
  });

  it('automatic check failures are silent: back to idle, app keeps working', async () => {
    const { service, backend } = makeService();
    backend.checkError = new Error('DNS failure');
    await expect(service.check({ silent: true })).resolves.toBe('failed');
    expect(service.getState().name).toBe('idle');
    expect(service.lastSilentError?.code).toBe(UpdateErrorCode.CheckFailed);
  });

  it('manual check failures surface a visible error', async () => {
    const { service, backend } = makeService();
    backend.checkError = new Error('connection refused');
    await expect(service.check({ silent: false })).resolves.toBe('failed');
    const state = service.getState();
    expect(state.name).toBe('error');
    expect(state.errorVisible).toBe(true);
    expect(state.error?.userMessage).toContain('Unable to check for updates');
    service.dismiss();
    expect(service.getState().name).toBe('idle');
  });

  it('manual check confirming no update shows CURRENT, dismissible', async () => {
    const { service, backend } = makeService();
    backend.nextCheck = null;
    await expect(service.check({ silent: false })).resolves.toBe('current');
    expect(service.getState().name).toBe('current');
    service.dismiss();
    expect(service.getState().name).toBe('idle');
  });

  it('notifies subscribers on every transition', async () => {
    const { service, backend } = makeService();
    backend.nextCheck = UPDATE_2_7_0;
    const seen: string[] = [];
    service.subscribe(state => seen.push(state.name));
    await service.check({ silent: true });
    expect(seen).toEqual(['idle', 'checking', 'available']);
  });

  it('does not run overlapping checks', async () => {
    const backend = new FakeUpdaterBackend();
    const service = new UpdateService({ backend });
    let invocations = 0;
    let release!: () => void;
    backend.check = () => {
      invocations++;
      return new Promise<null>(resolve => {
        release = () => resolve(null);
      });
    };
    const first = service.check({ silent: true });
    const second = await service.check({ silent: true });
    expect(second).toBe('failed');
    release();
    await expect(first).resolves.toBe('current');
    expect(invocations).toBe(1);
  });

  it('disables itself permanently when the updater is unavailable (dev/web builds)', async () => {
    const { service, backend } = makeService();
    backend.configured = false;
    await expect(service.check({ silent: false })).resolves.toBe('failed');
    expect(service.getState().error?.code).toBe(UpdateErrorCode.Unavailable);
    await expect(service.check({ silent: true })).resolves.toBe('failed');
  });

  // ---------------------------------------------------------------- download

  it('downloads with progress and reaches ready-to-install', async () => {
    const { service, backend } = makeService();
    backend.nextCheck = UPDATE_2_7_0;
    await service.check({ silent: true });

    const progresses: number[] = [];
    await service.download(p => progresses.push(p.receivedBytes));
    expect(progresses).toEqual([0, 200, 400, 600, 800, 1000]);

    const state = service.getState();
    expect(state.name).toBe('ready-to-install');
    expect(state.progress).toBeUndefined();
    expect(state.update?.version).toBe('2.7.0');
  });

  it('refuses to download without an available update', async () => {
    const { service } = makeService();
    await expect(service.download()).rejects.toMatchObject({
      code: UpdateErrorCode.DownloadFailed,
    });
    expect(service.getState().name).toBe('idle');
  });

  it('maps download failures to a visible error state', async () => {
    const { service, backend } = makeService();
    backend.nextCheck = UPDATE_2_7_0;
    await service.check({ silent: true });
    backend.downloadError = new Error('network interrupted mid-transfer');
    await expect(service.download()).rejects.toMatchObject({
      code: UpdateErrorCode.DownloadFailed,
    });
    const state = service.getState();
    expect(state.name).toBe('error');
    expect(state.errorVisible).toBe(true);
  });

  it('rejects tampered artifacts as VERIFY_FAILED and never installs them', async () => {
    const { service, backend } = makeService();
    backend.nextCheck = UPDATE_2_7_0;
    await service.check({ silent: true });
    // The Rust updater surfaces signature mismatch errors during download.
    backend.downloadError = new Error('signature verification failed');
    await expect(service.download()).rejects.toMatchObject({
      code: UpdateErrorCode.VerifyFailed,
    });
    expect(backend.calls.install).toBe(0);
    expect(service.getState().error?.userMessage).toContain('security verification');
  });

  // ----------------------------------------------------------------- install

  it('installAndRestart installs then relaunches', async () => {
    const { service, backend } = makeService();
    backend.nextCheck = UPDATE_2_7_0;
    await service.check({ silent: true });
    await service.download();
    await service.installAndRestart();
    expect(backend.calls.install).toBe(1);
    expect(backend.calls.relaunch).toBe(1);
    expect(service.getState().name).toBe('restarting');
  });

  it('installAndRestart refuses without a downloaded update', async () => {
    const { service } = makeService();
    await expect(service.installAndRestart()).rejects.toMatchObject({
      code: UpdateErrorCode.InstallFailed,
    });
  });

  it('install failures map to INSTALL_FAILED and leave the app intact', async () => {
    const { service, backend } = makeService();
    backend.nextCheck = UPDATE_2_7_0;
    await service.check({ silent: true });
    await service.download();
    backend.installError = new Error('installer exited with code 1');
    await expect(service.installAndRestart()).rejects.toMatchObject({
      code: UpdateErrorCode.InstallFailed,
    });
    expect(backend.calls.relaunch).toBe(0);
    expect(service.getState().name).toBe('error');
  });

  it('reports a relaunch failure without claiming the installation was unchanged', async () => {
    const { service, backend } = makeService();
    backend.nextCheck = UPDATE_2_7_0;
    await service.check({ silent: true });
    await service.download();
    backend.relaunchError = new Error('process relaunch failed');

    await expect(service.installAndRestart()).rejects.toMatchObject({
      code: UpdateErrorCode.RelaunchFailed,
    });
    expect(backend.calls.install).toBe(1);
    expect(service.getState().name).toBe('error');
    expect(service.getState().error?.userMessage).toContain('was installed');
  });

  it('keeps the discovered update across download', async () => {
    const { service, backend } = makeService();
    backend.nextCheck = UPDATE_2_7_0;
    await service.check({ silent: true });
    await service.download();
    // A silent re-check while ready must not lose the ready-to-install state:
    // downloads are single-flight and the state machine forbids re-checking
    // mid-flow, so verify the guard instead.
    await expect(service.check({ silent: true })).resolves.toBe('failed');
    expect(service.getState().name).toBe('ready-to-install');
  });

  it('preserves a downloaded update when a manual check is requested', async () => {
    const { service, backend } = makeService();
    backend.nextCheck = UPDATE_2_7_0;
    await service.check({ silent: true });
    await service.download();

    await expect(service.check({ silent: false })).resolves.toBe('failed');
    expect(service.getState()).toMatchObject({
      name: 'ready-to-install',
      update: UPDATE_2_7_0,
    });
    expect(backend.calls.check).toBe(1);
  });

  it('scheduler-driven automatic checks are a no-op when the updater is unavailable', () => {
    const { service, backend } = makeService();
    backend.configured = false;
    expect(() => service.startAutomaticChecks()).not.toThrow();
    expect(backend.calls.check).toBe(0);
  });
});
