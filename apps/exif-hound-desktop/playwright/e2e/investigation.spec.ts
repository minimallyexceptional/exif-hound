import { test, expect } from '@playwright/test';
import { bootApp, switchView, uploadImages } from '../support/app';
import { FIXTURE_IMAGES } from '../support/fixtures';

test.beforeEach(async ({ page }) => {
  await bootApp(page);
  await uploadImages(page, [FIXTURE_IMAGES.fullExif, FIXTURE_IMAGES.noGps]);
  await switchView(page, 'Investigation');
});

const DRILL_INS = [
  { label: 'Geolocation', tool: 'Geolocation Analysis' },
  { label: 'Patterns', tool: 'Pattern Analysis' },
  { label: 'Timeline', tool: 'Timeline Analysis' },
  { label: 'Details', tool: 'Software Processing' },
];

test('shows the dashboard with the image count', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Investigation Dashboard' })).toBeVisible();
  await expect(page.getByText('2 images', { exact: true }).first()).toBeVisible();
});

test('overview compiles coverage metrics from the dataset', async ({ page }) => {
  await expect(page.getByTestId('overview-total')).toHaveText('2');
  await expect(page.getByTestId('overview-locations')).toHaveText('1');
  await expect(page.getByTestId('overview-devices')).toHaveText('2');
  await expect(page.getByTestId('coverage-gps-location')).toContainText('1/2 · 50%');
  await expect(page.getByTestId('coverage-capture-time')).toContainText('1/2 · 50%');
  await expect(page.getByTestId('coverage-device-info')).toContainText('2/2 · 100%');
  await expect(page.getByTestId('coverage-software-tags')).toContainText('0/2 · 0%');
});

test('locations section lists the unique location and missing-GPS note', async ({ page }) => {
  await expect(page.getByText('1 unique')).toBeVisible();
  await expect(page.getByText('51.5000, -0.1278')).toBeVisible();
  await expect(page.getByText('1 image without GPS data')).toBeVisible();
});

test('devices section lists unique devices', async ({ page }) => {
  await expect(page.getByText('2 unique')).toBeVisible();
  await expect(page.getByText('TestCam Hound-1')).toBeVisible();
  await expect(page.getByText('TestCam Hound-2')).toBeVisible();
});

test('timeline section builds the event chronology', async ({ page }) => {
  await expect(page.getByText('1 event')).toBeVisible();
  await expect(page.getByText('15 Jun 2024, 10:30').first()).toBeVisible();
  await expect(page.getByText('1 image without a capture timestamp')).toBeVisible();
});

test('software section reports no editing traces', async ({ page }) => {
  await expect(page.getByText('No editing-software traces found in this dataset')).toBeVisible();
});

test('anomalies section flags sparse metadata', async ({ page }) => {
  await expect(page.getByText('Sparse metadata')).toBeVisible();
  await expect(page.getByText('Fewer than three core EXIF fields — possibly stripped')).toBeVisible();
});

test('drills into every analysis tool and back', async ({ page }) => {
  for (const { label, tool } of DRILL_INS) {
    await page.getByRole('button', { name: label, exact: true }).first().click();
    await expect(page.getByRole('button', { name: 'Back' })).toBeVisible();
    await expect(page.getByRole('heading', { name: tool })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Enter fullscreen' })).toBeVisible();
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page.getByRole('heading', { name: 'Investigation Dashboard' })).toBeVisible();
  }
});

test('toggles fullscreen for an analysis tool', async ({ page }) => {
  await page.getByRole('button', { name: 'Timeline', exact: true }).click();
  await page.getByRole('button', { name: 'Enter fullscreen' }).click();
  await expect(page.getByRole('button', { name: 'Exit fullscreen' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Enter fullscreen' })).toBeVisible();
});