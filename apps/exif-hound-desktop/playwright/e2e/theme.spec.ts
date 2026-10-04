import { test, expect } from '@playwright/test';
import { bootApp } from '../support/app';

test('boots dark by default with data-theme on html', async ({ page }) => {
  await bootApp(page);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('theme'))).toBe('dark');
});

test('toggles to light and back via the header control', async ({ page }) => {
  await bootApp(page);
  await page.getByRole('button', { name: 'Switch to light mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.getByRole('button', { name: 'Switch to dark mode' })).toBeVisible();
  const token = await page.evaluate(() => ({
    black: getComputedStyle(document.documentElement).getPropertyValue('--app-black').trim().toLowerCase(),
    theme: localStorage.getItem('theme'),
  }));
  expect(token.black).toBe('#ffffff');
  expect(token.theme).toBe('light');
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('persists the chosen theme across reloads', async ({ page }) => {
  await bootApp(page);
  await page.getByRole('button', { name: 'Switch to light mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Exif Hound' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('boots with a seeded theme', async ({ page }) => {
  await bootApp(page, { localStorage: { theme: 'light' } });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.getByRole('button', { name: 'Switch to dark mode' })).toBeVisible();
});

test('visibly changes the app background', async ({ page }) => {
  await bootApp(page);
  const dark = await page.locator('body').evaluate((body) => getComputedStyle(body).backgroundColor);
  await page.getByRole('button', { name: 'Switch to light mode' }).click();
  await expect.poll(() => page.locator('body').evaluate((body) => getComputedStyle(body).backgroundColor)).not.toBe(dark);
});
