# Spec Delta

## ADDED Requirements

### Requirement: Select a local OCR provider per request
The OCR middleware SHALL let callers select Tesseract or PaddleOCR for each recognition request while preserving a stable common result contract.

#### Scenario: Recognize with Tesseract
- **WHEN** a caller requests recognition with the Tesseract provider
- **THEN** the middleware returns the recognized text, confidence, and any available word evidence from Tesseract

#### Scenario: Recognize with PaddleOCR
- **WHEN** a caller requests recognition with the PaddleOCR provider
- **THEN** the middleware returns recognized text and confidence in the common result format
- **AND** it includes word-level evidence only when the provider supplies valid word-level boxes
- **AND** it does not invent word-level boxes from line-level results

#### Scenario: Provider omitted
- **WHEN** a caller omits the provider
- **THEN** the middleware uses Tesseract for backward compatibility

#### Scenario: Provider unavailable or invalid
- **WHEN** a caller requests an unknown provider or the selected provider cannot initialize
- **THEN** the request fails with an actionable provider-specific error
- **AND** the middleware does not silently run a different provider

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
