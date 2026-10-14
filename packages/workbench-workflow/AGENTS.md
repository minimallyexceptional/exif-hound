# workbench-workflow — agent guide

**Role:** Workbench flow engine — portable workflow definitions, step handlers, batch/runner execution. Consumed by **`exif-hound-core`** (`WorkbenchNamespace`); UI in desktop renders flows, not this package.

Repo root: `../..`.

---

## Architecture (non‑negotiable)

- **Pure workflow domain:** JSON/portable workflow shape, handler registry, runner — no React, no Tauri, no Leaflet.
- **No imports** from desktop, core (core imports this package, not the reverse), or middleware except through well-defined DTOs already in use.
- Handler implementations that need EXIF/OCR must be invoked via **interfaces passed from core**, not by importing middleware here unless explicitly approved and kept one-directional.

---

## TDD posture

- **`tests/`** — `workflow`, `runner`, `handlers`, `batch`, `library` (+ `fixtures/portable-workflow.json`).
- Workflow or handler contract change → update fixture JSON and tests together.
- Deterministic: no timers without fake clocks; no network.

```bash
npm test --workspace=workbench-workflow
```

### Definition of done

- New step type or runner behavior → test + fixture update
- Breaking portable format → document in core/desktop release notes path (outside this file)

---

## Symmetry note

If integrating external tools into workflows, define **injectable handler factories** or context ports (same spirit as `ExifTagLoader` / `OcrWorkerFactory`) so tests can register stub handlers without loading OpenCV/OCR.

---

## Commands

```bash
npm run build --workspace=workbench-workflow
npm test --workspace=workbench-workflow
npm run lint --workspace=workbench-workflow
```
