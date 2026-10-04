/**
 * In-browser mock of the Tauri v2 bridge for Cypress E2E tests.
 *
 * Installed via `cy.visit(..., { onBeforeLoad: win => installTauriMock(win) })`
 * so the mock exists before any application script runs — the app checks
 * `window.__TAURI__` synchronously while booting.
 *
 * All `@tauri-apps/api` and `@tauri-apps/plugin-*` JS packages funnel their
 * native calls through `window.__TAURI_INTERNALS__.invoke(cmd, args)`, so one
 * stub covers them all. Tests register canned responses per command:
 *
 *   installTauriMock(win, { 'plugin:app|version': '2.5.2' })
 *   // or later, from a test:
 *   cy.window().its('__tauriMock').invoke('registerCommand', 'plugin:app|version', '9.9.9')
 *
 * Unknown commands reject loudly by default so tests fail fast on
 * unexpected native access instead of hanging.
 */

export type CommandHandler =
  | unknown // resolved as-is
  | ((args: unknown) => unknown) // called with the invoke args
  | Error; // rejected

export interface TauriMock {
  /** Register (or replace) the canned result for a Tauri command. */
  registerCommand: (cmd: string, result: CommandHandler) => void;
  /** Drop all registered commands. */
  clearCommands: () => void;
  /** Commands that have been invoked since install, in order. */
  calls: string[];
}

export function installTauriMock(
  win: Window & { __tauriMock?: TauriMock },
  commands: Record<string, CommandHandler> = {}
): TauriMock {
  const handlers = new Map<string, CommandHandler>(Object.entries(commands));
  const calls: string[] = [];
  let callbackId = 0;
  const callbacks = new Map<number, unknown>();

  const invoke = (cmd: string, args?: unknown): Promise<unknown> => {
    calls.push(cmd);
    const handler = handlers.get(cmd);
    if (handler === undefined) {
      return Promise.reject(
        new Error(`[tauri-mock] no canned response registered for command "${cmd}"`)
      );
    }
    if (handler instanceof Error) {
      return Promise.reject(handler);
    }
    if (typeof handler === 'function') {
      return Promise.resolve((handler as (a: unknown) => unknown)(args));
    }
    return Promise.resolve(handler);
  };

  const mock: TauriMock = {
    registerCommand(cmd, result) {
      handlers.set(cmd, result);
    },
    clearCommands() {
      handlers.clear();
    },
    calls,
  };

  const aut = win as unknown as {
    __tauriMock?: TauriMock;
    __TAURI_INTERNALS__: unknown;
    __TAURI__: unknown;
    __TAURI_IPC__: unknown;
  };

  aut.__tauriMock = mock;

  // The seam used by every @tauri-apps/* package.
  aut.__TAURI_INTERNALS__ = {
    invoke,
    transformCallback: (callback?: (result: unknown) => void) => {
      const id = callbackId++;
      callbacks.set(id, callback);
      return id;
    },
    convertFileSrc: (filePath: string) => `asset://localhost/${filePath}`,
    metadata: {
      currentWindow: { label: 'main' },
      currentWebview: { label: 'main' },
      currentWebviewWindow: { label: 'main' },
    },
    plugins: {},
  };

  // Legacy/availability shims. The app's TauriProvider treats any of these
  // as "Tauri is present"; dialog/fs markers skip its plugin-import retries.
  aut.__TAURI__ = { invoke, dialog: {}, fs: {} };
  aut.__TAURI_IPC__ = () => undefined;

  return mock;
}
