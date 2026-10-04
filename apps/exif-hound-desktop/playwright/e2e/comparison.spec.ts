import { test, expect } from '@playwright/test';
import { bootApp, uploadImages } from '../support/app';
import { FIXTURE_IMAGES } from '../support/fixtures';

test.beforeEach(async ({ page }) => {
  await bootApp(page);
  await uploadImages(page, [FIXTURE_IMAGES.fullExif]);
});

test('opens the comparison modal from the details panel', async ({ page }) => {
  await page.getByRole('button', { name: 'Compare with EXIF Thumbnail' }).click();
  await expect(page.getByRole('heading', { name: 'Image Comparison' })).toBeVisible();
  await expect(page.locator('img[alt="Original"]')).toBeAttached();
  await expect(page.locator('img[alt="Thumbnail"]')).toBeAttached();
});

test('closes the comparison modal cleanly', async ({ page }) => {
  await page.getByRole('button', { name: 'Compare with EXIF Thumbnail' }).click();
  await expect(page.getByRole('heading', { name: 'Image Comparison' })).toBeVisible();
  await page.getByRole('button', { name: 'Close modal' }).click();
  await expect(page.getByRole('heading', { name: 'Image Comparison' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Compare with EXIF Thumbnail' })).toBeVisible();
});
