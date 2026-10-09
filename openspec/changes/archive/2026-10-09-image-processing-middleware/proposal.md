# Proposal: Add automatic OCR-oriented image preprocessing

## Why

The Workbench sends original project image bytes directly into OCR-backed transforms. Small text, uneven lighting, noise, transparency, or orientation can lower recognition quality. Preprocessing should be shared and consistent, rather than independently reimplemented by each tool node.

## What changes

- Add a framework-independent `image-processing-middleware` package with one image-processing engine (OpenCV.js/WebAssembly), an injectable adapter boundary, and a deterministic, versioned OCR-preparation profile.
- Run preprocessing in the Image node handler before any downstream workflow node receives that image, regardless of which transform is connected.
- Pass downstream nodes an immutable analysis packet containing original bytes, processed bytes, dimensions, transform metadata, and coordinate mapping. OCR-backed transforms consume processed bytes; Image Provenance continues to inspect original bytes.
- Apply conservative scale-up, orientation/alpha normalization, contrast/grayscale cleanup, and light sharpening by default. Apply stronger denoising, adaptive thresholding, or deskew only through deterministic quality gates with tracked transform metadata.
- Keep preprocessing local, offline, UI-independent, and covered by package-level test-first tests.
- Use one image-processing library for the complete operation set; do not combine resize, filtering, threshold, and geometry libraries.

## Out of scope

- A separate workflow node, node settings, or preprocessing inspector UI.
- Replacing the original project image or saving processed bytes over source evidence.
- Claiming that upscaling recovers missing detail or guarantees higher OCR accuracy.
- Adding OCR models, external services, AI enhancement, or generative reconstruction.
- Changing OCR or provenance interpretation rules beyond consuming the correct byte stream and maintaining source-image coordinates.

## Expected outcome

Every image entering the workflow has passed through one shared preprocessing boundary before any transform runs. Downstream OCR nodes receive a deterministic enhanced representation; forensic metadata and container analysis remain rooted in the untouched source. The preprocessor version and applied operations are retained with each tool result so later findings are interpretable.

## Approval gate

This change is currently at the specification stage. After approval, generate OpenSpec implementation tasks, then implement using red-green-refactor package tests.
