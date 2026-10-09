# Image processing middleware

Proposal for a local preprocessing package that prepares an image once at the Workbench Image node before it is delivered to downstream workflow nodes. This change adds no node type or inspector UI.

## Research summary

- Tesseract guidance recommends adequate character resolution, dark text on a light background, noise reduction, deskewing, and reasonable borders. It notes that Tesseract already binarizes internally and thresholding can be suboptimal for uneven backgrounds, so thresholding should be conditional rather than an unconditional default.
- **OpenCV.js/WebAssembly** is the selected single processing library. Its image operators cover resize, convolution/sharpening, color conversion, median filtering, adaptive thresholding, line detection, affine rotation, and morphology. Bundle one pinned OpenCV.js/WASM runtime locally and expose only the operations this profile needs.
- Pica, ImageJS, and Sharp were evaluated as alternatives and will not be combined with OpenCV.js in this preprocessing layer. In particular, Sharp uses native Node-API/libvips bindings and does not fit the Tauri webview boundary directly.

The image-processing middleware remains a separate domain package. Its adapter wraps only OpenCV.js; browser-native image decode/encode APIs may bridge file bytes and pixel buffers, but no second image-processing library is introduced. Before completing the adapter, verify the required OpenCV.js functions are present in the pinned artifact and record bundle size/performance on supported formats and Linux/macOS/Windows builds.

## Important data-integrity rule

Every downstream node receives an image analysis packet only after preprocessing has completed. The packet retains both immutable source bytes and derived OCR-ready bytes. Pixel-based recognition nodes use processed bytes; provenance parsing uses source bytes and metadata so preprocessing cannot contaminate forensic observations. OCR word boxes map back to normalized source-image coordinates. Original project files are never modified or replaced.

No implementation tasks are generated until the proposal and spec are approved.
