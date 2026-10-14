# EXIF Hound Desktop — Archify diagrams

Generated with the [Archify](https://github.com/tt-a1i/archify) skill (architecture diagrams from repository-backed JSON).

## Current diagram

| Artifact | Description |
|----------|-------------|
| [exif-hound-desktop-runtime.html](./architecture-exif-hound-desktop-20261014-114343/exif-hound-desktop-runtime.html) | Runtime architecture: middleware → swappable provider row (exifreader, OpenCV, WebView codec, PaddleOCR), core worker scripts, packages/, sql.js/Nominatim ports, Tauri. |
| [candidate.json](./architecture-exif-hound-desktop-20261014-114343/candidate.json) | Archify source spec (pinned to git revision in `meta.repository`). |
| `*.finalize*.json` | Validation/delivery receipts from `archify finalize`. |

Open the HTML file in a browser. Use `/` to search nodes, focus a component to trace upstream/downstream, and `S` / `T` for style and theme.

## Regenerate

From `apps/exif-hound-desktop`:

```bash
node ~/.agents/skills/archify/bin/archify.mjs finalize architecture \
  .archyify/architecture-exif-hound-desktop-20261014-114343/candidate.json \
  .archyify/architecture-exif-hound-desktop-20261014-114343/exif-hound-desktop-runtime.html \
  --repo-root ../.. \
  --quality showcase \
  --json
```

Update `meta.repository.revision` in `candidate.json` after rebasing if source line evidence must match a new commit.
