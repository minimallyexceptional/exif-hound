# image-forensics-middleware Specification

## Purpose
Provides local, framework-independent analysis services for image provenance indicators and visible text/identifier candidates used in digital-forensics workflows.

## Requirements

### Requirement: Analyze image provenance indicators locally
The image-forensics middleware SHALL analyze local image bytes and supplied metadata to return normalized image facts and traceable provenance/editing indicators without making remote service requests.

#### Scenario: Report an editing-software metadata indicator
- **WHEN** available metadata explicitly names image-editing software
- **THEN** the analyzer returns a coded indicator with the source metadata field and observed value
- **AND** it does not conclude that the image was manipulated

#### Scenario: Report timestamp inconsistencies
- **WHEN** available capture, digitized, modified, or embedded XMP timestamps conflict or have a suspicious ordering
- **THEN** the analyzer returns each discrepancy with the source fields and normalized values
- **AND** missing timezone or timestamp values are reported as context or unavailable data, not silently inferred

#### Scenario: Report image structure facts
- **WHEN** supported local image structure can be inspected
- **THEN** the analyzer reports format, dimensions, and available JPEG encoding facts such as quantization-table fingerprints and scan/frame markers
- **AND** facts with no validated interpretation are not presented as proof of editing

#### Scenario: Handle incomplete or unsupported metadata
- **WHEN** a metadata field or container structure is absent, malformed, or unsupported
- **THEN** the analyzer returns an explicit unavailable/unsupported field or a typed input error without inventing a value

### Requirement: Detect visible text and identifier candidates locally
The image-forensics middleware SHALL use an injected local OCR provider and deterministic rules to return recognized word evidence and candidate identifiers with source-image coordinates.

#### Scenario: Return OCR word evidence
- **WHEN** OCR recognizes words in a local image
- **THEN** each result word includes text, normalized confidence, and a normalized image-space bounding box
- **AND** existing OCR plain-text and confidence results remain available

#### Scenario: Classify common identifier candidates
- **WHEN** recognized text matches enabled local rules
- **THEN** results may include email, URL/domain, phone-like, or coordinate candidates linked to their source words and bounding boxes
- **AND** each candidate is labeled as a pattern match rather than an identity assertion

#### Scenario: Detect a regional plate candidate
- **WHEN** a user explicitly enables a supported license-plate region profile and recognized text matches its rule
- **THEN** the result is labeled as a plate-like candidate with its profile, source words, confidence, and bounding box

#### Scenario: Do not apply a plate profile implicitly
- **WHEN** no license-plate region profile is selected
- **THEN** the detector does not classify text as a license-plate candidate

#### Scenario: No text or candidate found
- **WHEN** OCR returns no words or no enabled rule matches
- **THEN** detection completes successfully with empty word/candidate collections

### Requirement: Keep image-forensics services independent and testable
The image-forensics middleware SHALL expose typed service APIs with injected boundaries for OCR and image/metadata readers, and SHALL not depend on React, Tauri, the workflow canvas, or project database APIs.

#### Scenario: Test analysis without application services
- **WHEN** package tests provide fake metadata, image-structure, and OCR adapters
- **THEN** they can verify results, progress, failures, and lifecycle without mounting desktop UI, starting native services, or downloading OCR assets

#### Scenario: Identify result provenance
- **WHEN** either analysis service returns a result
- **THEN** it includes a stable result schema/tool version and preserves source fields or word references needed to interpret each finding

#### Scenario: Keep processing local
- **WHEN** either analysis service processes image evidence
- **THEN** it performs analysis on supplied local bytes and configured local OCR assets without invoking a remote analysis endpoint
