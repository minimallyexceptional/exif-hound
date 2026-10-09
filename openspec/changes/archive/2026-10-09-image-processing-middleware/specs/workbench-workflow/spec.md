## ADDED Requirements

### Requirement: Preprocess Image node data before workflow dispatch
The Workbench SHALL invoke image-processing middleware from the Image node handler before that handler completes and before any connected transform receives input. This behavior SHALL remain invisible in the node catalog and shall not introduce preprocessing UI or inspector settings.

#### Scenario: Run a branch from an Image node
- **WHEN** a workflow run executes an Image node connected to any transform
- **THEN** the runner awaits preprocessing before emitting Image-node completion or starting that transform
- **AND** every downstream node receives the shared packet containing original bytes, processed bytes, and preprocessing attribution

#### Scenario: Branches share one Image node
- **WHEN** multiple transforms consume the same Image node during one workflow run
- **THEN** the image is preprocessed once and the same immutable packet is shared across branches

#### Scenario: Processing is unavailable for the source image
- **WHEN** preprocessing fails for an Image node
- **THEN** the node and workflow run fail visibly
- **AND** the runner skips every downstream node on that image path

### Requirement: Pass the correct image representation to each analysis transform
Workbench transform handlers SHALL select source or processed image data by analysis purpose and carry preprocessing attribution into each persisted result.

#### Scenario: Run OCR-enabled transform
- **WHEN** OCR or Visual Text & Identifiers runs
- **THEN** the handler supplies processed image bytes to OCR middleware
- **AND** translates returned word locations through the inverse transform to original-image coordinate space

#### Scenario: Run image provenance transform
- **WHEN** Image Provenance runs
- **THEN** the handler supplies original image bytes and source metadata to provenance middleware
- **AND** associates the result with the packet's preprocessing manifest without changing its analysis input

#### Scenario: Persist tool result
- **WHEN** an OCR, provenance, or identifier result is appended to the project database
- **THEN** it records preprocessing profile/version and applied-operation manifest for that run
