import { test, expect } from '@playwright/test';
import { bootApp, openExifDetailsPanel, uploadImages } from '../support/app';
import { FIXTURE_IMAGES, FULL_EXIF_EXPECTED as EXPECTED } from '../support/fixtures';

test.beforeEach(async ({ page }) => {
  await bootApp(page);
  await uploadImages(page, [FIXTURE_IMAGES.fullExif]);
  await openExifDetailsPanel(page);
});

test('shows the parsed metadata for the selected image', async ({ page }) => {
  const { dateParts } = EXPECTED;
  await expect(page.getByRole('img', { name: 'Selected' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Compare with EXIF Thumbnail' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'View All EXIF Data' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Location', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Date Taken' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Camera Details' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'File Details' })).toBeVisible();
  await expect(page.getByText(EXPECTED.make)).toBeVisible();
  await expect(page.getByText(EXPECTED.model)).toBeVisible();
  await expect(page.getByText(EXPECTED.exposureTime)).toBeVisible();
  await expect(page.locator('.text-app-white').filter({ hasText: new RegExp(`${dateParts.month} ${dateParts.day}, ${dateParts.year}`) })).toBeVisible();
  await expect(page.locator('h3').filter({ hasText: 'File Details' })).toBeVisible();
  await expect(page.getByText('5.9 KB')).toBeVisible();
});

test('shows no-location placeholders for images without GPS', async ({ page }) => {
  await bootApp(page);
  await uploadImages(page, [FIXTURE_IMAGES.noGps]);
  await openExifDetailsPanel(page);
  await expect(page.locator(`[data-testid="gallery-item"][data-file-name="${FIXTURE_IMAGES.noGps.name}"]`)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('heading', { name: FIXTURE_IMAGES.noGps.name })).toBeVisible();
  await expect(page.getByRole('button', { name: 'View All EXIF Data' })).toHaveCount(0);
  await expect(page.getByText('No location data available')).toBeVisible();
  await expect(page.getByText('Make', { exact: true }).locator('..').locator('div').last()).toHaveText('TestCam');
  await expect(page.getByText('Model', { exact: true }).locator('..').locator('div').last()).toHaveText('Hound-2');
});

test('shows the full EXIF list in the sidebar without a click-through', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Compare with EXIF Thumbnail' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'View All EXIF Data' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Back to Details' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Camera Details' })).toBeVisible();
  await expect(page.getByText('TestCam')).toBeVisible();
});

test('copies EXIF content to the clipboard', async ({ page }) => {
  const exposure = page.getByText('Exposure Time', { exact: true }).locator('..');
  await exposure.getByText('1/250').click();
  await expect.poll(() => page.evaluate(() => window.__clipboardWrites)).toHaveLength(1);
  expect(await page.evaluate(() => window.__clipboardWrites[0])).toBe('1/250');
  await expect(page.getByText('Copied to clipboard.')).toBeVisible();
});

test('shows the file size in KB', async ({ page }) => {
  await expect(page.getByText('5.9 KB')).toBeVisible();
});
