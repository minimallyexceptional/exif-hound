const fs = require('node:fs');
const path = require('node:path');

const appRoot = path.resolve(__dirname, '..');
const output = path.join(appRoot, 'public', 'ocr');
const onnxRuntimeRoot = path.dirname(require.resolve('onnxruntime-web'));
const paddleAssets = path.join(appRoot, 'assets', 'ocr', 'paddle');

fs.rmSync(output, { recursive: true, force: true });
const paddleOutput = path.join(output, 'paddle');
const ortOutput = path.join(paddleOutput, 'ort');
fs.mkdirSync(ortOutput, { recursive: true });
for (const file of [
  'PP-OCRv6_small_det_onnx_infer.tar',
  'PP-OCRv6_small_rec_onnx_infer.tar',
]) {
  fs.copyFileSync(path.join(paddleAssets, file), path.join(paddleOutput, file));
}
// PaddleOCR.js loads ONNX Runtime's jsep WebAssembly build from its default
// browser entry, even when inference is explicitly configured for WASM.
for (const file of ['ort-wasm-simd-threaded.jsep.mjs', 'ort-wasm-simd-threaded.jsep.wasm']) {
  fs.copyFileSync(path.join(onnxRuntimeRoot, file), path.join(ortOutput, file));
}

console.log('Copied local PaddleOCR models and ONNX Runtime WebAssembly assets.');
