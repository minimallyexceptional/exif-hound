# Design: OCR image preparation middleware

## Package boundary

Create `packages/image-processing-middleware` as a TypeScript package with no React, Tauri, workflow-canvas, database, or external-service dependency. Use **OpenCV.js compiled to WebAssembly as the single image-processing library** for resizing, color conversion, sharpening/convolution, noise reduction, adaptive thresholding, line-based skew detection, affine rotation, morphology, and related pixel operations. The package owns profile policy, quality gates, diagnostics, and coordinate mapping; an injected `OpenCvImageProcessor` adapter owns calls into the one OpenCV runtime. Browser-native image decode/encode APIs may bridge `Blob`/`ImageData` but must not perform additional image enhancement. Do not add ImageJS, Pica, Sharp, or a second CV library.

Pin an OpenCV source/runtime version and package its JS/WASM artifacts locally for the Tauri webview. Build or select an artifact that explicitly exposes the needed JS functions (including resize, filter2D, medianBlur, adaptiveThreshold, HoughLines, getRotationMatrix2D, warpAffine, color conversion, and morphology). The implementation's first task must verify the selected runtime exports these operations, works with the app's content security policy and Vite/Tauri asset paths, and runs on each supported host architecture. If an off-the-shelf package omits a required function, use the official OpenCV.js build configuration to produce one pinned project artifact rather than adding another processing library. Measure bundle and startup costs before finalizing packaging.

## Runtime contract

The middleware accepts selected project image bytes, source image ID/name, available orientation metadata, and the versioned profile. It returns an `ImageAnalysisPacket` containing:

- source identity and immutable original bytes;
- processed PNG bytes and source/processed width and height;
- profile and middleware version, ordered applied/skipped operation records, and quality-gate reasons;
- an invertible geometric coordinate transform from processed image space to source image space;
- a typed failure for decode, resource-limit, process, or encode failures.

The packet is an ephemeral run value, not an alternate project image. Each Image node caches the packet for its selected image for one workflow run so multiple branches do not preprocess the same source repeatedly. A new run recomputes it with the active versioned profile. Do not persist processed bytes into the source-image table.

## Default processing profile

The initial `ocr-default-v1` profile is deterministic and conservative:

1. Decode the source and apply metadata orientation to the working pixel buffer while retaining source bytes and orientation facts.
2. Composite transparency over white so OCR does not inherit ambiguous alpha backgrounds.
3. Upscale low-resolution images with aspect ratio preserved using a high-quality interpolator. Do not downscale or crop. Use explicit maximum side/pixel guardrails to avoid unbounded decoded allocations; when source dimensions already exceed the target, leave them unchanged.
4. Convert to luminance/grayscale and apply restrained contrast correction only when the measured range is poor.
5. Apply a low-strength unsharp mask after resize. Avoid hard thresholds and morphology as universal defaults because thin strokes, colored text, and background texture may be damaged.
6. Use quality-gated cleanup only when deterministic local measurements support it: mild noise reduction for isolated high-frequency noise; adaptive threshold for uneven illumination; small-angle deskew only above a confidence threshold. Record every applied operation and its parameters.
7. Encode to lossless PNG for downstream OCR and preserve a small white margin only when no reasonable border exists; record any geometry offset.

The exact thresholds, caps, scale targets, and filter strengths are constants owned by the versioned profile and must be selected using checked-in representative OCR fixtures, not UI settings. The package returns diagnostics and resource usage for progress reporting. It must not claim that enhancement reconstructs detail absent from the original.

## Workbench integration and data integrity

The workflow runner's Image handler performs preprocessing before completing the Image node. Any decode/processing failure fails the Image node and prevents every downstream transform from running; there is no silent raw-image fallback that violates the always-preprocess contract. The image remains highlighted as the active node during this work and reports progress.

All downstream transforms receive the same completed packet. OCR and Visual Text & Identifiers run recognition on processed bytes. Image Provenance reads source bytes and source metadata for container facts and timestamps; this prevents the generated PNG from being mistaken for original evidence. If a future pixel-based transform needs original pixels, it must declare that purpose explicitly rather than silently switching byte streams.

OCR word coordinates are returned in normalized source-image coordinates by applying the packet's inverse geometric map to processed-space boxes. The mapping accounts for orientation, scale, deskew, and added margins. Result history stores source image ID/name, preprocessing profile/version, operation manifest, and run metadata alongside each tool's existing separate results. Only the small manifest is persisted; processed pixels and duplicate original bytes are not copied into result tables.

## Single-library decision

OpenCV.js is selected because its CV operator set can provide the complete processing chain without mixing libraries: high-quality resize, luminance conversion, convolution-based unsharp masking, median denoising, adaptive thresholding, Hough line-based skew estimation, affine deskew, morphology, and image geometry operations. OpenCV.js runs as WebAssembly in the app's webview, so its compiled artifact is independent of the operating system's CPU ABI. Use a baseline WASM artifact for broad architecture compatibility; SIMD/threads variants are not required for correctness.

Some npm packages ship the reduced documentation/tutorial OpenCV.js build. Do not assume those builds expose every operation. Pin and test the selected artifact's API. If necessary, generate one custom OpenCV.js artifact from the official OpenCV source using its JS build/export configuration. That remains one OpenCV library, not a stack of processing libraries. Image decoding from the project's supported formats and lossless PNG output must be validated; webview-native `createImageBitmap`/Canvas may be used only as codecs and pixel-buffer bridges.

## Testing and verification

Tests are written first for byte immutability, image normalization, orientation/alpha, scale caps, luminance/contrast, light sharpening, conditional denoise/threshold/deskew gates, operation manifests, inverse box mapping, malformed/unsupported input, resource limits, cancellation/disposal, and stable output encoding. Workflow tests prove the Image handler preprocesses once before any transform and blocks all nodes on preprocessing failure. Integration tests prove OCR consumes processed bytes, provenance consumes source bytes, and each tool persists the same preprocessing manifest without losing existing result history.

Use local fixtures covering small text, uneven backgrounds, noise, transparent PNG, EXIF orientation, rotated/skewed text, color text, and already-clear high-resolution images. Measure OCR word error/character error against the unchanged input using the same Tesseract model and settings. Enable the default profile only if it does not materially regress clear/color/very small glyph fixtures; record limitations and benchmark runtime/memory across supported Linux, macOS, and Windows host builds. Avoid claims of general accuracy improvement without these fixture results.
