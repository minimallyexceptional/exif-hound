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

export interface BootOptions {
  commands?: Record<string, unknown>;
  localStorage?: Record<string, string>;
  geocoding?: 'success' | 'error' | 'none';
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

  const commands = { 'plugin:app|version': APP_VERSION, 'plugin:updater|check': null, ...options.commands };
  await page.addInitScript(({ registeredCommands, storageSeed }) => {
    const handlers = new Map(Object.entries(registeredCommands));
    const calls: string[] = [];
    const callsDetailed: Array<{ command: string; args: unknown }> = [];
    let callbackId = 0;
    const callbacks = new Map<number, unknown>();
    const invoke = (cmd: string, args?: unknown): Promise<unknown> => {
      calls.push(cmd);
      callsDetailed.push({ command: cmd, args });
      const handler = handlers.get(cmd);
      if (handler === undefined) return Promise.reject(new Error(`[tauri-mock] no canned response registered for command "${cmd}"`));
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
    };
    const w = window as unknown as {
      __tauriMock: { registerCommand: (cmd: string, result: unknown) => void; clearCommands: () => void; calls: string[]; callsDetailed: Array<{ command: string; args: unknown }> };
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

  await page.goto('/');
  if (options.skipSplash !== false) {
    await page.getByRole('button', { name: 'Start new investigation' }).click();
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
    __tauriMock: { calls: string[]; callsDetailed: Array<{ command: string; args: unknown }>; registerCommand: (cmd: string, result: unknown) => void };
    __savePickerCalls: Array<{ suggestedName: string; types: { accept: Record<string, string[]> } }>;
    __lastSaveWritable: { content: string };
    __clipboardWrites: string[];
  }
}
