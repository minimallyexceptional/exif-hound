import { test, expect } from '@playwright/test';
import { bootApp, closeSettings, openSettings, switchView, uploadImages } from '../support/app';
import { FIXTURE_IMAGES, FIXTURE_IMPORT } from '../support/fixtures';

test('accepts an image through the header file input and selects it', async ({ page }) => {
  await bootApp(page);
  await uploadImages(page, [FIXTURE_IMAGES.fullExif]);
  await expect(page.locator(`img[alt="${FIXTURE_IMAGES.fullExif.name}"]`)).toBeAttached();
  await expect(page.getByRole('heading', { name: 'Details', exact: true })).toBeVisible();
  await expect(page.getByText(FIXTURE_IMAGES.fullExif.name, { exact: true })).toBeVisible();
});

test('handles multiple files at once', async ({ page }) => {
  await bootApp(page);
  await uploadImages(page, [FIXTURE_IMAGES.fullExif, FIXTURE_IMAGES.noGps]);
  await expect(page.locator(`img[alt="${FIXTURE_IMAGES.fullExif.name}"]`)).toBeAttached();
  await expect(page.locator(`img[alt="${FIXTURE_IMAGES.noGps.name}"]`)).toBeAttached();
  await expect(page.getByText('Model', { exact: true }).locator('..').locator('div').last()).toHaveText('Hound-2');
  await switchView(page, 'Investigation');
  await expect(page.getByText('2 images', { exact: true })).toBeVisible();
});

test('rejects non-image files', async ({ page }) => {
  await bootApp(page);
  await page.locator('#headerFileInput').setInputFiles(FIXTURE_IMPORT.points.path);
  await expect(page.getByText('Upload images to start tracking')).toBeVisible();
  await expect(page.locator('img[alt="points.kml"]')).toHaveCount(0);
});

test('survives a corrupt image without crashing and shows unavailable metadata', async ({ page }) => {
  await bootApp(page);
  await uploadImages(page, [FIXTURE_IMAGES.corrupt]);
  await expect(page.locator(`img[alt="${FIXTURE_IMAGES.corrupt.name}"]`)).toBeAttached();
  await expect(page.getByRole('heading', { name: 'Details', exact: true })).toBeVisible();
  for (const label of ['Make', 'Model', 'Exposure Time', 'F-Number', 'ISO']) {
    await expect(page.getByText(label, { exact: true }).locator('..').locator('div').last()).toHaveText('N/A');
  }
  await expect(page.getByText('Not available')).toBeVisible();
  await openSettings(page);
  await closeSettings(page);
});
