## MODIFIED Requirements

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
