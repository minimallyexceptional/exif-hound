# Design: Workbench OCR results

## Context
The Workbench has a selected image stage and a sidebar of placeholder tools. `packages/ocr-middleware` accepts local image data and reports normalized progress, returning a whole recognized-text string and confidence. The project archive is a folder-backed SQLite database whose current schema version is 2. Loaded `ImageData.id` values are transient, so they are not sufficient as durable database references.

## Decisions
- Use the existing OCR middleware directly from the desktop workflow and run recognition asynchronously. Capture the selected image's durable project identity at start so a later gallery selection change cannot misassociate progress or results.
- Add OCR result persistence to `packages/investigation-archive`. Associate records with the existing image row through its stable database identity (or a validated unique disk path at the API boundary), not the transient UI image ID. The implementation should expose the stable identity when loading project images.
- Store one current successful result per source image. A subsequent successful run replaces that image's previous result. A no-text run does not erase a prior successful result and does not save a blank record.
- Store the middleware's full recognized text as one result entry with confidence and completion metadata. This matches the current middleware contract and gives the results screen one copy action for the extracted text.
- Extend schema version 2 to version 3 with an idempotent migration that adds OCR result storage while preserving existing project tables and rows. Project validation must accept and migrate supported earlier versions rather than rejecting them before migration.
- Show progress in the OCR tool row. On successful persistence, show a View Results action instead of changing screens automatically. On no text, remain on Workbench and open a dialog. On processing or persistence failure, show an error with retry.
- Present results in a full-screen app view with a clear return action. Keep the source image selected when returning. Copy the full text using the system clipboard and show feedback.

## Data and migration
An OCR result is keyed to exactly one project image and contains recognized text, confidence, and a timestamp. Enforce one current result per image. Migration must work when a project created by schema v2 is opened; new projects receive the latest schema. If project image rows are removed in future behavior, referential integrity should prevent orphaned results or cascade their removal.

## UI state
The OCR operation records its source image identity at start. Progress and result status are shown only for that image, even if the user selects another image while the task runs. Completion makes the saved result available on its source image's tool row. Opening results records the source image for the full-screen view; returning restores that image selection. No-text dialog and processing errors are dismissible and leave the Workbench usable.

## Risks
- Existing project databases are validated before opening; migration ordering must change so a supported older database reaches the migration step.
- The database migration and OCR write need failure handling so a recognized result is not reported as saved until the transaction succeeds.
- Tesseract progress events can include engine statuses without a useful numeric increment; the UI should remain accessible and avoid implying exact completion before the result resolves.
- Clipboard access can fail in some runtime contexts; present success only after the write succeeds and expose a useful error if copying fails.

## Validation
Add focused tests for project schema migration and OCR result association, and UI tests for progress, no-text handling, saved-result navigation, return selection, and clipboard feedback. Run existing package and desktop checks plus `openspec validate --all` after implementation.
