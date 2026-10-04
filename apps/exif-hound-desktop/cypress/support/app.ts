/**
 * Shared application boot helper for E2E specs.
 *
 * `bootApp()` is the one way specs start the app. It installs the Tauri mock
 * with the app's standard command registrations, stubs `showSaveFilePicker`
 * and the clipboard, and sets up network intercepts so the suite never
 * touches a real network (geocoding + map tiles).
 *
 * Exposed AUT-window handles specs can assert against:
 *   win.__tauriMock          — TauriMock (see tauri-mock.ts)
 *   win.__savePickerCalls    — arguments of every showSaveFilePicker call
 *   win.__lastSaveWritable   — { content } of the most recent save
 *   win.__clipboardWrites    — strings passed to clipboard.writeText
 */

import { installTauriMock, CommandHandler, TauriMock } from './tauri-mock';
import pkg from '../../package.json';

export const APP_VERSION: string = pkg.version;

/** Nominatim response served for every reverse-geocode request. */
export const MOCK_REVERSE_GEOCODE = {
  display_name: 'Charing Cross Rd 1, Westminster, London, England, WC2H 0NN, United Kingdom',
  address: {
    road: 'Charing Cross Rd',
    city: 'London',
    state: 'England',
    country: 'United Kingdom',
    postcode: 'WC2H 0NN',
  },
};

export interface BootOptions {
  /** Extra/overriding canned Tauri command responses. */
  commands?: Record<string, CommandHandler>;
  /** localStorage entries to seed before the app boots (e.g. theme). */
  localStorage?: Record<string, string>;
  /**
   * Reverse-geocode stub behavior: 'success' (default) resolves with
   * MOCK_REVERSE_GEOCODE, 'error' returns HTTP 500, 'none' leaves the
   * catch-all external-host intercept to fail the request loudly.
   */
  geocoding?: 'success' | 'error' | 'none';
}

/** Mocked "update available" payload for plugin:updater|check. */
export const MOCK_UPDATE = {
  rid: 1,
  version: '9.9.9',
  date: '2026-01-01T00:00:00Z',
  body: 'Automated test release notes',
};

/** Standard command registrations every spec boots with. */
export function standardCommands(): Record<string, CommandHandler> {
  return {
    'plugin:app|version': APP_VERSION,
    // Up to date by default; updater spec overrides with MOCK_UPDATE.
    'plugin:updater|check': null,
  };
}

function installBrowserStubs(win: Cypress.AUTWindow): void {
  const aut = win as unknown as {
    __savePickerCalls?: unknown[];
    __lastSaveWritable?: { content: string };
    __clipboardWrites?: string[];
  };
  aut.__savePickerCalls = [];
  aut.__clipboardWrites = [];

  (win as unknown as {
    showSaveFilePicker?: (options: unknown) => Promise<unknown>;
  }).showSaveFilePicker = (options: unknown) => {
    aut.__savePickerCalls!.push(options);
    const writable = {
      content: '',
      write: (content: string) => {
        writable.content += String(content);
        return Promise.resolve();
      },
      close: () => Promise.resolve(),
    };
    aut.__lastSaveWritable = writable;
    return Promise.resolve({ createWritable: () => Promise.resolve(writable) });
  };

  const clipboard = {
    writeText: (text: string) => {
      aut.__clipboardWrites!.push(text);
      return Promise.resolve();
    },
    readText: () => Promise.resolve(''),
  };
  Object.defineProperty(win.navigator, 'clipboard', {
    value: clipboard,
    configurable: true,
  });
}

function installNetworkStubs(options: BootOptions): void {
  // Registered first => lower priority than the specific stubs below.
  // Same-origin traffic (the app itself) passes through untouched; any other
  // external host fails loudly instead of leaking network. Cypress matches
  // http and https interchangeably, so the host check is what protects the
  // app's own requests from this catch-all.
  cy.intercept(/^https?:\/\//, (req) => {
    const { hostname } = new URL(req.url);
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      req.continue();
      return;
    }
    req.reply({ statusCode: 404, body: '' });
  }).as('external-host');

  // Map tiles (Leaflet + settings previews) — serve the offline tile.
  cy.intercept('https://*tile*/**', {
    statusCode: 200,
    headers: { 'content-type': 'image/png' },
    fixture: 'tile.png',
  }).as('map-tiles');

  if (options.geocoding === 'error') {
    cy.intercept('https://nominatim.openstreetmap.org/**', {
      statusCode: 500,
      body: 'mock geocoder error',
    }).as('reverse-geocode');
  } else if (options.geocoding !== 'none') {
    cy.intercept('https://nominatim.openstreetmap.org/**', {
      statusCode: 200,
      body: MOCK_REVERSE_GEOCODE,
    }).as('reverse-geocode');
  }
}

/**
 * Boot the app with a fully controlled environment. Equivalent to the
 * previous `cy.visit('/', { onBeforeLoad })` pattern, standardized.
 */
export function bootApp(options: BootOptions = {}): void {
  installNetworkStubs(options);

  cy.visit('/', {
    onBeforeLoad(win) {
      installTauriMock(win, { ...standardCommands(), ...options.commands });
      installBrowserStubs(win);
      for (const [key, value] of Object.entries(options.localStorage ?? {})) {
        win.localStorage.setItem(key, value);
      }
    },
  });

  // The app shell is interactive once the header title renders.
  cy.get('h1').contains('Exif Hound');
}

/** Access the AUT window's Tauri mock. */
export function tauriMock(): Cypress.Chainable<TauriMock> {
  return cy.window().its('__tauriMock');
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /** Boot the app via the shared helper. */
      bootApp(options?: BootOptions): void;
    }
  }
}

Cypress.Commands.add('bootApp', (options?: BootOptions) => bootApp(options));