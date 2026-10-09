import { test, expect } from '@playwright/test';
import { bootApp, closeSettings, switchView, uploadImages } from '../support/app';
import { FIXTURE_IMAGES } from '../support/fixtures';

test.beforeEach(async ({ page }) => {
  await bootApp(page);
  await uploadImages(page, [FIXTURE_IMAGES.fullExif, FIXTURE_IMAGES.noGps]);
});

test('switches between map, list, and Workbench with no Investigation tab', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Location Map' })).toBeVisible();
  await expect(page.locator('header').getByRole('button', { name: 'Map View' })).toHaveClass(/bg-app-white/);
  await switchView(page, 'List View');
  await expect(page.getByRole('heading', { name: 'Image Details' })).toBeVisible();
  await expect(page.locator('header').getByRole('button', { name: 'List View' })).toHaveClass(/bg-app-white/);
  await expect(page.locator('header').getByRole('button', { name: 'Investigation', exact: true })).toHaveCount(0);
  await switchView(page, 'Workbench');
  await expect(page.locator('header').getByRole('button', { name: 'Workbench', exact: true })).toHaveClass(/bg-app-white/);
  await switchView(page, 'Map View');
  await expect(page.getByRole('heading', { name: 'Location Map' })).toBeVisible();
});

test('collapses and expands the gallery sidebar', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Gallery' })).toBeVisible();
  await page.getByRole('button', { name: 'Collapse gallery' }).click();
  await expect(page.getByRole('button', { name: 'Expand gallery' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Gallery' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Expand gallery' }).click();
  await expect(page.getByRole('button', { name: 'Collapse gallery' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Gallery' })).toBeVisible();
});

test('collapses and expands the EXIF details panel', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Details', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Collapse details' }).click();
  await expect(page.getByRole('button', { name: 'Expand details' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Details', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Expand details' }).click();
  await expect(page.getByRole('heading', { name: 'Details', exact: true })).toBeVisible();
});

test('opens the help menu and its entries work', async ({ page }) => {
  await page.getByRole('button', { name: 'Help menu' }).click();
  const menu = page.locator('#help-menu');
  await expect(menu).toBeVisible();
  await menu.getByText('Check for Updates').click();
  await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible();
  await expect(page.getByTestId('update-status')).toContainText("You're up to date.");
  await closeSettings(page);
  await page.getByRole('button', { name: 'Help menu' }).click();
  await page.locator('#help-menu').getByText('About Exif Hound').click();
  await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible();
  await closeSettings(page);
});

test('selects images from the gallery with the keyboard', async ({ page }) => {
  const noGps = page.locator(`[data-testid="gallery-item"][data-file-name="${FIXTURE_IMAGES.noGps.name}"]`);
  await noGps.focus();
  await noGps.press('Enter');
  await expect(noGps).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('Model', { exact: true }).locator('..').locator('div').last()).toHaveText('Hound-2');
});

test('navigates the list view spreadsheet and selects rows', async ({ page }) => {
  await switchView(page, 'List View');
  await expect(page.getByLabel('Image metadata spreadsheet')).toBeVisible();
  const grid = page.getByRole('grid', { name: 'Image metadata spreadsheet' });
  await expect(grid.getByRole('columnheader', { name: 'Preview' })).toBeVisible();
  await expect(grid.getByText(FIXTURE_IMAGES.fullExif.name, { exact: true })).toBeVisible();
  await expect(grid.getByText(FIXTURE_IMAGES.noGps.name, { exact: true })).toBeVisible();
});
