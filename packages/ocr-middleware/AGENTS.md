# ocr-middleware — agent guide

**Role:** OCR domain middleware — text recognition with injectable **`OcrWorkerFactory`** and per-request **`OcrProvider`**. **`OcrMiddleware`** class manages worker lifecycle and queuing.

Repo root: `../..`. Consumers: **`exif-hound-core`** (re-exports / `OcrMiddlewareFacade` patterns). Forensics may use **`LocalOcrRecognizer`** adapters wired at bootstrap, not raw desktop imports of this package.

---

## Symmetric middleware contract

| Piece | Purpose |
|-------|---------|
| **`OcrMiddleware`** | Entry class; options: `workerFactory`, default `languages` |
| **`OcrWorkerFactory` / `OcrWorker`** | Port for creating isolated OCR workers |
| **`PaddleOcrWorkerFactory`** | Default provider (PaddleOCR / ONNX assets) |
| **`OcrProvider`** | Per-`recognize()` override for tests or alternate engines |
| **`recognize(blob, { provider?, onProgress? })`** | Functional injection at call time |

New engines: implement **`OcrWorkerFactory`** or **`OcrProvider`**, pass via constructor/`recognize` options — do not branch on environment flags inside core UI.

---

## Architecture rules

- Paddle/ONNX specifics stay in this package and desktop static assets (`public/ocr/`), not in React components.
- No imports from `exif-hound-core` or desktop.
- Dispose semantics (`OcrDisposedError`) are part of the public contract — preserve on refactor.

---

## TDD posture

- **`tests/OcrMiddleware.test.ts`**, **`ProviderSelection.test.ts`**, **`PaddleOcrWorkerFactory.test.ts`** (factory wiring; avoid full model inference in CI).
- Mock **`OcrWorker`** / factory; assert queue, language normalization, disposal.
- No downloading models in unit tests.

```bash
npm test --workspace=ocr-middleware
```

---

## Definition of done

- Lifecycle or provider selection change → unit test with doubles
- Large binary assets remain out of git; document paths in desktop README if asset layout changes

---

## Commands

```bash
npm run build --workspace=ocr-middleware
npm test --workspace=ocr-middleware
npm run lint --workspace=ocr-middleware
```
