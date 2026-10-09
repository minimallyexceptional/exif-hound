# Design: OCR Middleware

## Context

Shared packages are TypeScript workspaces built with `tsup`. The desktop app is Tauri + React, but this package must remain host- and UI-independent. Tesseract.js v7 is the selected OCR engine; it creates workers asynchronously, supports worker reuse, language reinitialization, progress logging, and asynchronous termination. In browser mode its core and trained language data can be configured through worker paths; upstream defaults may download language data when needed.

## Goals / Non-Goals

**Goals:**

- Offer a small typed API for local image-to-text recognition.
- Own worker creation, language switching, progress routing, and cleanup behind an object boundary.
- Keep orchestration testable with a fake worker factory, without starting workers or downloading OCR assets in unit tests.
- Follow red-green-refactor: introduce failing behavior tests first, implement only enough to pass, and refactor with the suite green.

**Non-Goals:**

- UI integration, persistence of OCR results, image preprocessing, PDF recognition, batching/scheduling across multiple workers, or custom OCR model training.
- Shipping OCR worker/WASM/traineddata assets inside the desktop app in this change. Resource paths remain configurable; bundled/offline asset delivery can be handled separately.

## Decisions

### A small facade with an injected engine boundary

Expose an `OcrMiddleware` class with `recognize(image, options?)` and `dispose()`. Its constructor accepts engine resource options and an injectable worker factory, defaulting to a Tesseract.js-backed factory. The internal worker contract covers recognition, language reinitialization, and termination. This keeps Tesseract-specific worker mechanics out of future UI callers while making orchestration unit-testable.

**Alternative considered:** Export Tesseract.js workers directly. This couples every caller to engine lifecycle, complicates later engine changes, and makes core tests depend on WASM setup.

### Reuse one worker and serialize requests per instance

Create the worker on first recognition and reuse it. Queue calls on one instance so language changes and progress callbacks cannot race; reinitialize the worker when a request's language set differs from the active set. Each job receives the current request's progress callback. `dispose()` waits for queued work, terminates the worker once, and permanently closes the instance.

**Alternative considered:** Create a worker for every image. This avoids shared state but repeatedly pays initialization and traineddata costs, contrary to Tesseract.js guidance to reuse workers.

### Normalize the public result

Accept `Blob` and `Uint8Array` image inputs. Return only recognized text and confidence (0–100) in the initial API, with an optional progress callback that receives status and a clamped 0–1 progress value. Use English when the caller does not specify language codes. Avoid exposing Tesseract's entire evolving result structure until a consumer needs it.

**Alternative considered:** Return all vendor data, including blocks/TSV/HOCR. That expands the public contract and package scope before the OCR UI identifies what it needs.

### Keep resource locations configurable

Pass optional Tesseract worker/core/language paths and cache options through the package's engine configuration. Do not hard-code a remote host. This allows a later desktop integration to provide packaged local resources without changing the OCR service contract.

**Alternative considered:** Hard-code upstream CDN defaults. This would make offline use and future local asset packaging harder and would make the package impose a network location.

## Risks / Trade-offs

- **Tesseract.js worker/WASM behavior differs between browser and Node tests** → Unit tests target the injected worker contract; the adapter receives separate type/build checks and a mocked factory test.
- **The default browser language data may be fetched from an upstream CDN** → Make resource paths configurable and document that image bytes stay local while traineddata may be fetched by upstream defaults; local asset packaging remains a follow-up.
- **Serialized calls limit throughput per service instance** → The OCR UI is expected to process one selected image at a time; a multi-worker scheduler can be introduced later if measured workloads need it.

## Migration Plan

No existing API or persisted data changes. Add the workspace package and dependency, build it in the existing package pipeline, and leave the Workbench unconnected until the OCR UI feature is specified.
