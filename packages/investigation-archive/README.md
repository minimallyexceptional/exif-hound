# Investigation archive

`ProjectStore` owns project database and project file persistence. Schema format v5 adds:

- `workbench_workflows` for named project workflows and serialized graph state.
- `workflow_runs` for status, start/finish time, active node, counters, and errors.
- An append-only `ocr_results` table with image identity, extracted text, confidence, result status, workflow/run/node IDs, and processing time.
- Append-only `image_provenance_results` and `visual_identifier_results` tables with source image, structured tool result, status, workflow/run/node IDs, tool version, start/finish times, and optional failure details.

Projects at schema versions 2, 3, and 4 upgrade idempotently on open. The migration preserves each legacy OCR result as a row with its source image and timestamp, and leaves workflow/run IDs null because those records predate workflow execution. Schema v5 is forward-only for older app versions; restore `data/data.db` from a pre-upgrade copy to roll back.

Run `npm test --workspace=investigation-archive` and `npm run typecheck --workspace=investigation-archive` to verify the store and migrations.
