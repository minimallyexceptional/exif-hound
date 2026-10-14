# exif-hound-core — agent guide

**Role:** Application-facing orchestration layer. Desktop and tests import **`exif-hound-core`**, not individual middleware packages (except the allowlisted archive wiring in the desktop app).

Repo root: `../..` from this package. Runtime diagram: `apps/exif-hound-desktop/.archyify/…/exif-hound-desktop-runtime.html`.

---

## Architecture (non‑negotiable)

### Layering

```
Desktop UI  →  exif-hound-core (this package)
                 →  middleware packages (domain + ports)
                      →  provider libraries
Workers:  src/workers/*  (EXIF + image-processing; desktop bundles via Vite ?worker&url)
Platform:  src/platform/desktop/*  (Tauri FS, dialogs, archive DB registration)
```

### What belongs here

- **`ExifHoundCore`**, namespaces (`middleware`, `archive`, `workbench`, `evidence`, `updater`, …)
- **Facades** that wrap middleware classes (`ExifMiddlewareFacade`, `ImageProcessingFacade`, `ImageForensicsMiddlewareFacade`, `GeocodingFacade`, …)
- **Injectable ports** configured at core boundary (`ReverseGeocodingProvider`, `configureImageProcessingMiddleware`, worker URL via `createDesktopCore`)
- Project session, import/export, geocoding orchestration, updater abstractions

### What must not live here

- Direct React or Tauri UI code
- Re-implementing EXIF/OCR/OpenCV logic that belongs in middleware packages
- Importing `apps/exif-hound-desktop`

### Facade rule

Facades are **thin**: construct or hold a middleware instance, forward calls, re-export types. New domain behavior goes in the **middleware package first**, then expose through a facade + `MiddlewareNamespace` option if injectable.

### Dependency direction

- Core **may depend on** middleware packages and `investigation-archive` / `workbench-workflow` where already wired.
- Middleware packages **must not depend on** core or desktop.
- `image-forensics-middleware` depends on `exif-middleware` for `ExifTagLoader`, not on `exifreader` directly.

---

## Symmetric middleware (core’s view)

| Facade | Middleware package | Primary ports |
|--------|-------------------|---------------|
| `ExifMiddlewareFacade` | `exif-middleware` | `ExifTagLoader` |
| `ImageProcessingFacade` | `image-processing-middleware` | `ImageCodec`, `ImageEnhancer` |
| `ImageForensicsMiddlewareFacade` | `image-forensics-middleware` | metadata/structure readers, `LocalOcrRecognizer` |
| `GeocodingFacade` / geocoding module | N/A (core service) | `ReverseGeocodingProvider` |
| OCR exports | `ocr-middleware` | `OcrWorkerFactory`, `OcrProvider` |

When adding a new integration, extend the **middleware port + class**, then add or extend a **facade** and **`MiddlewareNamespaceOptions`**.

---

## TDD posture

1. **Tests first** for behavior changes in facades, geocoding, project/archive, and worker message contracts.
2. **Own tests here:** `tests/` mirrors domains (`middleware/`, `geocoding/`, `project/`, …).
3. **Do not** duplicate middleware unit tests in core — core tests assert **wiring and forwarding** (e.g. facade passes `tagLoader`, provider overrides Nominatim).
4. Use documented test hooks: `resetCoreForTests`, `configureReverseGeocodingProvider(null)`, `__resetImageProcessingMiddlewareForTests`, `__setPreprocessImageForTests`, etc.
5. **Deterministic:** no live Nominatim, no real Tauri in unit tests.

### Commands

From repo root:

```bash
npm test --workspace=exif-hound-core
npm run lint --workspace=exif-hound-core
npm run typecheck --workspace=exif-hound-core
npm run build --workspace=exif-hound-core
```

Pre-commit and CI run this workspace’s Jest suite with other packages.

### Definition of done

- Facade/namespace change → test in `packages/exif-hound-core/tests/`
- Public export change → update `src/index.ts` deliberately; avoid leaking middleware internals beyond existing re-exports
- Build `dist/` before desktop consumes new APIs

---

## OpenSpec

New **product features** start with OpenSpec at repo root (`openspec/`). Core changes that only support an approved spec still need tests; do not expand product behavior without spec approval when the spec process applies (see desktop `AGENTS.md`).
