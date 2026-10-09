## Purpose

Provides local, deterministic preprocessing that prepares project images for OCR-enabled Workbench workflows while retaining the untouched source evidence.

## ADDED Requirements

### Requirement: Preprocess every workflow image before downstream nodes
The image-processing middleware and Workbench Image node SHALL produce a completed image analysis packet before any downstream workflow node receives the image. Preprocessing SHALL run automatically without a separate node, user setting, or remote service.

#### Scenario: Image enters one or more analysis branches
- **WHEN** a workflow run reaches an Image node that feeds one or more downstream transforms
- **THEN** the Image node preprocesses the selected project image before completing
- **AND** all downstream transforms receive the same completed packet
- **AND** the image is preprocessed only once per selected image per workflow run even when branches share it

#### Scenario: Preprocessing fails
- **WHEN** image decoding, resource validation, processing, or encoding fails
- **THEN** the Image node fails with a typed, user-readable error
- **AND** no downstream transform receives unprocessed bytes as a fallback
- **AND** the workflow run retains its failure state and does not overwrite prior results

#### Scenario: No external service is available
- **WHEN** preprocessing runs on Linux, macOS, or Windows
- **THEN** it uses packaged local code and image data only
- **AND** it makes no network request and requires no service credentials

### Requirement: Improve OCR input with a conservative versioned profile
The middleware SHALL apply a deterministic versioned profile that can upscale low-resolution images, normalize orientation and alpha, improve legibility conservatively, and report all applied operations without replacing source image data.

#### Scenario: Prepare a small image
- **WHEN** a supported image is below the profile's target resolution and within configured pixel and side limits
- **THEN** the middleware enlarges it with aspect ratio preserved using configured high-quality interpolation
- **AND** it applies a light sharpening pass after enlargement
- **AND** it does not crop or downscale the source

#### Scenario: Prepare a clear or already large image
- **WHEN** diagnostics show that an image does not need stronger cleanup or its dimensions meet the scale target
- **THEN** the middleware does not unnecessarily upscale, threshold, denoise, or apply morphology
- **AND** it still emits a processed representation and records which profile operations were applied or skipped

#### Scenario: Uneven illumination or noise is detected
- **WHEN** deterministic local quality checks exceed documented thresholds for uneven illumination or noise
- **THEN** the middleware may apply adaptive thresholding or mild denoising
- **AND** the result manifest records the trigger, operation, and parameters

#### Scenario: Resource limits are exceeded
- **WHEN** decoded dimensions, pixel count, or memory estimate exceed configured safe limits
- **THEN** preprocessing stops with a typed resource-limit failure before allocating an unbounded output buffer
- **AND** it does not silently pass raw image bytes downstream

### Requirement: Preserve original evidence and coordinate provenance
The workflow image analysis packet SHALL retain immutable source bytes separately from processed OCR bytes, identify the profile and operations, and provide an invertible mapping between processed and source image coordinates.

#### Scenario: OCR reads prepared pixels
- **WHEN** OCR or Visual Text & Identifiers processes an image packet
- **THEN** recognition uses processed bytes
- **AND** word bounding boxes are mapped back into normalized coordinates on the original source image
- **AND** persisted OCR history retains those source-coordinate word boxes alongside its preprocessing manifest

#### Scenario: Provenance reads source evidence
- **WHEN** Image Provenance inspects a preprocessed packet
- **THEN** metadata and image-container analysis uses original source bytes and source metadata
- **AND** it does not interpret the generated OCR representation as the original image

#### Scenario: Preserve project image
- **WHEN** preprocessing completes
- **THEN** original project image bytes and metadata remain unchanged
- **AND** processed bytes remain an ephemeral workflow value rather than replacing or duplicating the stored source image

#### Scenario: Persist preprocessing attribution
- **WHEN** a downstream tool result is persisted
- **THEN** its result history identifies preprocessing profile/version and applied-operation manifest
- **AND** it does not copy processed pixels into the tool-result table

### Requirement: Keep preprocessing independent and testable
The image-processing package SHALL expose typed, injectable APIs and SHALL not depend on React, Tauri, workflow UI, or project database APIs. It SHALL use one image-processing library, OpenCV.js compiled to WebAssembly, for resize, filtering, denoising, thresholding, and geometric correction. Its runtime SHALL be locally bundled, compatible with supported desktop platforms and architectures, and replaceable behind one adapter boundary.

#### Scenario: Test algorithms without desktop runtime
- **WHEN** package tests provide deterministic image processor adapters and fixtures
- **THEN** they can test pipeline ordering, output metadata, failures, coordinate mapping, and resource guardrails without mounting the app or invoking Tauri

#### Scenario: Review the preprocessing profile
- **WHEN** a middleware version produces an output
- **THEN** it returns profile/version, input/output dimensions, operation manifest, and warnings needed to interpret the derived image
- **AND** it does not claim upscaling restores missing detail or that every input will produce better OCR

#### Scenario: Use one processing engine
- **WHEN** the middleware prepares an image
- **THEN** all pixel enhancement, filtering, thresholding, and geometry operations run through the single OpenCV.js adapter
- **AND** no additional image-processing library is added for a subset of those operations
- **AND** browser-native APIs may only decode/encode supported formats and bridge pixel buffers
