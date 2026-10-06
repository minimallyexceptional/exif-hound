import { isTauriEnvironment } from '../../utils/fileSystem';

describe('isTauriEnvironment', () => {
  const originalInternals = (window as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
  const originalIpc = (window as { __TAURI_IPC__?: unknown }).__TAURI_IPC__;
  const originalTauri = (window as { __TAURI__?: unknown }).__TAURI__;

  afterEach(() => {
    const win = window as unknown as Record<string, unknown>;
    if (originalInternals !== undefined) win.__TAURI_INTERNALS__ = originalInternals;
    else delete win.__TAURI_INTERNALS__;
    if (originalIpc !== undefined) win.__TAURI_IPC__ = originalIpc;
    else delete win.__TAURI_IPC__;
    if (originalTauri !== undefined) win.__TAURI__ = originalTauri;
    else delete win.__TAURI__;
  });

  it('detects Tauri v2 via __TAURI_INTERNALS__ (injected without withGlobalTauri)', () => {
    (window as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ = {};
    expect(isTauriEnvironment()).toBe(true);
  });

  it('returns false in a plain browser (no Tauri globals)', () => {
    expect(isTauriEnvironment()).toBe(false);
  });

  it('still honors legacy globals when present', () => {
    (window as { __TAURI__?: unknown }).__TAURI__ = {};
    expect(isTauriEnvironment()).toBe(true);
  });
});