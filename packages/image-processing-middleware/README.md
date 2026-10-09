# Image Processing Middleware

This package prepares a deterministic OCR input image at the Workbench Image node boundary. OpenCV.js/WebAssembly (`@opencvjs/web@5.0.0-release.2`) is the **only pixel-processing library**. Browser `ImageBitmap`, Canvas, and `ImageData` are used only for decoding, white alpha compositing, and PNG byte conversion. The app runs OpenCV inside a Vite module worker so processing does not block the UI.

## Runtime and platform support

The pinned OpenCV package embeds its WebAssembly runtime in its JavaScript module (about 13 MB unpacked). The production Vite build emitted a 15.5 MB uncompressed runtime chunk (3.9 MB gzip) on 2026-10-09. The Workbench starts a module worker only when a workflow runs, so this local chunk is not part of the initial app entry download. There is no platform-specific native binary and no network download. Vite bundles the module into the Workbench worker for the current Tauri target, so Linux, macOS, and Windows use the same implementation and local assets. The app's Tauri configuration currently sets `csp` to `null`; if a CSP is introduced, it must permit module workers and WebAssembly compilation (`'wasm-unsafe-eval'` where required by the WebView). Keep image processing out of the main UI thread.

Input decoding is delegated to the operating system WebView's browser image decoder. PNG and JPEG are required; WebP, BMP, GIF, and other formats depend on the installed WebView codec. Unsupported or corrupt input fails the workflow before any downstream tool runs. EXIF orientation is applied by `createImageBitmap`; alpha is composited onto white before OpenCV sees pixels. Processed data is always encoded as PNG.

`ocr-default-v1` currently performs grayscale conversion, image quality measurements, conditional aspect-preserving scale-up (up to 2x), conditional contrast normalization and median denoising, light unsharp masking, conservative high-confidence deskew, conditional adaptive thresholding, and a white margin. Every decision is recorded in the packet manifest with source/processed dimensions and an inverse transform. OCR and text/identifier analysis use processed PNG bytes; provenance analysis uses the immutable source bytes. Coordinates from processed OCR are mapped back to the source image.

The quality gates are conservative heuristics. A Chromium + local English Tesseract fixture run on 2026-10-09 measured these character error rates (CER) and word error rates (WER):

| Fixture | Source CER / WER | Processed CER / WER |
| --- | ---: | ---: |
| Clean color text | 0 / 0 | 0 / 0 |
| Small text | 0 / 0 | 0 / 0 |
| Uneven light | 1 / 1 | 0 / 0 |
| Strong salt-and-pepper noise | 0.778 / 1 | 0.778 / 1 |
| 4° skew (four lines) | 0 / 0 | 0 / 0 |
| Transparent background | 0 / 0 | 0 / 0 |

The noisy fixture is deliberately beyond the safe cleanup gate; preprocessing skips upscale, denoising, sharpening, thresholding, and added margins for that image. The skew fixture exercised deskew at 4° with confidence 1.0. In this local run, first-image preprocessing took about 0.64 s while the worker initialized, then 0.05–0.25 s per fixture. These are synthetic fixtures and one Linux Chromium/Tesseract environment, not a cross-platform accuracy benchmark. The checks prevent large regressions on these fixtures but do not prove broad OCR improvement. Thresholding or denoising may reduce accuracy on other images; manifests record each operation and reason.

## API

`ImageProcessingMiddleware` accepts an `ImageCodec` and an `ImageEnhancer` to make pixel behavior testable without a browser or OpenCV runtime. `process({ imageId, imageName, sourceBytes, onProgress })` returns an immutable source-byte copy, a processed PNG, and a versioned manifest. Invalid, unsupported, oversized, or unencodable images throw `ImageProcessingError` with a stable error code. Default limits are 40 megapixels / 10,000 px per source side and 60 megapixels / 12,000 px per output side.

## Commands

From the repository root:

```sh
npm run build --workspace=image-processing-middleware
npm run test --workspace=image-processing-middleware -- --runInBand
npm run test:runtime --workspace=image-processing-middleware
```

The runtime smoke test runs the actual codec → OpenCV/WebAssembly worker → PNG pipeline and compares local Tesseract CER/WER in Chromium through the desktop Playwright/Vite harness. Node is not a supported runtime for this browser-targeted OpenCV build. The test currently exercises the host Chromium runtime, not native WebViews on every operating system.
