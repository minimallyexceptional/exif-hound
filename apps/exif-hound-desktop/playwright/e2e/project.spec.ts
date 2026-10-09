import { test, expect } from '@playwright/test';
import * as fs from 'node:fs';
import initSqlJs from 'sql.js';
import {
  ProjectStore,
  createSqlJsProvider,
  InMemoryFs,
} from '../../../../packages/investigation-archive/dist/index.js';
import { bootApp, uploadImages } from '../support/app';
import { FIXTURE_IMAGES } from '../support/fixtures';

const PARENT = '/tmp/e2e-projects';

/**
 * Build a real project folder in Node (via the package + InMemoryFs) and
 * serialize it for the in-page fs emulation seed.
 */
async function buildProjectFixture(name: string): Promise<{ dirs: string[]; files: Record<string, string> }> {
  const SQL = await initSqlJs();
  const mem = new InMemoryFs();
  const store = await ProjectStore.create(
    { dbProvider: createSqlJsProvider(SQL), fs: mem },
    '/projects-root',
    name,
    '2.7.0'
  );
  for (const fixture of [FIXTURE_IMAGES.fullExif, FIXTURE_IMAGES.noGps]) {
    const bytes = fs.readFileSync(fixture.absolutePath);
    await store.addImage(
      fixture.name,
      new Uint8Array(bytes),
      fixture.hasGps
        ? { latitude: 51.5, longitude: -0.127778, cameraMake: 'TestCam', cameraModel: 'Hound-1' }
        : { cameraMake: 'TestCam', cameraModel: 'Hound-2' }
    );
  }
  const b64 = (bytes: Uint8Array) => Buffer.from(bytes).toString('base64');
  const files: Record<string, string> = {};
  for (const [path, data] of Object.entries(mem.snapshot())) {
    files[path] = b64(data);
  }
  return {
    files,
    dirs: ['/projects-root', `/projects-root/${name}`, `/projects-root/${name}/data`, `/projects-root/${name}/images`],
  };
}

test('creating a project builds the folder tree and uploads write through', async ({ page }) => {
  await bootApp(page, {
    skipSplash: false,
    commands: {
      // dialog.open is used for the parent-folder pick (directory: true)
      'plugin:dialog|open': PARENT,
    },
    fsEmulation: { dirs: [], files: {} },
  });

  await page.getByRole('button', { name: 'Start new investigation' }).click();
  await page.getByLabel('Project name').fill('E2E Case');
  await page.getByRole('button', { name: 'Choose parent folder' }).click();
  await page.getByRole('button', { name: 'Create project' }).click();

  // App shell entered with the empty upload state.
  await expect(page.getByText('Upload images to start tracking')).toBeVisible();

  // Uploads write through: images land in the emulated project folder.
  await uploadImages(page, [FIXTURE_IMAGES.fullExif]);
  await expect
    .poll(async () => {
      const detail = await page.evaluate(() => window.__tauriMock.callsDetailed);
      const paths = detail
        .filter((c) => c.command === 'plugin:fs|write_file')
        .map((w) => decodeURIComponent(w.headers?.path ?? ''));
      return (
        paths.some((p) => p.includes('/E2E Case/images/full-exif.jpg')) &&
        paths.some((p) => p.endsWith('/E2E Case/data/data.db'))
      );
    }, { timeout: 10_000 })
    .toBe(true);
});

test('opening an existing project repopulates views from the database', async ({ page }) => {
  const seed = await buildProjectFixture('Resumed Case');
  const projectPath = `/projects-root/Resumed Case`;
  await bootApp(page, {
    skipSplash: false,
    fsEmulation: seed,
    localStorage: {
      'exifhound.recentProjects': JSON.stringify([
        { path: projectPath, name: 'Resumed Case', lastOpenedAt: Date.now() },
      ]),
    },
  });

  const entry = page.getByTestId('recent-investigation-entry').first();
  await expect(entry).toContainText('Resumed Case');
  await entry.click();

  // Views repopulated from the db: both restored images, immediately ready.
  await expect(page.getByRole('heading', { name: 'Exif Hound', exact: true })).toBeVisible();
  for (const fixture of [FIXTURE_IMAGES.fullExif, FIXTURE_IMAGES.noGps]) {
    const item = page.locator(`[data-testid="gallery-item"][data-file-name="${fixture.name}"]`);
    await expect(item).toHaveCount(1);
    await expect(item).toHaveAttribute('data-processing', 'false');
  }

  // List view is repopulated from the database records.
  await page.locator('header').getByRole('button', { name: 'List View' }).click();
  await expect(page.getByRole('heading', { name: 'Image Details' })).toBeVisible();
  await expect(page.getByText(FIXTURE_IMAGES.fullExif.name, { exact: true })).toBeVisible();
  await expect(page.getByText(FIXTURE_IMAGES.noGps.name, { exact: true })).toBeVisible();
});

