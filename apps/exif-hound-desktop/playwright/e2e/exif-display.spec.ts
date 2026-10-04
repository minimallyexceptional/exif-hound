import { test, expect } from '@playwright/test';
import { bootApp, uploadImages } from '../support/app';
import { FIXTURE_IMAGES, FULL_EXIF_EXPECTED as EXPECTED } from '../support/fixtures';

test.beforeEach(async ({ page }) => {
  await bootApp(page);
  await uploadImages(page, [FIXTURE_IMAGES.fullExif]);
});

test('shows the parsed metadata for the selected image', async ({ page }) => {
  const { dateParts } = EXPECTED;
  await expect(page.getByRole('heading', { name: 'Location', exact: true })).toBeVisible();
  await expect(page.getByText(EXPECTED.coordinates)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Date Taken' })).toBeVisible();
  await expect(page.locator('.text-app-accent').filter({ hasText: new RegExp(`${dateParts.month} ${dateParts.day}, ${dateParts.year}`) })).toBeVisible();
  await expect(page.getByText(dateParts.time)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Camera Details' })).toBeVisible();
  for (const [label, value] of [['Make', EXPECTED.make], ['Model', EXPECTED.model], ['Exposure Time', EXPECTED.exposureTime], ['F-Number', EXPECTED.fNumber], ['ISO', EXPECTED.iso], ['Focal Length', EXPECTED.focalLength]]) {
    await expect(page.getByText(label, { exact: true }).locator('..').locator('div').last()).toHaveText(value);
  }
  await expect(page.locator('h3').filter({ hasText: 'File Details' })).toBeVisible();
  await expect(page.getByText('Type', { exact: true }).locator('..').locator('div').last()).toHaveText('JPEG');
});

test('shows no-location placeholders for images without GPS', async ({ page }) => {
  await bootApp(page);
  await uploadImages(page, [FIXTURE_IMAGES.noGps]);
  await expect(page.locator(`[data-testid="gallery-item"][data-file-name="${FIXTURE_IMAGES.noGps.name}"]`)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('heading', { name: FIXTURE_IMAGES.noGps.name })).toBeVisible();
  await expect(page.getByText('No location data available')).toBeVisible();
  await expect(page.getByText('Make', { exact: true }).locator('..').locator('div').last()).toHaveText('TestCam');
  await expect(page.getByText('Model', { exact: true }).locator('..').locator('div').last()).toHaveText('Hound-2');
  await expect(page.locator('.space-y-2').filter({ has: page.getByRole('heading', { name: 'Date Taken' }) })).toContainText('Not available');
});

test('opens the full EXIF viewer and returns via Back', async ({ page }) => {
  await page.getByRole('button', { name: 'View All EXIF Data' }).click();
  await expect(page.getByRole('button', { name: 'Back to Details' })).toBeVisible();
  await expect(page.getByText('Camera Information')).toBeVisible();
  await expect(page.getByText('TestCam')).toBeVisible();
  await page.getByRole('button', { name: 'Back to Details' }).click();
  await expect(page.getByRole('button', { name: 'View All EXIF Data' })).toBeVisible();
});

test('copies EXIF content to the clipboard', async ({ page }) => {
  await page.getByRole('button', { name: 'View All EXIF Data' }).click();
  const exposure = page.getByText('Exposure Time', { exact: true }).locator('../..');
  await exposure.getByRole('button', { name: 'Copy to clipboard' }).click({ force: true });
  await expect.poll(() => page.evaluate(() => window.__clipboardWrites)).toHaveLength(1);
  expect(await page.evaluate(() => window.__clipboardWrites[0])).toBe('1/250');
});

test('shows the file size in KB', async ({ page }) => {
  await expect(page.getByText('5.9 KB')).toBeVisible();
});
