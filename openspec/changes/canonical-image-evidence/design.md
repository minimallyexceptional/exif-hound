# Design: Canonical per-image evidence

## Replace vs merge

| Case | Behavior |
|------|----------|
| Same `imageId` + same `workflowId` | Replace with incoming row (latest run wins) |
| Same `imageId` + different `workflowId` | OCR: keep higher `confidence` (null = 0); tie → newer `processedAt`. Identifiers/provenance: union JSON with stable keys |
| Failed after success (same workflow) | Latest run replaces (may show failed status) |

## Merge keys
- Identifiers: `(family, normalizedValue)` — trim; case-fold emails/urls.
- Provenance: `(code, observedValue ?? '')`.

## Migration v8
- Group existing rows by `image_id`, fold with same rules, delete extras.
- `CREATE UNIQUE INDEX` on `image_id` for each tool table.

## Evidence hub
- Reads `listProject*`; at most one stored row per image per tool.
- `buildEvidenceIndex` dedupes flattened identifier rows defensively.
