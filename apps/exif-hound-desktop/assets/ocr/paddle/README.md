# Bundled PaddleOCR models

These official PaddlePaddle ONNX model archives are bundled so PaddleOCR can run without network access after installation.

| Asset | Source | SHA-256 |
| --- | --- | --- |
| `PP-OCRv6_small_det_onnx_infer.tar` | `https://paddle-model-ecology.bj.bcebos.com/paddlex/official_inference_model/paddle3.0.0/PP-OCRv6_small_det_onnx_infer.tar` | `d218f6fbf0f1c23d2161bd6ac7f5eaa6104fa89955c09290497e31008e2618e4` |
| `PP-OCRv6_small_rec_onnx_infer.tar` | `https://paddle-model-ecology.bj.bcebos.com/paddlex/official_inference_model/paddle3.0.0/PP-OCRv6_small_rec_onnx_infer.tar` | `d267ab077a44a0eedb1ea8f8c542d263f211de8e9d7a029bf9fcfff7e5a88fb1` |

The OCR implementation uses `@paddleocr/paddleocr-js` 0.4.2 (Apache-2.0) and ONNX Runtime Web 1.30.0 (MIT). The app's asset-copy script places the model archives and ONNX Runtime's `ort-wasm-simd-threaded.jsep.mjs` and `.wasm` files in `public/ocr/paddle/` at build time. The SDK currently loads this JSEP WASM build even when PaddleOCR is configured to use its WASM backend. Keep the runtime versions pinned and update these checksums when refreshing model archives.
