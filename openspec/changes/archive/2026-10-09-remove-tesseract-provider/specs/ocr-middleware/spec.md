## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Preserve historical provider attribution
The application SHALL preserve OCR records previously produced by Tesseract while restricting new OCR runs to PaddleOCR.

#### Scenario: Display historical Tesseract results
- **WHEN** the user opens a project containing OCR results attributed to Tesseract
- **THEN** the app displays the saved text and its original Tesseract attribution without attempting to execute Tesseract

#### Scenario: Save new OCR results
- **WHEN** a new OCR result is written to a project
- **THEN** its provider attribution is PaddleOCR
