import { test, expect } from '@playwright/test';
import { bootApp, switchView, uploadImages } from '../support/app';
import { FIXTURE_IMAGES } from '../support/fixtures';

const TOOLS = [
  { name: 'Pattern Analysis', label: 'Open Pattern Analysis' },
  { name: 'Geolocation Analysis', label: 'Open Geolocation Analysis' },
  { name: 'Timeline Analysis', label: 'Open Timeline Analysis' },
  { name: 'Software Processing', label: 'Open Software Processing' },
];

test.beforeEach(async ({ page }) => {
  await bootApp(page);
  await uploadImages(page, [FIXTURE_IMAGES.fullExif, FIXTURE_IMAGES.noGps]);
  await switchView(page, 'Investigation');
});

test('shows the dashboard with all four tools and the image count', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Investigation Dashboard' })).toBeVisible();
  await expect(page.getByText('2 images', { exact: true })).toBeVisible();
  for (const tool of TOOLS) {
    await expect(page.getByRole('heading', { name: tool.name })).toBeVisible();
    await expect(page.getByRole('button', { name: tool.label })).toBeEnabled();
  }
});

for (const tool of TOOLS) {
  test(`renders ${tool.name} without errors`, async ({ page }) => {
    await page.getByRole('button', { name: tool.label }).click();
    await expect(page.getByRole('button', { name: 'Back' })).toBeVisible();
    await expect(page.getByRole('heading', { name: tool.name })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Enter fullscreen' })).toBeVisible();
    await expect(page.locator('.flex-1.overflow-auto').first().locator('> *')).not.toHaveCount(0);
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page.getByRole('heading', { name: 'Investigation Dashboard' })).toBeVisible();
  });
}

test('toggles fullscreen for an analysis tool', async ({ page }) => {
  await page.getByRole('button', { name: 'Open Timeline Analysis' }).click();
  await page.getByRole('button', { name: 'Enter fullscreen' }).click();
  await expect(page.getByRole('button', { name: 'Exit fullscreen' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Enter fullscreen' })).toBeVisible();
});
