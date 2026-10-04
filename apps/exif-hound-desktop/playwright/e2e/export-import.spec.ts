import { test, expect } from '@playwright/test';
import { bootApp, switchView, uploadImages } from '../support/app';
import { FIXTURE_IMAGES, FIXTURE_IMPORT } from '../support/fixtures';

async function openExport(page: import('@playwright/test').Page) {
  await page.locator('header').getByRole('button', { name: 'Export' }).click();
  await expect(page.getByRole('heading', { name: 'Export Data' })).toBeVisible();
  await expect(page.getByText('Export includes all metadata from 1 images')).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await bootApp(page);
  await uploadImages(page, [FIXTURE_IMAGES.fullExif]);
});

test('exports CSV through the save picker with generated content', async ({ page }) => {
  await openExport(page);
  await page.getByRole('button', { name: 'Export as CSV' }).click();
  await expect(page.getByRole('heading', { name: 'Export Data' })).toHaveCount(0);
  const saved = await page.evaluate(() => ({ options: window.__savePickerCalls[0], content: window.__lastSaveWritable.content }));
  expect(saved.options.suggestedName).toMatch(/^exif-hound-data-/);
  expect(JSON.stringify(saved.options.types)).toContain('text/csv');
  for (const value of ['File Name', 'full-exif.jpg', 'TestCam', 'Hound-1', '51.5']) expect(saved.content).toContain(value);
});

test('exports JSON with the parsed metadata', async ({ page }) => {
  await openExport(page);
  await page.getByRole('button', { name: 'Export as JSON' }).click();
  await expect(page.getByRole('heading', { name: 'Export Data' })).toHaveCount(0);
  const saved = await page.evaluate(() => ({ options: window.__savePickerCalls[0], content: window.__lastSaveWritable.content }));
  expect(JSON.stringify(saved.options.types)).toContain('application/json');
  const parsed = JSON.parse(saved.content);
  const entry = Array.isArray(parsed) ? parsed[0] : parsed.images?.[0];
  expect(JSON.stringify(entry)).toContain('TestCam');
  expect(JSON.stringify(entry)).toContain('full-exif.jpg');
});

test('shows an error and stays open when saving fails', async ({ page }) => {
  await openExport(page);
  await page.evaluate(() => { window.showSaveFilePicker = () => Promise.reject(new DOMException('cancelled', 'AbortError')); });
  await page.getByRole('button', { name: 'Export as CSV' }).click();
  await expect(page.getByText('Failed to save CSV file. Please try again.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Export Data' })).toBeVisible();
});

test.describe('Import', () => {
  test.beforeEach(async ({ page }) => {
    await bootApp(page);
    await uploadImages(page, [FIXTURE_IMAGES.fullExif]);
    await switchView(page, 'Map View');
    await expect(page.locator('.leaflet-container')).toBeVisible();
    await page.locator('button[title="Import Data"]').click();
    await expect(page.getByRole('heading', { name: 'Import Location Data' })).toBeVisible();
  });

  test('imports a valid KML file and adds its placemarks to the map', async ({ page }) => {
    await page.locator('#fileInput').setInputFiles(FIXTURE_IMPORT.kml.path);
    await expect(page.getByRole('heading', { name: 'Import Location Data' })).toHaveCount(0);
    await expect(page.locator('.leaflet-overlay-pane path').nth(1)).toBeAttached();
  });

  test('supports switching to CSV format', async ({ page }) => {
    await page.getByRole('button', { name: 'CSV' }).click();
    await expect(page.getByText('latitude')).toBeVisible();
    await expect(page.getByText('longitude')).toBeVisible();
  });

  test('shows an error for invalid KML and dismisses it', async ({ page }) => {
    await page.locator('#fileInput').setInputFiles(FIXTURE_IMPORT.invalid.path);
    await expect(page.getByRole('heading', { name: 'Import Location Data' })).toBeVisible();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByText('Invalid KML file format')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: 'Import Location Data' })).toHaveCount(0);
  });
});
