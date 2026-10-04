import { test, expect } from '@playwright/test';
import { bootApp, closeSettings, openSettings, uploadImages } from '../support/app';
import { FIXTURE_IMAGES } from '../support/fixtures';

test('gives every icon-only control an accessible name', async ({ page }) => {
  await bootApp(page);
  await uploadImages(page, [FIXTURE_IMAGES.fullExif]);
  await openSettings(page);
  await closeSettings(page);
  const unnamed = await page.locator('button').evaluateAll((buttons) => buttons.filter((button) =>
    !button.getAttribute('aria-label') && !button.getAttribute('title') && !button.textContent?.trim()
  ).map((button) => button.outerHTML.slice(0, 80)));
  expect(unnamed, `icon-only buttons without a name: ${unnamed.join(' | ')}`).toHaveLength(0);
});

test('keeps a visible focus ring defined for keyboard navigation', async ({ page }) => {
  await bootApp(page);
  const hasRule = await page.evaluate(() => Array.from(document.styleSheets).some((sheet) => {
    try { return Array.from(sheet.cssRules).some((rule) => (rule as CSSStyleRule).selectorText?.includes(':focus-visible')); }
    catch { return false; }
  }));
  expect(hasRule).toBe(true);
});

test('help and settings controls expose aria state', async ({ page }) => {
  await bootApp(page);
  const help = page.getByRole('button', { name: 'Help menu' });
  await expect(help).toHaveAttribute('aria-haspopup', 'menu');
  await expect(help).toHaveAttribute('aria-expanded', 'false');
  await help.click();
  await expect(page.getByRole('button', { name: 'Help menu' })).toHaveAttribute('aria-expanded', 'true');
});

test.describe('mobile viewport', () => {
  test.use({ viewport: { width: 480, height: 800 } });

  test('collapses desktop actions into a menu', async ({ page }) => {
    await bootApp(page);
    await uploadImages(page, [FIXTURE_IMAGES.fullExif]);
    await expect(page.locator('header').getByRole('button', { name: 'Import', exact: true })).toBeHidden();
    await expect(page.locator('header').getByRole('button', { name: 'Map View', exact: true })).toBeHidden();
    await page.getByRole('button', { name: 'Open menu' }).click();
    const close = page.getByRole('button', { name: 'Close menu' });
    await expect(close).toBeVisible();
    await expect(page.getByTestId('mobile-menu')).toContainText(/Map View/);
    await expect(page.getByTestId('mobile-menu')).toContainText(/List View/);
    await expect(page.getByTestId('mobile-menu')).toContainText(/Investigation/);
    await expect(page.getByTestId('mobile-menu')).toContainText(/Export/);
    await expect(page.getByTestId('mobile-menu')).toContainText(/Settings/);
    await close.click();
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible();
  });

  test('switches views from the mobile menu', async ({ page }) => {
    await bootApp(page);
    await uploadImages(page, [FIXTURE_IMAGES.fullExif]);
    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.getByTestId('mobile-menu').getByRole('button', { name: 'List View' }).click();
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Image Details' })).toBeVisible();
  });

  test('still renders the map full-width', async ({ page }) => {
    await bootApp(page);
    await uploadImages(page, [FIXTURE_IMAGES.fullExif]);
    await expect(page.locator('.leaflet-container')).toBeVisible();
  });
});
