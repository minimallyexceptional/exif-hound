import { expect, type Page } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import pkg from '../../package.json' with { type: 'json' };
import type { ExifFixture } from './fixtures';

export const APP_VERSION: string = pkg.version;
export const MOCK_UPDATE = {
  rid: 1,
  version: '9.9.9',
  date: '2026-01-01T00:00:00Z',
  body: 'Automated test release notes',
};

const TILE_IMAGE = fileURLToPath(new URL('../fixtures/tile.png', import.meta.url));
export const MOCK_REVERSE_GEOCODE = {
  display_name: 'Charing Cross Rd 1, Westminster, London, England, WC2H 0NN, United Kingdom',
  address: { road: 'Charing Cross Rd', city: 'London', state: 'England', country: 'United Kingdom', postcode: 'WC2H 0NN' },
};

/**
 * In-memory filesystem emulation for plugin:fs commands. The seed is
 * serializable state; the handler logic is installed in-page by bootApp.
 * Files are base64-encoded so binary content can cross the init-script
 * boundary.
 */
export interface FsEmulation {
  /** base64-encoded file contents by absolute path. */
  files?: Record<string, string>;
  /** Known directory paths. */
  dirs?: string[];
}

export interface BootOptions {
  commands?: Record<string, unknown>;
  localStorage?: Record<string, string>;
  geocoding?: 'success' | 'error' | 'none';
  /** Emulate plugin:fs against an in-memory filesystem (project flows). */
  fsEmulation?: FsEmulation;
  /**
   * Start past the splash screen by clicking "Start new investigation" so
   * specs land in the app shell directly (default, preserves legacy specs).
   * Set false to assert on the splash entrypoint itself.
   */
  skipSplash?: boolean;
}

