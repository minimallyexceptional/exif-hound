import { test, expect } from '@playwright/test';
import { bootApp, closeSettings, openSettings, MOCK_UPDATE } from '../support/app';

test('is silent when the automatic check finds no update', async ({ page }) => {
  await bootApp(page);
  await expect(page.getByRole('heading', { name: 'Exif Hound' })).toBeVisible();
  await expect(page.getByText('Update Available')).toHaveCount(0);
});

test('shows the update-available dialog when the check finds an update', async ({ page }) => {
  await bootApp(page, { commands: { 'plugin:updater|check': MOCK_UPDATE } });
  await page.getByRole('button', { name: 'Help menu' }).click();
  await page.locator('#help-menu').getByText('Check for Updates').click();
  await expect(page.getByText('Update Available')).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText('Exif Hound 9.9.9 is available.');
  await expect(page.getByRole('dialog')).toContainText('Automated test release notes');
  await expect(page.getByTestId('update-status')).toContainText('An update is available.');
});

test('dismisses the update with Later without downloading', async ({ page }) => {
  await bootApp(page, { commands: { 'plugin:updater|check': MOCK_UPDATE } });
  await page.getByRole('button', { name: 'Help menu' }).click();
  await page.locator('#help-menu').getByText('Check for Updates').click();
  await expect(page.getByText('Update Available')).toBeVisible();
  const calls = await page.evaluate(() => window.__tauriMock.calls);
  expect(calls).not.toContain('plugin:updater|download');
  expect(calls).not.toContain('plugin:process|relaunch');
  await page.getByRole('button', { name: 'Later' }).click();
  await expect(page.getByText('Update Available')).toHaveCount(0);
});

test('reports an update failure gracefully on the manual check', async ({ page }) => {
  await bootApp(page, { commands: { 'plugin:updater|check': { __reject: 'mock updater outage' } } });
  await openSettings(page);
  await page.getByRole('button', { name: 'Check for Updates' }).click();
  await expect(page.getByTestId('update-status')).not.toHaveText('Checking…');
  await expect(page.getByRole('button', { name: 'Check for Updates' })).toBeAttached();
  await closeSettings(page);
});
