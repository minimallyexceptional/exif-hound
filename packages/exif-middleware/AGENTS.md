# exif-middleware — agent guide

**Role:** EXIF domain middleware — **reference implementation** for symmetric middleware in this monorepo. All other middleware packages should mirror this shape: **port interface → default provider → middleware class → optional functional APIs with injection**.

Repo root: `../..`. Consumers: **`exif-hound-core`** (facade), **`image-forensics-middleware`** (metadata reader port), never the desktop app directly.

---

## Symmetric middleware contract (canonical)

1. **`ExifTagLoader`** — port for tag sources (`loadFlat` / `loadExpanded`).
2. **`ExifReaderTagLoader`** — default provider (wraps `exifreader`).
3. **`defaultExifTagLoader`** — shared default instance.
4. **`ExifMiddleware`** — class bound to a loader for its lifetime (`constructor({ tagLoader })`).
5. **`extractExifData` / `loadExifReaderTags`** — functions accept `{ tagLoader? }` for one-off injection.
6. **Only this package** imports `exifreader` for production code.

When adding features (new tags, GPS rules, formatting):

- Extend behavior **behind the loader or middleware**, not via new hard-coded ExifReader calls scattered outside the provider class.
- Tests **must** use a fake `ExifTagLoader` — never require real binary EXIF in unit tests unless using committed minimal fixtures.

---

## Architecture rules

- **No imports** from `exif-hound-core`, desktop, or other middleware packages.
- **Export surface:** `src/index.ts` + `src/exifTagLoader.ts`; keep tree-shakeable builds (`tsup` → `dist/`).
- Forensics and other packages depend on **`ExifTagLoader`**, not on `exifreader`.

---

## TDD posture

1. Red → green → refactor in **`tests/`** (e.g. `tests/exifTagLoader.test.ts`).
2. Cover: injected loader on functions, `ExifMiddleware` instance binding, GPS/metadata mapping edge cases.
3. Run: `npm test --workspace=exif-middleware` from repo root.
4. No network, no filesystem side effects in unit tests.

### Definition of done

- Port or extraction behavior change → test with mock loader
- Lint/typecheck/test pass for this workspace
- Core facade tests updated only if wiring contract changes

---

## Commands

```bash
npm run build --workspace=exif-middleware
npm test --workspace=exif-middleware
npm run lint --workspace=exif-middleware
npm run typecheck --workspace=exif-middleware
```

Build before desktop dev when changing public API.
