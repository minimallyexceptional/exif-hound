# Spec delta: evidence-hub

## MODIFIED Requirements

### Stored tool results
The investigation archive SHALL store at most one OCR row, one visual-identifier row, and one provenance row per project image ID.

When a workflow persists results for an image that already has a row from the same workflow, the store SHALL replace that row with the new run’s data.

When a workflow persists results for an image that already has a row from a different workflow, the store SHALL merge evidence: OCR retains the run with highest confidence; identifier and provenance payloads SHALL union without duplicate merge keys.

### Evidence aggregation
The Evidence hub SHALL reflect the canonical stored rows. Duplicate UI entries for the same image and same extracted value SHALL NOT appear after a successful upsert.
