import { test, expect } from '@playwright/test';
import * as fs from 'node:fs';
import initSqlJs from 'sql.js';
import {
  InvestigationArchiveService,
  createSqlJsProvider,
  fflateZipper,
  MANIFEST_ENTRY,
} from '../../../../packages/investigation-archive/dist/index.js';
import { bootApp, uploadImages } from '../support/app';
import { FIXTURE_IMAGES, ExifFixture } from '../support/fixtures';

// The save dialog resolves to this path; the fs mock captures the bytes.
const SAVE_PATH = '/tmp/exif-hound-e2e/case-042.investigation';

const fixtures: ExifFixture[] = [FIXTURE_IMAGES.fullExif, FIXTURE_IMAGES.noGps];

test('saving writes a valid .investigation archive and records it as recent', async ({ page }) => {
  await bootApp(page, {
    commands: {
      'plugin:dialog|save': SAVE_PATH,
      'plugin:fs|write_file': null,
    },
  });

  await uploadImages(page, fixtures);
  await page.locator('header').getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.locator('header').getByRole('button', { name: 'Saved' })).toBeVisible();

  // Exactly one write; capture the raw bytes from the in-page mock's
  // detailed call log. (plugin-fs sends the path via IPC headers, so the
  // chosen location is verified through the recent-history entry name below.)
  const calls = await page.evaluate(() => window.__tauriMock.callsDetailed);
  const writes = calls.filter((c) => c.command === 'plugin:fs|write_file');
  expect(writes).toHaveLength(1);
  const bytes = Uint8Array.from(writes[0].args as number[]);
  const SQL = await initSqlJs();
  const service = new InvestigationArchiveService({
    dbProvider: createSqlJsProvider(SQL),
    zipper: fflateZipper,
  });
  const opened = await service.open(bytes);

  expect(opened.meta.name).toBe('case-042');
  expect(opened.meta.imageCount).toBe(2);
  expect(opened.meta.session.viewMode).toBe('map');
  expect(opened.images.map((i) => i.fileName).sort()).toEqual(
    fixtures.map((f) => f.name).sort()
  );
  // Bit-identical image bytes.
  for (const fixture of fixtures) {
    const entry = opened.images.find((i) => i.fileName === fixture.name)!;
    const original = fs.readFileSync(fixture.absolutePath);
    expect(Array.from(entry.bytes!)).toEqual(Array.from(original));
    expect(entry.hasImage).toBe(true);
  }
  // Metadata preserved without re-extraction: GPS from the fixture README.
  const full = opened.images.find((i) => i.fileName === 'full-exif.jpg')!;
  const exif = full.exif as { latitude?: number };
  expect(Math.abs((exif.latitude ?? 0) - 51.5)).toBeLessThan(0.001);

  // Manifest is inspectable without the DB.
  const zip = await fflateZipper.unzip(bytes);
  const manifest = JSON.parse(new TextDecoder().decode(zip.get(MANIFEST_ENTRY)!));
  expect(manifest.formatVersion).toBe(1);
  expect(manifest.imageCount).toBe(2);

  // Recent history recorded: reload lands on the splash with the entry.
  await page.reload();
  await expect(page.getByTestId('recent-investigation-entry').first()).toContainText('case-042');
});

test('save with no images is not possible (no save button)', async ({ page }) => {
  await bootApp(page);
  await expect(page.locator('header').getByRole('button', { name: 'Save', exact: true })).toHaveCount(0);
});

test('cancelling the save dialog is a silent no-op', async ({ page }) => {
  await bootApp(page, {
    commands: {
      'plugin:dialog|save': null, // user cancelled
    },
  });
  await uploadImages(page, fixtures);
  await page.locator('header').getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.locator('header').getByRole('button', { name: 'Save', exact: true })).toBeVisible();
  await expect(page.locator('[role="alert"]')).toHaveCount(0);
});