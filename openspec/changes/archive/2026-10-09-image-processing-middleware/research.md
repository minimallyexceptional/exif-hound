# Research notes: OCR preprocessing and one image library

Research performed 2026-10-09 from upstream and library documentation.

## OCR preprocessing findings

Tesseract's quality guide identifies resolution, binarization, noise, character morphology, skew, borders, and alpha as input factors. It says Tesseract works best with at least 300 DPI and resizing may help; for images without meaningful DPI, pixel character size is the practical proxy. Tesseract already binarizes internally, and internal thresholding can be suboptimal on uneven backgrounds. Skew degrades line segmentation, excessive/missing borders can hurt, and modern Tesseract generally expects dark text on a light background. These are conditional observations, not a guarantee every operation improves every image. [Tesseract: Improving the quality of the output](https://tesseract-ocr.github.io/tessdoc/ImproveQuality.html)

OpenCV's thresholding guide explains adaptive thresholding computes local thresholds and can help under varying illumination; it compares global Otsu with adaptive mean and Gaussian methods. [OpenCV: Image Thresholding](https://docs.opencv.org/4.10.0/d7/d4d/tutorial_py_thresholding.html)

## Selected processing library: OpenCV.js/WebAssembly

The app is Tauri + React, and its image middleware runs in the local webview. OpenCV.js provides the single broad processing engine: resize/interpolation, color conversion, convolution for light sharpening, median filtering for noise, adaptive thresholding, Hough lines for skew estimation, affine transforms for deskew, and morphology. These operations cover the planned pipeline without adding separate resize, filter, OCR-preprocessing, or geometry libraries.

The official OpenCV project documents building OpenCV.js/WebAssembly from source, selecting single-file or separate WASM assets, and running browser/Node test suites. [Build OpenCV.js](https://docs.opencv.org/5.0/js_tutorials/js_setup/js_setup/js_setup.html). OpenCV.js is a selected JS binding rather than the entire native C++ API, so the chosen build must be verified for the required symbols. The npm package `@techstark/opencv-js` says its runtime was downloaded from the official docs build; do not assume it exposes operators outside that export set. [@techstark/opencv-js](https://www.npmjs.com/package/@techstark/opencv-js). If a packaged artifact lacks a required symbol, produce one pinned custom OpenCV.js build from upstream sources; do not add another CV package.

## Alternatives evaluated and declined for this layer

- **ImageJS** provides a broad TypeScript image-processing API for browsers and Node.js, but selecting it alongside OpenCV/Pica would violate the single-library constraint and would need custom work for the desired adaptive threshold/skew detection. [ImageJS docs](https://docs.image-js.org/docs/getting-started/)
- **Pica** is a strong browser resizer with optional unsharp masking and WebAssembly/worker/JS implementations, but it does not cover the full cleanup and geometric correction set. [Pica package docs](https://www.npmjs.com/package/pica)
- **Sharp** offers resize, sharpening, grayscale, gamma, and thresholding, but relies on native Node-API/libvips and is not directly callable from a Tauri webview. Using it would require a separate native command boundary. [Sharp package docs](https://www.npmjs.com/package/sharp)

## Recommendation and limits

Use one locally bundled, pinned OpenCV.js/WebAssembly runtime behind the image-processing middleware adapter. Use a baseline WASM build for architecture-independent behavior; SIMD and thread builds are optional performance optimization only. Browser-native decode/encode APIs may bridge common project files into and out of OpenCV pixel matrices, but all enhancement/filtering/geometry operations remain in OpenCV. Test codecs and WASM asset loading under Tauri CSP before implementation is considered complete.

Compare unchanged input with processed output using the same local Tesseract model/options on fixtures that include small text, uneven light, noise, transparent images, EXIF orientation, skew, colored text, and clean high-resolution text. Record character/word error, runtime, memory, and artifact size. Do not claim a universal OCR accuracy gain if results vary by image class.

## Implemented baseline measurements (2026-10-09)

The Chromium Playwright smoke now runs the actual codec → worker → OpenCV → PNG pipeline and compares the bundled local English Tesseract model on six deterministic canvas fixtures. On this Linux Chromium host, source → processed CER/WER was: clean color text 0/0 → 0/0; small text 0/0 → 0/0; uneven light 1/1 → 0/0; strong salt-and-pepper noise 0.778/1 → 0.778/1; 4° four-line skew 0/0 → 0/0; transparent background 0/0 → 0/0. The strong-noise case records a skip for upscale, denoise, sharpen, threshold, and margin because stronger filtering did not improve OCR. First preprocessing took ~0.64 s while the OpenCV worker initialized; subsequent fixture processing took ~0.05–0.25 s. The runtime artifact is 15.5 MB uncompressed / 3.9 MB gzip in the current Vite build.

This synthetic set only catches large regressions for these fixture shapes and the current Linux Chromium/Tesseract stack. It does not constitute validation on native WebViews across every supported OS or prove broad OCR improvement. The package uses a baseline WebAssembly build without SIMD/threads, so it has no target CPU ABI dependency; native WebView testing remains a release matrix item.
