import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { contentTypeForOcrAsset, resolvePublicOcrPath } from '../../utils/ocrPublicAsset';

describe('resolvePublicOcrPath', () => {
  const ocrRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ocr-public-'));

  beforeAll(() => {
    fs.mkdirSync(path.join(ocrRoot, 'paddle'), { recursive: true });
    fs.writeFileSync(path.join(ocrRoot, 'paddle', 'model.tar'), 'ustar');
  });

  afterAll(() => {
    fs.rmSync(ocrRoot, { recursive: true, force: true });
  });

  it('resolves packaged OCR assets from disk', () => {
    expect(resolvePublicOcrPath('/ocr/paddle/model.tar', ocrRoot)).toBe(
      path.join(ocrRoot, 'paddle', 'model.tar'),
    );
  });

  it('ignores query strings', () => {
    expect(resolvePublicOcrPath('/ocr/paddle/model.tar?download=1', ocrRoot)).toBe(
      path.join(ocrRoot, 'paddle', 'model.tar'),
    );
  });

  it('rejects path escape attempts and non-ocr URLs', () => {
    expect(resolvePublicOcrPath('/ocr/../package.json', ocrRoot)).toBeNull();
    expect(resolvePublicOcrPath('/favicon.ico', ocrRoot)).toBeNull();
    expect(resolvePublicOcrPath('/ocr/paddle/', ocrRoot)).toBeNull();
  });
});

describe('contentTypeForOcrAsset', () => {
  it('serves ONNX Runtime JS modules as JavaScript', () => {
    expect(contentTypeForOcrAsset('ort-wasm-simd-threaded.jsep.mjs')).toBe('text/javascript');
  });

  it('serves wasm and model archives with their native types', () => {
    expect(contentTypeForOcrAsset('ort-wasm-simd-threaded.jsep.wasm')).toBe('application/wasm');
    expect(contentTypeForOcrAsset('PP-OCRv6_small_det_onnx_infer.tar')).toBe('application/x-tar');
  });
});
