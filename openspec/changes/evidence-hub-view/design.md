# Design: Evidence aggregation (v1)

## Data sources
- `ocr_results`, `visual_identifier_results`, `image_provenance_results` (existing JSON).
- GPS card: EXIF on loaded project images (in-memory + DB exif_json).

## Aggregation
- Desktop `buildEvidenceIndex()` flattens tool JSON into category rows at read time.
- Every stored run is listed (no dedupe) for auditability.

## UI
- `evidence` view mode persisted in investigation_meta like map/list/workbench.
- Layout matches Workbench: full-width content, no map gallery sidebar.

## Performance
- Full-table SELECT acceptable for typical projects; revisit normalized storage if slow.
