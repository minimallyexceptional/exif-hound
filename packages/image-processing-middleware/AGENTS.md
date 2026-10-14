# image-processing-middleware — agent guide

**Role:** Raster decode/enhance/preprocess pipeline for investigation imagery. Symmetric middleware: **`ImageProcessingMiddleware`** constructed from injectable **`ImageCodec`** and **`ImageEnhancer`** ports.

Repo root: `../..`. Consumers: **`exif-hound-core`** (`ImageProcessingFacade`, worker scripts in core). Desktop does not import this package directly.

---

## Symmetric middleware contract

| Piece | Purpose |
|-------|---------|
| **`ImageProcessingMiddleware`** | Orchestrates decode → enhance → encode/manifest; takes `codec` + `enhancer` in constructor |
| **`ImageCodec` / `ImageEnhancer`** | Ports (see `src/types.ts`) |
| **`OpenCvImageEnhancer`** | Default enhancer provider (OpenCV.js lives behind this adapter) |
| **Codec implementation** | Supplied by host (e.g. WebView/worker path in core) — keep decode swappable for tests |

Limits (`ImageProcessingLimits`) are middleware policy, not UI concerns.

**Adding behavior:** extend middleware methods or ports; add a new **provider class** for a library; do not call OpenCV directly from `exif-hound-core`.

---

## Architecture rules

- No dependency on `exif-hound-core`, desktop, or EXIF packages.
- Worker offload is configured in **core** (`preprocessImage`, image-processing worker URL); this package stays **worker-agnostic** and testable in Node/Jest with mock codec/enhancer.

---

## TDD posture

- **`tests/ImageProcessingMiddleware.test.ts`** — inject mock codec/enhancer; assert limits, errors, manifest shape.
- **`tests/coordinateMapping.test.ts`** — pure mapping logic.
- Deterministic buffers only; no loading multi-MB assets in unit tests.

```bash
npm test --workspace=image-processing-middleware
```

Core tests cover facade + worker wiring; this package tests **domain pipeline** logic.

---

## Definition of done

- Port signature or processing step change → middleware test + types export
- Rebuild `dist/`; core worker/facade tests if request/manifest contract changes

---

## Commands

```bash
npm run build --workspace=image-processing-middleware
npm test --workspace=image-processing-middleware
npm run lint --workspace=image-processing-middleware
```
