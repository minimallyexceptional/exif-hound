import { test, expect } from '@playwright/test';
import { bootApp, closeSettings, openSettings, MOCK_UPDATE } from '../support/app';

test('is silent when the automatic check finds no update', async ({ page }) => {
  await bootApp(page);
  await expect(page.getByRole('heading', { name: 'EXIF Hound' })).toBeVisible();
  await expect(page.getByText('is available.')).toHaveCount(0);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('shows the update-available toast when the check finds an update', async ({ page }) => {
  await bootApp(page, { commands: { 'plugin:updater|check': MOCK_UPDATE } });
  await openSettings(page);
  await page.getByRole('button', { name: 'Check for Updates' }).click();
  await expect(page.getByTestId('update-status')).toContainText('An update is available.');
  await closeSettings(page);
  await expect(page.getByText('EXIF Hound 9.9.9 is available.')).toBeVisible();
  await expect(page.getByText('Automated test release notes')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Install 9.9.9' })).toBeVisible();
  await expect(page.locator('[data-sonner-toaster]')).toHaveAttribute('data-y-position', 'bottom');
  await expect(page.locator('[data-sonner-toaster]')).toHaveAttribute('data-x-position', 'right');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('dismisses the update with the toast close control without downloading', async ({ page }) => {
  await bootApp(page, { commands: { 'plugin:updater|check': MOCK_UPDATE } });
  await openSettings(page);
  await page.getByRole('button', { name: 'Check for Updates' }).click();
  await closeSettings(page);
  await expect(page.getByText('EXIF Hound 9.9.9 is available.')).toBeVisible();
  const calls = await page.evaluate(() => window.__tauriMock.calls);
  expect(calls).not.toContain('plugin:updater|download');
  expect(calls).not.toContain('plugin:process|relaunch');
  await page.locator('[data-sonner-toast] [data-close-button]').click();
  await expect(page.getByText('EXIF Hound 9.9.9 is available.')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Install 9.9.9' })).toHaveCount(0);
});

test('reports an update failure gracefully on the manual check', async ({ page }) => {
  await bootApp(page, { commands: { 'plugin:updater|check': { __reject: 'mock updater outage' } } });
  await openSettings(page);
  await page.getByRole('button', { name: 'Check for Updates' }).click();
  await expect(page.getByTestId('update-status')).not.toHaveText('Checking…');
  await expect(page.getByRole('button', { name: 'Check for Updates' })).toBeAttached();
  await closeSettings(page);
});
