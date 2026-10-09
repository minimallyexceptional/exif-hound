import { expect, test } from '@playwright/test';

test('PaddleOCR loads packaged local models and recognizes text without network access', async ({ page }) => {
  test.setTimeout(180_000);
  const externalRequests: string[] = [];
  page.on('request', request => {
    if (!request.url().startsWith('http://127.0.0.1:5276/')) externalRequests.push(request.url());
  });
  await page.goto('/playwright/paddle-ocr-smoke.html');
  const result = page.locator('#result');
  await expect(result).not.toHaveText('running', { timeout: 150_000 });
  const report = await result.textContent();
  expect(report, report ?? 'Missing PaddleOCR report').not.toMatch(/^failed:/);
  const runtime = JSON.parse(report ?? '{}') as { text: string; provider: string; engineVersion: string; words: number };
  expect(runtime.provider).toBe('paddle');
  expect(runtime.engineVersion).toContain('PP-OCRv6_small');
  expect(runtime.text.toUpperCase()).toContain('PADDLE');
  expect(runtime.words).toBe(0);
  expect(externalRequests).toEqual([]);
});
