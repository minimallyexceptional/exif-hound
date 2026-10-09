# OCR Middleware

UI-independent OCR services for Exif Hound. The package accepts local `Blob` or `Uint8Array` image data and uses Tesseract.js in a reusable worker. It contains no React or Tauri dependencies.

## Basic use

```ts
import { OcrMiddleware } from 'ocr-middleware';

const ocr = new OcrMiddleware({ languages: ['eng'] });

try {
  const result = await ocr.recognize(imageBytes, {
    onProgress: ({ status, progress }) => {
      // progress is a number from 0 to 1
      console.info(status, progress);
    },
  });

  console.info(result.text, result.confidence);
} finally {
  await ocr.dispose();
}
```

`languages` defaults to English (`eng`). A recognition request can override languages; requests submitted to one instance are processed in order, and the worker is reinitialized when the language set changes. The result contains recognized `text`, aggregate `confidence` from 0 to 100, and `words`. Each available word contains its text, confidence from 0 to 100, and a `boundingBox` with normalized `x`, `y`, `width`, and `height` values in image coordinates (0 to 1). Tesseract's pixel coordinates are divided by the source image dimensions. An image with no recognized text resolves with an empty string and an empty word list. Existing callers can continue to use `text` and `confidence` and ignore `words`.

## Worker resources

Tesseract.js worker, core, language-data, and cache paths can be configured for packaged local resources:

```ts
const ocr = new OcrMiddleware({
  languages: ['eng'],
  workerOptions: {
    workerPath: '/resources/worker.min.js',
    corePath: '/resources/tesseract-core',
    langPath: '/resources/traineddata',
    cacheMethod: 'write',
  },
});
```

When paths are omitted, Tesseract.js uses its upstream defaults; browser deployments may fetch trained language data from a CDN. For workflows that must remain offline, configure packaged local worker, core, and language-data resources. Image bytes are passed to the local OCR worker and are not sent to an OCR service. Tesseract word boxes are normalized with `createImageBitmap`; environments without local image-dimension support can still use plain OCR text, but cannot produce word-location evidence.

## Testing

The worker factory is injectable so service tests can use a fake worker without loading WASM or language data:

```ts
const ocr = new OcrMiddleware({ workerFactory: fakeWorkerFactory });
```

Run the package checks from the repository root:

```sh
npm test --workspace=ocr-middleware
npm run typecheck --workspace=ocr-middleware
npm run lint --workspace=ocr-middleware
npm run build --workspace=ocr-middleware
```
