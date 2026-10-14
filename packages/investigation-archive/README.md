# Investigation archive

`ProjectStore` owns project database and project file persistence. Schema format v5 adds:

- `workbench_workflows` for named project workflows and serialized graph state.
- `workflow_runs` for status, start/finish time, active node, counters, and errors.
- Canonical `ocr_results`, `image_provenance_results`, and `visual_identifier_results` rows (at most one per project image per table). Re-running the same workflow replaces that image’s row; runs from other workflows merge extracted JSON (OCR keeps the best confidence).
- Append-only `workflow_runs` for run history and status.

Projects at schema versions 2, 3, and 4 upgrade idempotently on open. The migration preserves each legacy OCR result as a row with its source image and timestamp, and leaves workflow/run IDs null because those records predate workflow execution. Schema v5 is forward-only for older app versions; restore `data/data.db` from a pre-upgrade copy to roll back.

Run `npm test --workspace=investigation-archive` and `npm run typecheck --workspace=investigation-archive` to verify the store and migrations.
