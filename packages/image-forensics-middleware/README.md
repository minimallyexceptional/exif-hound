# Image Forensics Middleware

Framework-independent local services for image provenance indicators and visible text/identifier candidates. The package has no React, Tauri, workflow editor, or project database dependency. Image bytes are read locally; the package does not contact analysis services.

## Provenance indicators

```ts
import { ImageProvenanceAnalyzer } from 'image-forensics-middleware';

const analyzer = new ImageProvenanceAnalyzer();
const result = await analyzer.analyze({
  imageId: 42,
  imageName: 'evidence.jpg',
  bytes: imageBytes,
  metadata: { dateTimeOriginal: '2024:01:01 10:00:00' },
});

console.info(result.facts, result.indicators);
```

The default adapters read metadata with ExifReader and inspect JPEG markers/quantization tables, PNG dimensions, and WebP container identity. Missing or unsupported facts are omitted or identified; malformed supported structures reject with an error. A software tag known to be associated with editing and recorded timestamp relationships are reported as indicators. JPEG table fingerprints and other structure details are observations, not conclusions. The result deliberately has no authenticity or tampering verdict.

## Visible text and identifier candidates

```ts
import { OcrMiddleware } from 'ocr-middleware';
import { VisualIdentifierDetector } from 'image-forensics-middleware';

const ocr = new OcrMiddleware({
  languages: ['eng'],
  workerOptions: { workerPath, corePath, langPath }, // packaged local assets for offline use
});
const detector = new VisualIdentifierDetector(ocr);
try {
  const result = await detector.detect({
    imageId: 42,
    imageName: 'sign.jpg',
    bytes: imageBytes,
    settings: { language: 'eng', enabledFamilies: 'email,url-domain,phone-like,coordinate-pair' },
  }, (progress, status) => console.info(status, progress));
  console.info(result.candidates);
} finally {
  await ocr.dispose();
}
```

The detector delegates recognition and progress to the existing OCR middleware. Candidate rules are local, deterministic pattern matches for email addresses, common domains/URLs, phone-like strings, and coordinate pairs. Word evidence and candidates retain normalized image-space bounding boxes and OCR confidence. The optional `us-general` license-plate profile is never enabled implicitly; a plate-like match is only a candidate, not a vehicle or identity assertion. OCR worker/core/language resources must be packaged locally when the workflow is required to operate offline. The desktop app copies the Tesseract.js worker, compatible WebAssembly cores, and English trained data into its generated `public/ocr/` directory before dev and production builds; those generated assets are ignored by Git and bundled into the app build.

## Test-first development

Readers and OCR are injectable, so tests can cover parsing, findings, confidence, locations, candidate rules, progress, and failures without rendering the app or loading OCR WASM. Run from the repository root:

```sh
npm test --workspace=image-forensics-middleware
npm run typecheck --workspace=image-forensics-middleware
npm run lint --workspace=image-forensics-middleware
npm run build --workspace=image-forensics-middleware
```
