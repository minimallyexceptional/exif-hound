import { test, expect } from '@playwright/test';
import { bootApp, closeSettings, openSettings } from '../support/app';

test('boots dark by default with data-theme on html', async ({ page }) => {
  await bootApp(page);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('theme'))).toBe('dark');
});

test('toggles to light and back via Settings appearance', async ({ page }) => {
  await bootApp(page);
  await openSettings(page);
  await page.getByRole('button', { name: 'Light', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.getByRole('button', { name: 'Light', exact: true })).toHaveClass(/border-app-white/);
  const token = await page.evaluate(() => ({
    black: getComputedStyle(document.documentElement).getPropertyValue('--app-black').trim().toLowerCase(),
    theme: localStorage.getItem('theme'),
  }));
  expect(token.black).toBe('#ffffff');
  expect(token.theme).toBe('light');
  await page.getByRole('button', { name: 'Dark', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('persists the chosen theme across reloads', async ({ page }) => {
  await bootApp(page);
  await openSettings(page);
  await page.getByRole('button', { name: 'Light', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await closeSettings(page);
  await page.reload();
  await page.getByRole('button', { name: 'Start new investigation' }).click();
  await page.getByLabel('Project name').fill('Theme Case');
  await page.getByRole('button', { name: 'Choose parent folder' }).click();
  await page.getByRole('button', { name: 'Create project' }).click();
  await expect(page.getByRole('heading', { name: 'EXIF Hound' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('boots with a seeded theme', async ({ page }) => {
  await bootApp(page, { localStorage: { theme: 'light' } });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await openSettings(page);
  await expect(page.getByRole('button', { name: 'Light', exact: true })).toHaveClass(/border-app-white/);
});

test('visibly changes the app background', async ({ page }) => {
  await bootApp(page);
  const dark = await page.locator('body').evaluate((body) => getComputedStyle(body).backgroundColor);
  await openSettings(page);
  await page.getByRole('button', { name: 'Light', exact: true }).click();
  await expect.poll(() => page.locator('body').evaluate((body) => getComputedStyle(body).backgroundColor)).not.toBe(dark);
});
