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
The OCR middleware SHALL allow callers to configure supported language codes and local PaddleOCR model and WebAssembly resources without requiring UI-specific configuration.

#### Scenario: Configure alternate language
- **WHEN** a caller configures a language supported by the bundled PaddleOCR model
- **THEN** the worker uses the bundled model for that language
- **AND** unsupported language requests fail with a clear error

#### Scenario: Configure local worker resources
- **WHEN** a caller supplies local detection-model, recognition-model, and ONNX Runtime WebAssembly paths
- **THEN** those paths are used to initialize the PaddleOCR worker

### Requirement: Isolate OCR from presentation code
The OCR package SHALL expose a framework-independent PaddleOCR API and an injectable worker boundary so recognition lifecycle and result mapping can be tested without loading PaddleOCR WASM assets.

#### Scenario: Test with fake worker
- **WHEN** the OCR service is constructed with a fake worker
- **THEN** callers can verify recognition, progress, failure, reuse, and disposal behavior without loading browser UI or downloading model data

### Requirement: Select a local OCR provider per request
The OCR middleware SHALL use PaddleOCR as its only supported provider and SHALL return the stable common OCR result contract.

#### Scenario: Recognize with Tesseract
- **WHEN** a caller explicitly requests the removed Tesseract provider
- **THEN** the middleware rejects the request with an unsupported-provider error

#### Scenario: Recognize with PaddleOCR
- **WHEN** a caller requests PaddleOCR or omits a provider
- **THEN** the middleware runs the local PaddleOCR model and returns text, confidence, provider attribution, engine/model version, and any valid word-level evidence
- **AND** it does not invent word-level boxes from line-level results

#### Scenario: Provider omitted
- **WHEN** a caller omits the provider
- **THEN** the middleware uses PaddleOCR

#### Scenario: Provider unavailable or invalid
- **WHEN** a caller requests Tesseract, an unknown provider, or PaddleOCR cannot initialize
- **THEN** the request fails with an actionable unsupported-provider error
- **AND** the middleware does not silently run another provider

### Requirement: Keep provider execution local and offline-capable
Both OCR providers SHALL run locally without transmitting image data, and their required runtime and model assets SHALL be available without network access at recognition time.

#### Scenario: Run without network access
- **WHEN** a caller recognizes an image while the device has no network connection
- **THEN** the selected provider completes using locally available assets or reports a clear missing-asset error
- **AND** it makes no network request to fetch models, runtime code, or image data

#### Scenario: Run on supported desktop targets
- **WHEN** the middleware runs in a supported Linux, macOS, or Windows desktop WebView on a supported processor architecture
- **THEN** it uses a compatible portable runtime without requiring an architecture-specific native OCR binary

### Requirement: Attribute OCR results to their provider
Each recognition result SHALL identify the provider and model/runtime version used so downstream storage and review can distinguish test outputs.

#### Scenario: Return provider attribution
- **WHEN** recognition completes successfully
- **THEN** the result includes the selected provider and an available engine or model version identifier

#### Scenario: Preserve provider attribution on no-text results
- **WHEN** recognition completes successfully but finds no text
- **THEN** the empty result still identifies the provider and engine or model version used

### Requirement: Preserve historical provider attribution
The application SHALL preserve OCR records previously produced by Tesseract while restricting new OCR runs to PaddleOCR.

#### Scenario: Display historical Tesseract results
- **WHEN** the user opens a project containing OCR results attributed to Tesseract
- **THEN** the app displays the saved text and its original Tesseract attribution without attempting to execute Tesseract

#### Scenario: Save new OCR results
- **WHEN** a new OCR result is written to a project
- **THEN** its provider attribution is PaddleOCR
