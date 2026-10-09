# Design

## Context

See `proposal.md` for motivation. The OCR package currently wraps Tesseract.js behind a testable worker contract. Workbench OCR node settings are serialized with the workflow, OCR results are append-only project records, and recognized word boxes are optional. The desktop app must remain local-first and run on Linux, macOS, and Windows without platform-specific native OCR binaries.

## Goals / Non-Goals

**Goals:**

- Keep provider choice at the middleware API boundary and the OCR node settings boundary.
- Preserve Tesseract as the default so existing workflows and OCR callers retain their behavior.
- Record the provider and available model version on each result for a valid comparison after project reopen.
- Keep the OCR API and result mapping testable through injected provider/worker boundaries.

**Non-Goals:**

- Pick a permanent winner or change the default OCR provider.
- Change the Visual Text & Identifiers node's OCR engine selection in this iteration.
- Claim PaddleOCR has better accuracy until measured on a representative, labeled Exif Hound image set.
- Synthesize word-level boxes from PaddleOCR line boxes; only return word evidence when the selected engine provides it.

## Decisions

### Use the official PaddleOCR browser SDK with PP-OCRv6 small

Use `@paddleocr/paddleocr-js` with the PP-OCRv6 small detection and recognition models. Paddle's official SDK supports browser inference, worker mode, ONNX Runtime Web, and PP-OCRv6 small; this fits the current React/Tauri architecture without introducing a Python service or native OCR binary. The official PP-OCRv6 evaluation covers varied text conditions including blur, warp, rotation, signage, cards, screens, handwriting, and industrial text. These are vendor-reported results and do not establish superiority to Tesseract for this application's images.

Alternative considered: EasyOCR or docTR. Both are capable OCR systems, but their Python/PyTorch or TensorFlow runtime deployment is a larger cross-platform packaging burden for the existing web-worker architecture. A cloud OCR service is excluded because OCR must remain local and usable offline.

### Keep PaddleOCR assets local and lazy-loaded

Bundle the selected model files and ONNX Runtime Web WASM files with the desktop app and pass explicit local asset paths to the SDK. Initialize the Paddle worker only when a PaddleOCR request is first made, then reuse it for compatible requests. Do not allow SDK defaults to fetch model or WASM assets from a CDN. Record asset loading failures as Paddle-specific errors, with no automatic Tesseract fallback so provider comparisons are not silently invalidated.

### Extend the existing OCR middleware contract

Add a provider selector to each recognize request, defaulting to Tesseract when omitted. Keep the existing text, confidence, progress, and optional word evidence fields; add provider and available model/engine version attribution. The Paddle adapter maps its recognized line text and scores to aggregate text and confidence. Since its SDK returns line-level results, it leaves word-level evidence empty rather than assigning misleading per-word coordinates.

### Store provider attribution in project OCR history

Add provider and available engine/model version columns to the OCR result table through the next project database schema migration. Migrate all existing rows to provider `tesseract`, the only provider available when those results were created. New results store actual provider attribution, and Text output history displays it beside confidence and run time. Workflow serialization already persists OCR node settings; omitted provider values in legacy workflow JSON resolve to Tesseract.

### Keep UI behavior declarative

The OCR node inspector writes the selected provider into the node settings. The workflow handler passes that value to the OCR middleware. The node and inspector do not initialize SDKs, load model assets, or process images.

## Risks / Trade-offs

- [PaddleOCR.js or PP-OCRv6 small behavior may evolve] → Pin the SDK and model asset versions and cover provider mapping with middleware tests.
- [Offline model and WASM assets increase install size and build output] → Measure the packaged release delta; keep assets lazy-loaded at runtime and include only the required English-capable model pair and WASM backend.
- [WebAssembly threading can depend on WebView headers or isolation features] → Start with the baseline single-threaded WASM backend, which avoids relying on cross-origin isolation; validate on each supported desktop WebView.
- [Paddle's benchmark may not match the user's image population] → Treat it as a candidate only and compare both providers on the same labeled local images using character error rate, word error rate, detection misses, and runtime.
- [Paddle's line-level output lacks Tesseract's word boxes] → Keep text/confidence comparable and leave optional word evidence empty; never invent forensic coordinates.
- [Schema migration makes the database newer than older app versions understand] → Keep migration idempotent, preserve all result fields, and validate forward migration against representative existing project databases before release.

## Migration Plan

1. Add and test provider-neutral middleware configuration and Paddle adapter with mocked local assets.
2. Bundle and load the pinned Paddle model/WASM assets in the desktop worker; verify no runtime network requests.
3. Add the OCR node selector and pass its saved provider setting through the workflow handler.
4. Migrate project OCR history with Tesseract attribution for legacy rows, then display provider/model attribution in the Text inspector.
5. Validate provider parity on Windows, macOS, and Linux WebViews and measure packaged size before release.

Rollback is an application release decision: existing OCR outputs remain readable, but an older app that cannot read the new schema version may reject projects after migration. Do not downgrade migrated databases in place; retain an export/backup before applying the new schema during validation.