export async function bootApp(page: Page, options: BootOptions = {}): Promise<void> {
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return route.continue();
    if (url.hostname.includes('tile')) return route.fulfill({ path: TILE_IMAGE, contentType: 'image/png' });
    if (url.hostname === 'nominatim.openstreetmap.org') {
      if (options.geocoding === 'none') return route.abort();
      return route.fulfill({
        status: options.geocoding === 'error' ? 500 : 200,
        contentType: 'application/json',
        body: JSON.stringify(options.geocoding === 'error' ? { error: 'mock geocoder error' } : MOCK_REVERSE_GEOCODE),
      });
    }
    return route.abort();
  });

  const commands = {
    'plugin:app|version': APP_VERSION,
    'plugin:updater|check': null,
    // Default parent folder for bootApp's implicit project creation.
    'plugin:dialog|open': '/tmp/e2e-projects',
    resolve_project_folder: '__selected_folder__',
    list_workflow_templates: [],
    save_workflow_template: null,
    ...options.commands,
  };
  // The active app requires a bound project, so the implicit boot creates one
  // through the create-project flow (fs emulation backs the folder writes).
  const fsEmulation = options.fsEmulation ?? { dirs: [], files: {} };
  await page.addInitScript(({ registeredCommands, storageSeed }) => {
    const handlers = new Map(Object.entries(registeredCommands));
    const calls: string[] = [];
    const callsDetailed: Array<{ command: string; args: unknown; headers?: Record<string, string> }> = [];
    let callbackId = 0;
    const callbacks = new Map<number, unknown>();
    const invoke = (cmd: string, args?: unknown, options?: { headers?: Record<string, string> }): Promise<unknown> => {
      calls.push(cmd);
      callsDetailed.push({ command: cmd, args, headers: options?.headers });
      if (options?.headers?.path !== undefined) {
        mock.writePath = decodeURIComponent(options.headers.path);
      }
      const handler = handlers.get(cmd);
      if (handler === undefined) return Promise.reject(new Error(`[tauri-mock] no canned response registered for command "${cmd}"`));
      if (cmd === 'resolve_project_folder' && handler === '__selected_folder__') {
        return Promise.resolve((args as { path: string }).path);
      }
      if (handler instanceof Error) return Promise.reject(handler);
      if (handler && typeof handler === 'object' && '__reject' in handler) {
        return Promise.reject(new Error(String((handler as { __reject: unknown }).__reject)));
      }
      if (typeof handler === 'function') return Promise.resolve((handler as (a: unknown) => unknown)(args));
      return Promise.resolve(handler);
    };
    const mock = {
      registerCommand: (cmd: string, result: unknown) => handlers.set(cmd, result),
      clearCommands: () => handlers.clear(),
      calls,
      callsDetailed,
      writePath: undefined as string | undefined,
    };
    const w = window as unknown as {
      __tauriMock: { registerCommand: (cmd: string, result: unknown) => void; clearCommands: () => void; calls: string[]; callsDetailed: Array<{ command: string; args: unknown; headers?: Record<string, string> }>; writePath?: string };
      __TAURI_INTERNALS__: unknown;
      __TAURI__: unknown;
      __TAURI_IPC__: () => void;
      __savePickerCalls: Array<{ suggestedName: string; types: { accept: Record<string, string[]> } }>;
      __lastSaveWritable: { content: string; write: (content: string) => Promise<void>; close: () => Promise<void> };
      __clipboardWrites: string[];
      showSaveFilePicker: (options: { suggestedName: string; types: { accept: Record<string, string[]> } }) => Promise<{ createWritable: () => Promise<unknown> }>;
    };
    w.__tauriMock = mock;
    w.__TAURI_INTERNALS__ = {
      invoke,
      transformCallback: (callback?: (result: unknown) => void) => {
        const id = callbackId++;
        callbacks.set(id, callback);
        return id;
      },
      convertFileSrc: (filePath: string) => `asset://localhost/${filePath}`,
      metadata: { currentWindow: { label: 'main' }, currentWebview: { label: 'main' }, currentWebviewWindow: { label: 'main' } },
      plugins: {},
    };
    w.__TAURI__ = { invoke, dialog: {}, fs: {} };
    w.__TAURI_IPC__ = () => undefined;
    w.__savePickerCalls = [];
    w.__clipboardWrites = [];
    w.showSaveFilePicker = (pickerOptions: { suggestedName: string; types: { accept: Record<string, string[]> } }) => {
      w.__savePickerCalls.push(pickerOptions);
      const writable = {
        content: '',
        write(content: string) { writable.content += String(content); return Promise.resolve(); },
        close() { return Promise.resolve(); },
      };
      w.__lastSaveWritable = writable;
      return Promise.resolve({ createWritable: () => Promise.resolve(writable) });
    };
    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: { writeText: (text: string) => { w.__clipboardWrites.push(text); return Promise.resolve(); }, readText: () => Promise.resolve('') },
    });
    for (const [key, value] of Object.entries(storageSeed)) window.localStorage.setItem(key, value);
  }, { registeredCommands: commands, storageSeed: options.localStorage ?? {} });

  {
    await page.addInitScript((seed) => {
      const w = window as unknown as { __tauriMock: { registerCommand: (cmd: string, result: unknown) => void } };
      const files = new Map<string, number[]>(Object.entries(seed.files ?? {}).map(([path, b64]) => [path, Array.from(atob(b64)).map((c) => c.charCodeAt(0))]));
      const dirs = new Set<string>(seed.dirs ?? []);
      w.__tauriMock.registerCommand('plugin:fs|exists', (args: { path?: string } | undefined) => {
        const p = args?.path ?? '';
        return files.has(p) || dirs.has(p);
      });
      w.__tauriMock.registerCommand('plugin:fs|mkdir', (args: { path?: string } | undefined) => {
        dirs.add(args?.path ?? '');
        return null;
      });
      // write_file carries the bytes as invoke args; the path rides in IPC
      // headers (see plugin-fs writeFile) — handled by the invoke wrapper
      // via window.__tauriMock.writePath.
      w.__tauriMock.registerCommand('plugin:fs|write_file', (data: unknown) => {
        const path = (window as unknown as { __tauriMock: { writePath?: string } }).__tauriMock.writePath;
        if (!path) throw new Error('[tauri-mock] write_file without a path header');
        files.set(path, Array.isArray(data) ? (data as number[]) : []);
        return null;
      });
      w.__tauriMock.registerCommand('plugin:fs|read_file', (args: { path?: string } | undefined) => {
        const data = files.get(args?.path ?? '');
        if (data === undefined) throw new Error(`ENOENT: ${args?.path}`);
        return data;
      });
      w.__tauriMock.registerCommand('plugin:fs|remove', (args: { path?: string } | undefined) => {
        files.delete(args?.path ?? '');
        return null;
      });
    }, { files: fsEmulation.files ?? {}, dirs: fsEmulation.dirs ?? [] });
  }

  await page.goto('/');
  if (options.skipSplash !== false) {
    await page.getByRole('button', { name: 'Start new investigation' }).click();
    await page.getByLabel('Project name').fill('E2E Project');
    await page.getByRole('button', { name: 'Choose parent folder' }).click();
    await page.getByRole('button', { name: 'Create project' }).click();
    await expect(page.getByRole('heading', { name: 'Exif Hound', exact: true })).toBeVisible();
  }
}

export async function uploadImages(page: Page, fixtures: ExifFixture[]): Promise<void> {
  await page.locator('#headerFileInput').setInputFiles(fixtures.map(({ absolutePath }) => absolutePath));
  const counts = new Map<string, number>();
  fixtures.forEach(({ name }) => counts.set(name, (counts.get(name) ?? 0) + 1));
  for (const [name, count] of counts) {
    const items = page.locator(`[data-testid="gallery-item"][data-file-name="${name}"]`);
    await expect(items).toHaveCount(count);
    for (let index = 0; index < count; index++) await expect(items.nth(index)).toHaveAttribute('data-processing', 'false');
  }
}

export async function openSettings(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Open settings' }).click();
  await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible();
}

export async function closeSettings(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Close settings' }).click();
  await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toHaveCount(0);
}

export async function switchView(page: Page, name: 'Map View' | 'List View' | 'Investigation'): Promise<void> {
  await page.locator('header').getByRole('button', { name, exact: true }).click();
}

declare global {
  interface Window {
    __tauriMock: { calls: string[]; callsDetailed: Array<{ command: string; args: unknown; headers?: Record<string, string> }>; writePath?: string; registerCommand: (cmd: string, result: unknown) => void };
    __savePickerCalls: Array<{ suggestedName: string; types: { accept: Record<string, string[]> } }>;
    __lastSaveWritable: { content: string };
    __clipboardWrites: string[];
  }
}
