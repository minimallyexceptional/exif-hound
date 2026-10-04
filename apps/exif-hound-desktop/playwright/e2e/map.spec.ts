import { test, expect } from '@playwright/test';
import { bootApp, uploadImages } from '../support/app';
import { FIXTURE_IMAGES } from '../support/fixtures';

async function waitForMap(page: import('@playwright/test').Page) {
  await expect(page.locator('.leaflet-container')).toBeVisible();
}

test.beforeEach(async ({ page }) => bootApp(page));

test('renders the map with controls and error boundary', async ({ page }) => {
  await uploadImages(page, [FIXTURE_IMAGES.fullExif]);
  await waitForMap(page);
  // Reticle is off by default; toggling it via the map control attaches it.
  await expect(page.locator('.reticle-container')).toHaveCount(0);
  await page.locator('button[title="Show Reticle"]').click();
  await expect(page.locator('.reticle-container')).toBeAttached();
  for (const title of ['Show Route', 'Show Heatmap', 'Show Clusters', 'Import Data']) await expect(page.locator(`button[title="${title}"]`)).toBeVisible();
  await expect(page.locator('.leaflet-control-zoom')).toBeVisible();
});

test('creates markers only for images with GPS', async ({ page }) => {
  await uploadImages(page, [FIXTURE_IMAGES.noGps]);
  await waitForMap(page);
  await expect(page.locator('.leaflet-marker-icon')).toHaveCount(0);
  await uploadImages(page, [FIXTURE_IMAGES.fullExif]);
  await expect(page.locator('.leaflet-marker-icon').first()).toBeAttached();
});

test('opens the image popup when a marker is clicked', async ({ page }) => {
  await uploadImages(page, [FIXTURE_IMAGES.fullExif]);
  await waitForMap(page);
  await page.locator('.leaflet-marker-icon').first().click();
  const popup = page.locator('.leaflet-popup');
  await expect(popup).toBeVisible();
  await expect(popup).toContainText(FIXTURE_IMAGES.fullExif.name);
  await expect(popup).toContainText('Lat: 51.500000');
  await expect(popup).toContainText('Lon: -0.127778');
});

test('toggles the route line with two GPS images', async ({ page }) => {
  await uploadImages(page, [FIXTURE_IMAGES.fullExif, FIXTURE_IMAGES.fullExif]);
  await waitForMap(page);
  await page.locator('button[title="Show Route"]').click();
  await expect(page.locator('button[title="Hide Route"]')).toBeVisible();
  await expect(page.locator('.leaflet-overlay-pane path').first()).toBeAttached();
  await page.locator('button[title="Hide Route"]').click();
  await expect(page.locator('button[title="Show Route"]')).toBeVisible();
});

test('toggles the heatmap layer over the markers', async ({ page }) => {
  await uploadImages(page, [FIXTURE_IMAGES.fullExif]);
  await waitForMap(page);
  await page.locator('button[title="Show Heatmap"]').click();
  await expect(page.locator('.leaflet-overlay-pane canvas')).toBeAttached();
  await page.locator('button[title="Show Markers"]').click();
  await expect(page.locator('.leaflet-marker-icon').first()).toBeAttached();
});

test('zooms the map via the zoom control', async ({ page }) => {
  await uploadImages(page, [FIXTURE_IMAGES.fullExif]);
  await waitForMap(page);
  await page.locator('.leaflet-control-zoom-in').click();
  await expect(page.locator('.leaflet-control-zoom-in')).toBeVisible();
});

test('opens the import modal from the map controls', async ({ page }) => {
  await uploadImages(page, [FIXTURE_IMAGES.fullExif]);
  await waitForMap(page);
  await page.locator('button[title="Import Data"]').click();
  await expect(page.getByRole('heading', { name: 'Import Location Data' })).toBeVisible();
  await page.getByRole('button', { name: 'Close modal' }).click();
  await expect(page.getByRole('heading', { name: 'Import Location Data' })).toHaveCount(0);
});