test('Workbench opens the node editor and can save a machine-wide workflow template', async ({ page }) => {
  const seed = await buildProjectFixture('Workflow Case');
  await bootApp(page, {
    skipSplash: false,
    fsEmulation: seed,
    localStorage: {
      'exifhound.recentProjects': JSON.stringify([
        { path: '/projects-root/Workflow Case', name: 'Workflow Case', lastOpenedAt: Date.now() },
      ]),
    },
  });
  await page.getByTestId('recent-investigation-entry').first().click();
  await page.getByRole('button', { name: 'Workbench' }).click();
  await expect(page.getByRole('heading', { name: 'Inputs' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Run Workflow' })).toBeVisible();
  await page.getByRole('tab', { name: 'Saved workflows' }).click();
  await expect(page.getByRole('heading', { name: 'Saved workflows' })).toBeVisible();
  await page.getByRole('tab', { name: 'Editor' }).click();
  await page.getByTitle('Save reusable workflow').click();
  await page.getByLabel('Workflow name').fill('Evidence starter');
  await page.getByRole('button', { name: 'Save workflow' }).click();
  await expect.poll(async () => page.evaluate(() => window.__tauriMock.calls.includes('save_workflow_template'))).toBe(true);
});

test('Workbench supports dragging nodes onto the canvas and connecting compatible ports', async ({ page }) => {
  await bootApp(page, { skipSplash: false });
  await page.getByRole('button', { name: 'Start new investigation' }).click();
  await page.getByLabel('Project name').fill('Workflow drag case');
  await page.getByRole('button', { name: 'Choose parent folder' }).click();
  await page.getByRole('button', { name: 'Create project' }).click();
  await page.getByRole('button', { name: 'Workbench' }).click();

  const canvas = page.locator('.react-flow__pane');
  await page.getByRole('button', { name: 'Add Image node' }).dragTo(canvas, { targetPosition: { x: 250, y: 300 } });
  await page.getByRole('button', { name: 'Add OCR node' }).dragTo(canvas, { targetPosition: { x: 530, y: 300 } });
  await page.getByRole('button', { name: 'Add Text output node' }).dragTo(canvas, { targetPosition: { x: 810, y: 300 } });

  const image = page.getByTestId('flow-node-image');
  const ocr = page.getByTestId('flow-node-ocr');
  const output = page.getByTestId('flow-node-text');
  await image.locator('.react-flow__handle-right').dragTo(ocr.locator('.react-flow__handle-left'));
  await ocr.locator('.react-flow__handle-right').dragTo(output.locator('.react-flow__handle-left'));

  await expect(page.locator('.react-flow__edge')).toHaveCount(2);
  await expect(page.getByText('Choose a project image for every connected Image node.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Run Workflow' })).toBeDisabled();
});

test('invalid project folders are rejected with an error on the splash', async ({ page }) => {
  await bootApp(page, {
    skipSplash: false,
    commands: {
      'plugin:dialog|open': '/tmp/not-a-project',
    },
    fsEmulation: { dirs: [], files: {} },
  });

  await page.getByRole('button', { name: 'Open existing project' }).click();
  await expect(page.getByRole('alert')).toContainText(/not a project/i);
  await expect(page.getByRole('button', { name: 'Open existing project' })).toBeVisible();
  await expect(page.getByTestId('splash-logomark')).toBeVisible();
});

test('cancelling the folder pickers is a silent no-op', async ({ page }) => {
  await bootApp(page, {
    skipSplash: false,
    commands: {
      'plugin:dialog|open': null, // user cancels both pickers
    },
  });

  // Open flow
  await page.getByRole('button', { name: 'Open existing project' }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Open existing project' })).toBeVisible();

  // Create flow
  await page.getByRole('button', { name: 'Start new investigation' }).click();
  await page.getByRole('button', { name: 'Choose parent folder' }).click();
  await expect(page.getByRole('button', { name: 'Create project' })).toBeDisabled();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('button', { name: 'Start new investigation' })).toBeVisible();
});
