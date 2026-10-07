import { test, expect } from '@playwright/test';
import { bootApp } from '../support/app';

test.describe('Splash screen entrypoint', () => {
  test('shows logomark, new investigation action, and empty recent list', async ({ page }) => {
    await bootApp(page, { skipSplash: false });

    // Splash owns the window: no app shell chrome.
    await expect(page.locator('header')).toHaveCount(0);

    await expect(page.getByRole('button', { name: 'Start new investigation' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Recent investigations' })).toBeVisible();
    await expect(page.getByText('No investigations yet — start your first above')).toBeVisible();
    await expect(page.getByTestId('splash-logomark')).toBeVisible();
  });

  test('starting a new investigation enters the upload flow', async ({ page }) => {
    await bootApp(page, { skipSplash: false });

    await page.getByRole('button', { name: 'Start new investigation' }).click();

    // Existing entrypoint: app shell with the empty-state upload panel.
    await expect(page.getByRole('heading', { name: 'Exif Hound', exact: true })).toBeVisible();
    await expect(page.getByText('Upload images to start tracking')).toBeVisible();
    await expect(page.getByTestId('splash-logomark')).toHaveCount(0);
  });

  test('renders in light theme', async ({ page }) => {
    await bootApp(page, { skipSplash: false, localStorage: { theme: 'light' } });

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.getByRole('button', { name: 'Start new investigation' })).toBeVisible();
    await expect(page.getByTestId('splash-logomark')).toBeVisible();
  });
});
