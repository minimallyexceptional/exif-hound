# Tasks

## 1. Package ports and validation

- [x] 1.1 Add failing package tests for image-bypass chaining, walk-back image-source validation, and rejected data-to-transform connections.
- [x] 1.2 Add `image` to every transform's outputs and walk image inputs back to an Image node with a chosen `imageId`.

## 2. Runner and handlers

- [x] 2.1 Add failing runner tests that a chained transform receives the image packet on `image` and the analysis payload on the data port, without re-running the Image handler.
- [x] 2.2 Extend `NodeResult` with per-port `outputs` and route inbound edges by `sourcePort`.
- [x] 2.3 Emit `{ image, text|evidence }` maps from image, OCR, and forensic handlers while keeping `data` as the persist payload.

## 3. Canvas

- [x] 3.1 Add failing Workbench/NodeFrame tests that transform nodes expose Image and Data source handles.
- [x] 3.2 Support multiple labeled source handles on NodeFrame and update OCR, Provenance, and Text & Identifiers nodes.

## 4. Verification

- [x] 4.1 Run workbench-workflow and desktop Workbench tests.
- [x] 4.2 Run `openspec validate --all`.
