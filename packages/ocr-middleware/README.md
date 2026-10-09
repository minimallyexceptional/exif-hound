# OCR Middleware

UI-independent PaddleOCR service for Exif Hound. The package accepts local `Blob` or `Uint8Array` image data and runs PP-OCRv6 small through a reusable worker. It contains no React or Tauri dependencies.

## Basic use

Configure local model and ONNX Runtime WebAssembly assets in the host application:

```ts
import { OcrMiddleware, PaddleOcrWorkerFactory } from 'ocr-middleware';

const ocr = new OcrMiddleware({
  languages: ['eng'],
  workerFactory: new PaddleOcrWorkerFactory({
    detectionModelUrl: '/ocr/paddle/PP-OCRv6_small_det_onnx_infer.tar',
    recognitionModelUrl: '/ocr/paddle/PP-OCRv6_small_rec_onnx_infer.tar',
    wasmPaths: '/ocr/paddle/ort/',
  }),
});

try {
  const result = await ocr.recognize(imageBytes, {
    onProgress: ({ status, progress }) => console.info(status, progress),
  });
  console.info(result.text, result.confidence, result.provider, result.engineVersion);
} finally {
  await ocr.dispose();
}
```

PaddleOCR is the only supported engine. An omitted provider uses PaddleOCR; explicit requests for the removed Tesseract provider fail instead of silently running a different engine. The bundled model currently supports English (`eng` or `en`). Results include recognized text, aggregate confidence from 0 to 100, provider/model attribution, and a `words` collection. PP-OCRv6 small returns line polygons rather than word boxes, so `words` remains empty instead of presenting line boxes as word coordinates.

## Local runtime assets

The desktop app packages `@paddleocr/paddleocr-js` 0.4.2, ONNX Runtime Web 1.30.0, and the PP-OCRv6 small English detection and recognition models. Model archives are Apache-2.0 licensed; source URLs and checksums are in `apps/exif-hound-desktop/assets/ocr/paddle/README.md`. The local worker uses portable single-thread WebAssembly, not platform-specific native binaries. Explicit local paths prevent CDN fallback and let recognition run without network access after installation.

Tesseract was removed from the runtime package and app assets. Historical project OCR rows retain their original Tesseract provider and engine attribution so existing results remain readable; all new OCR rows use PaddleOCR.

## Testing

The worker factory is injectable so service tests can use a fake worker without loading WASM or model data:

```ts
const ocr = new OcrMiddleware({ workerFactory: fakeWorkerFactory });
```

Run package checks from the repository root:

```sh
npm test --workspace=ocr-middleware
npm run typecheck --workspace=ocr-middleware
npm run lint --workspace=ocr-middleware
npm run build --workspace=ocr-middleware
```
