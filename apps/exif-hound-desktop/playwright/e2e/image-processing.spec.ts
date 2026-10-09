import { expect, test } from '@playwright/test';

test('OpenCV image preprocessing runtime', async ({ page }) => {
  test.setTimeout(120_000);
  const externalRequests: string[] = [];
  page.on('request', request => {
    if (!request.url().startsWith('http://127.0.0.1:5276/')) externalRequests.push(request.url());
  });
  await page.goto('/playwright/image-processing-smoke.html');
  const result = page.locator('#result');
  await expect(result).not.toHaveText('running', { timeout: 60_000 });
  const report = await result.textContent();
  expect(report, report ?? 'Missing runtime report').not.toMatch(/^failed:/);
  const runtime = JSON.parse(report ?? '{}') as { measurements: Array<{ fixture: string; sourceCer: number; processedCer: number; sourceWer: number; processedWer: number; preprocessMs: number; deskewApplied: boolean; thresholdApplied: boolean; denoiseApplied: boolean; upscaleApplied: boolean; sharpenApplied: boolean; skewDegrees: number; skewConfidence: number; sourceText: string; processedText: string }>; orientationApplied: boolean };
  const results = runtime.measurements;
  console.info('OCR preprocessing fixture metrics:', JSON.stringify(results.map(({ fixture, sourceCer, processedCer, sourceWer, processedWer, preprocessMs, deskewApplied, skewDegrees, skewConfidence }) => ({ fixture, sourceCer, processedCer, sourceWer, processedWer, preprocessMs, deskewApplied, skewDegrees, skewConfidence }))));
  expect(results.map(item => item.fixture)).toEqual(['clean-color', 'small-text', 'uneven-light', 'noise', 'skew', 'transparent']);
  for (const measurement of results) {
    expect(measurement.processedCer).toBeLessThanOrEqual(measurement.sourceCer + 0.25);
    expect(measurement.processedWer).toBeLessThanOrEqual(measurement.sourceWer + 1);
  }
  expect(results.every(item => item.preprocessMs > 0)).toBe(true);
  expect(results.find(item => item.fixture === 'skew')?.deskewApplied).toBe(true);
  expect(results.find(item => item.fixture === 'uneven-light')?.thresholdApplied).toBe(true);
  expect(results.find(item => item.fixture === 'small-text')?.upscaleApplied).toBe(true);
  expect(results.find(item => item.fixture === 'clean-color')?.sharpenApplied).toBe(true);
  expect(results.find(item => item.fixture === 'noise')).toMatchObject({ upscaleApplied: false, denoiseApplied: false, sharpenApplied: false, thresholdApplied: false });
  expect(runtime.orientationApplied).toBe(true);
  expect(externalRequests).toEqual([]);
});
