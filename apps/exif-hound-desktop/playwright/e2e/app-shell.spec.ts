import { test, expect } from '@playwright/test';
import { bootApp, openSettings, APP_VERSION } from '../support/app';

test('renders the main UI and serves Tauri commands from the mock', async ({ page }) => {
  await bootApp(page);
  await expect(page.getByText('Tracking digital footprints in every image')).toBeVisible();
  await openSettings(page);
  await expect(page.getByTestId('app-version')).toContainText(`Version ${APP_VERSION}`);
  await expect.poll(() => page.evaluate(() => window.__tauriMock.calls)).toContain('plugin:app|version');
});

test('shows the empty state before any images are uploaded', async ({ page }) => {
  await bootApp(page);
  await expect(page.getByText('Upload images to start tracking')).toBeVisible();
  await expect(page.getByText('Drag and drop anywhere or use the upload button')).toBeVisible();
  for (const name of ['Map View', 'List View', 'Investigation', 'Export']) {
    await expect(page.locator('header').getByRole('button', { name, exact: true })).toHaveCount(0);
  }
  await expect(page.locator('header').getByRole('button', { name: 'Workbench', exact: true })).toBeVisible();
});

test('boots on the light theme when seeded', async ({ page }) => {
  await bootApp(page, { localStorage: { theme: 'light' } });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});
