# investigation-archive — agent guide

**Role:** Investigation project persistence — archive schema, evidence canonicalization, **`ProjectStore`**, sql.js-backed storage abstractions. Domain **library** consumed by **`exif-hound-core`** (`ArchiveNamespace`, desktop `archiveDbProvider` allowlist).

Repo root: `../..`. Not a “middleware” package in the EXIF/OCR sense, but bound by the same **TDD and boundary** rules: no UI, no upward imports into core/desktop from here.

---

## Architecture (non‑negotiable)

```
Desktop (allowlisted archiveDbProvider)  →  core archive APIs  →  investigation-archive (this package)
```

- **Schema and evidence rules** live here; core exposes facades and desktop registers DB provider implementation.
- **Do not** import React, Tauri, or `apps/exif-hound-desktop`.
- **Do not** import middleware packages unless a future, reviewed dependency is required (currently avoid).

Persistence must stay **testable without Tauri**: use in-memory or fixture DB paths in `tests/`.

---

## TDD posture

- Tests in **`tests/`** (`ProjectStore`, `canonicalEvidence`, `format`, …).
- Migrations/schema changes → tests that assert round-trip read/write and error types.
- Run: `npm test --workspace=investigation-archive`.

### Definition of done

- Schema or evidence behavior change → regression test with minimal fixture data
- No PII or real case data in committed fixtures

---

## Symmetry note

Archive is not required to expose a `*Middleware` class. If you add swappable backends (e.g. alternate storage engines), use the same **port + default implementation** pattern as EXIF/OCR middleware for consistency.

---

## Commands

```bash
npm run build --workspace=investigation-archive
npm test --workspace=investigation-archive
npm run lint --workspace=investigation-archive
```
