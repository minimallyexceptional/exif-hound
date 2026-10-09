# ocr-middleware Specification

## Purpose
Provides a UI-independent API for recognizing text in local image data and managing the resources needed for OCR across desktop app features.

## Requirements

### Requirement: Recognize text from local images
The OCR middleware SHALL accept local image data and return recognized text with a confidence value from 0 to 100, with optional word-level evidence containing normalized confidence and image-space bounding boxes.

#### Scenario: Recognize image text
- **WHEN** a caller submits image bytes or a Blob with one or more language codes
- **THEN** the API resolves with recognized text and confidence without transmitting the image to a remote service

#### Scenario: Return word-level evidence
- **WHEN** the OCR engine supplies recognized word data and a caller uses the OCR result
- **THEN** the result includes each available word's text, confidence normalized from 0 to 100, and a bounding box normalized to image coordinates from 0 to 1
- **AND** callers may ignore the additive word collection and continue using plain text and aggregate confidence

#### Scenario: No text found
- **WHEN** a valid image contains no recognizable text
- **THEN** the API resolves with empty text, a confidence value, and an empty word collection rather than treating the image as an engine failure

#### Scenario: Default language
- **WHEN** a caller omits language codes
- **THEN** the API uses English recognition

### Requirement: Report recognition progress
The OCR middleware SHALL allow each recognition request to receive progress events associated with that request.

#### Scenario: Progress callback supplied
- **WHEN** a caller supplies a progress callback for a recognition request
- **THEN** the API reports the engine status and normalized progress from 0 to 1 for that request

#### Scenario: No progress callback
- **WHEN** a caller omits a progress callback
- **THEN** recognition completes without requiring a UI or logging side effect

#### Scenario: Concurrent recognition requests
- **WHEN** multiple calls are submitted through the same middleware instance
- **THEN** each result and progress callback remains associated with its own request

### Requirement: Manage OCR worker lifecycle
The OCR middleware SHALL create its recognition worker lazily, reuse it for compatible requests, and provide an asynchronous disposal operation that terminates the worker.

#### Scenario: Reuse worker
- **WHEN** multiple compatible recognition requests run through one middleware instance
- **THEN** the same worker is reused rather than initialized for every image

#### Scenario: Dispose worker
- **WHEN** the caller disposes the middleware instance
- **THEN** the worker is terminated and subsequent recognition requests reject with a clear lifecycle error

#### Scenario: Dispose before recognition
- **WHEN** the caller disposes an instance before submitting an image
- **THEN** no worker is created and subsequent recognition requests reject with a clear lifecycle error

### Requirement: Configure languages and engine resources
The OCR middleware SHALL allow callers to configure language codes and Tesseract worker resources without requiring UI-specific configuration.

#### Scenario: Configure alternate language
- **WHEN** a caller configures a non-default language or language combination
- **THEN** the worker performs recognition using those language codes

#### Scenario: Configure local worker resources
- **WHEN** a caller supplies worker, core, or language-data resource paths
- **THEN** those paths are forwarded to worker creation

### Requirement: Isolate OCR from presentation code
The OCR package SHALL expose a framework-independent API and an injectable worker boundary so recognition lifecycle and result mapping can be tested without Tesseract WASM assets.

#### Scenario: Test with fake worker
- **WHEN** the OCR service is constructed with a fake worker factory
- **THEN** callers can verify recognition, progress, failure, reuse, and disposal behavior without loading browser UI or downloading language data
