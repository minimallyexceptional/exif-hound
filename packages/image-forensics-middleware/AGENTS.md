# image-forensics-middleware — agent guide

**Role:** Image forensics domain — provenance analysis, structure readers, visual identifier detection. Must stay **symmetric** with sibling middleware: injectable readers/recognizers, **`ImageForensicsMiddleware`** class entry point.

Repo root: `../..`. Consumers: **`exif-hound-core`** via `ImageForensicsMiddlewareFacade`. **Do not** import this package from desktop UI code.

---

## Symmetric middleware contract

| Piece | Purpose |
|-------|---------|
| **`ImageForensicsMiddleware`** | Unified class; options for provenance + optional `LocalOcrRecognizer` |
| **`ExifTagLoaderMetadataReader`** | Metadata via **`ExifTagLoader`** from `exif-middleware` (no direct `exifreader`) |
| **`ExifReaderMetadataReader`** | Default reader alias |
| **Structure / provenance ports** | Configurable via `ImageProvenanceAnalyzerOptions` (see `ImageForensicsMiddlewareOptions`) |
| **`LocalOcrRecognizer`** | Injectable OCR for visual identifiers (typically wired from OCR stack in core/desktop bootstrap) |

**Dependency rule:** EXIF tags flow through **`exif-middleware`** only. This package lists `exif-middleware` as a dependency, not `exifreader`.

When extending forensics:

1. Add or extend a **port** (interface) and a **default adapter** where a library is required.
2. Wire the port through **`ImageForensicsMiddleware` constructor options**.
3. Mirror the pattern in **`exif-middleware`** (class + injection + tests with fakes).

---

## Architecture rules

- No imports from `exif-hound-core`, desktop, or unrelated middleware except **`exif-middleware`** and **`ocr-middleware`** types only where already used for recognizer shapes.
- Heavy analysis stays in this package; core facade stays thin.

---

## TDD posture

- Tests live in **`tests/`** (`ImageForensicsMiddleware`, `ExifTagLoaderMetadataReader`, provenance/detector suites).
- Use **fake `ExifTagLoader`** and stub recognizers — no Paddle/OpenCV in unit tests unless explicitly integration-scoped (we have none in CI for this package).
- Run: `npm test --workspace=image-forensics-middleware`.

### Definition of done

- New reader or analyzer path → port + default impl + unit test
- Facade option type updated in core if construction surface changes

---

## Commands

```bash
npm run build --workspace=image-forensics-middleware
npm test --workspace=image-forensics-middleware
npm run lint --workspace=image-forensics-middleware
```

Build **`exif-middleware`** first when working on loader-related types.
