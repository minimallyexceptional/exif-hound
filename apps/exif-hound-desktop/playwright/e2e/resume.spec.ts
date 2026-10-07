import { test, expect } from '@playwright/test';
import * as fs from 'node:fs';
import initSqlJs from 'sql.js';
import {
  InvestigationArchiveService,
  createSqlJsProvider,
  fflateZipper,
  SessionState,
} from '../../../../packages/investigation-archive/dist/index.js';
import { bootApp } from '../support/app';
import { FIXTURE_IMAGES } from '../support/fixtures';

/**
 * Builds a real .investigation archive in Node (via the package) and feeds it
 * to the app through the mocked fs read_file command, exercising the full
 * resume pipeline end to end.
 */
async function buildArchiveBytes(options: {
  viewMode?: string;
  showRoute?: boolean;
  investigationTool?: string | null;
  importRaw?: { type: 'kml' | 'csv'; data: string } | null;
} | undefined = {}): Promise<Uint8Array> {
  const SQL = await initSqlJs();
  const service = new InvestigationArchiveService({
    dbProvider: createSqlJsProvider(SQL),
    zipper: fflateZipper,
  });
  const images = [FIXTURE_IMAGES.fullExif, FIXTURE_IMAGES.noGps].map((fixture, index) => ({
    fileName: fixture.name,
    bytes: new Uint8Array(fs.readFileSync(fixture.absolutePath)),
    hasImage: true,
    exif:
      index === 0
        ? { latitude: 51.5, longitude: -0.127778, cameraMake: 'TestCam', cameraModel: 'Hound-1' }
        : { cameraMake: 'TestCam', cameraModel: 'Hound-2' },
  }));
  const session: SessionState = {
    viewMode: options.viewMode ?? 'map',
    showRoute: options.showRoute ?? false,
    investigationTool: options.investigationTool ?? null,
    importType: options.importRaw?.type ?? null,
    importData: options.importRaw?.data ?? null,
  };
  const saved = await service.save({
    name: 'E2E Resumed Case',
    createdAt: new Date('2024-06-15T10:30:00.000Z'),
    savedAt: new Date('2024-06-15T11:00:00.000Z'),
    appVersion: '2.6.6',
    session,
    images,
  });
  return saved.bytes;
}

const RECENT_SEED = {
  path: '/tmp/exif-hound-e2e/resumed-case.investigation',
  name: 'E2E Resumed Case',
  lastOpenedAt: Date.now(),
};

test.describe('resume from the splash screen', () => {
  test('resumes a recent investigation with images, metadata and no re-extraction', async ({ page }) => {
    const bytes = await buildArchiveBytes();
    await bootApp(page, {
      skipSplash: false,
      localStorage: { 'exifhound.recentInvestigations': JSON.stringify([RECENT_SEED]) },
      commands: {
        'plugin:fs|read_file': Array.from(bytes),
      },
    });

    const entry = page.getByTestId('recent-investigation-entry').first();
    await expect(entry).toContainText('E2E Resumed Case');
    await entry.click();

    // App shell with both restored images, immediately processed.
    await expect(page.getByRole('heading', { name: 'Exif Hound', exact: true })).toBeVisible();
    for (const fixture of [FIXTURE_IMAGES.fullExif, FIXTURE_IMAGES.noGps]) {
      const item = page.locator(`[data-testid="gallery-item"][data-file-name="${fixture.name}"]`);
      await expect(item).toHaveCount(1);
      await expect(item).toHaveAttribute('data-processing', 'false');
    }
  });

  test('restores investigation view and selected tool', async ({ page }) => {
    const bytes = await buildArchiveBytes({
      viewMode: 'investigation',
      investigationTool: 'timeline',
    });
    await bootApp(page, {
      skipSplash: false,
      localStorage: { 'exifhound.recentInvestigations': JSON.stringify([RECENT_SEED]) },
      commands: {
        'plugin:fs|read_file': Array.from(bytes),
      },
    });

    await page.getByTestId('recent-investigation-entry').first().click();

    await expect(page.getByRole('heading', { name: 'Investigation' })).toBeVisible();
    await expect(page.getByText('Timeline Analysis')).toBeVisible();
  });

  test('opens an investigation via the open dialog', async ({ page }) => {
    const bytes = await buildArchiveBytes();
    await bootApp(page, {
      skipSplash: false,
      commands: {
        'plugin:dialog|open': RECENT_SEED.path,
        'plugin:fs|read_file': Array.from(bytes),
      },
    });

    await page.getByRole('button', { name: 'Open investigation…' }).click();
    await expect(page.getByRole('heading', { name: 'Exif Hound', exact: true })).toBeVisible();
    await expect(
      page.locator(`[data-testid="gallery-item"][data-file-name="${FIXTURE_IMAGES.fullExif.name}"]`)
    ).toHaveAttribute('data-processing', 'false');
  });

  test('a foreign file surfaces an error and keeps the splash', async ({ page }) => {
    await bootApp(page, {
      skipSplash: false,
      commands: {
        'plugin:dialog|open': '/tmp/exif-hound-e2e/not-an-archive.investigation',
        'plugin:fs|read_file': Array.from(new TextEncoder().encode('definitely not a zip')),
      },
    });

    await page.getByRole('button', { name: 'Open investigation…' }).click();
    await expect(page.getByRole('alert')).toContainText(/not a valid|unreadable/i);
    await expect(page.getByRole('button', { name: 'Open investigation…' })).toBeVisible();
    await expect(page.getByTestId('splash-logomark')).toBeVisible();
  });

  test('cancelling the open dialog is a silent no-op', async ({ page }) => {
    await bootApp(page, {
      skipSplash: false,
      commands: {
        'plugin:dialog|open': null, // user cancelled
      },
    });

    await page.getByRole('button', { name: 'Open investigation…' }).click();
    await expect(page.getByRole('button', { name: 'Open investigation…' })).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('an unreadable recent entry surfaces an error and keeps the splash', async ({ page }) => {
    await bootApp(page, {
      skipSplash: false,
      localStorage: { 'exifhound.recentInvestigations': JSON.stringify([RECENT_SEED]) },
      commands: {
        // Rejecting loudly = the file could not be read (missing on disk).
        'plugin:fs|read_file': { __reject: 'No such file or directory' },
      },
    });

    await page.getByTestId('recent-investigation-entry').first().click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByTestId('splash-logomark')).toBeVisible();
  });
});