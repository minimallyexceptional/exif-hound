import { test, expect } from '@playwright/test';
import { APP_VERSION, bootApp, openSettings, closeSettings } from '../support/app';

test.beforeEach(async ({ page }) => {
  await bootApp(page);
  await openSettings(page);
});

test('renders all sections', async ({ page }) => {
  for (const section of ['Appearance', 'Map Settings', 'About']) await expect(page.getByRole('heading', { name: section, exact: true })).toBeVisible();
  await expect(page.getByTestId('app-version')).toContainText(`Version ${APP_VERSION}`);
  await expect(page.getByRole('button', { name: 'Light', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Dark', exact: true })).toBeVisible();
});

test('closes via the close button', async ({ page }) => closeSettings(page));

test('changes the theme from the appearance section', async ({ page }) => {
  await page.getByRole('button', { name: 'Light', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.getByRole('button', { name: 'Light', exact: true })).toHaveClass(/border-app-white/);
  await page.getByRole('button', { name: 'Dark', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('selects a map style and persists it to localStorage', async ({ page }) => {
  const getSelectedStyle = () => page.evaluate(() => JSON.parse(localStorage.getItem('mapSettings')!).selectedStyle);
  expect(await getSelectedStyle()).toBe('osm-standard');
  const images = page.getByRole('heading', { name: 'Map Settings' }).locator('..').locator('..').locator('button img[alt]');
  await expect(images).toHaveCount(3);
  await images.nth(1).click();
  expect(await getSelectedStyle()).not.toBe('osm-standard');
});

test('toggles the custom tile server and persists the URL', async ({ page }) => {
  const url = 'https://{s}.tiles.example.org/{z}/{x}/{y}.png';
  await page.locator('input[type="checkbox"]').check({ force: true });
  await page.locator('input[type="text"]').fill(url);
  const settings = await page.evaluate(() => JSON.parse(localStorage.getItem('mapSettings')!));
  expect(settings.customTiles.enabled).toBe(true);
  expect(settings.customTiles.url).toContain('tiles.example.org');
});

test('reports up to date after a manual update check', async ({ page }) => {
  await page.getByRole('button', { name: 'Check for Updates' }).click();
  await expect(page.getByTestId('update-status')).toContainText("You're up to date.");
});
