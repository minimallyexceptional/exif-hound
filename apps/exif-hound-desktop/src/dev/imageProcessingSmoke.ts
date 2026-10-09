import { preprocessImage } from '../utils/preprocessImage';
import { OcrMiddleware, PaddleOcrWorkerFactory } from 'ocr-middleware';

const output = document.querySelector<HTMLPreElement>('#result');
if (!output) throw new Error('Missing smoke output element.');
try {
  const ocr = new OcrMiddleware({ workerFactory: new PaddleOcrWorkerFactory({
    detectionModelUrl: new URL('/ocr/paddle/PP-OCRv6_small_det_onnx_infer.tar', window.location.href).toString(),
    recognitionModelUrl: new URL('/ocr/paddle/PP-OCRv6_small_rec_onnx_infer.tar', window.location.href).toString(),
    wasmPaths: new URL('/ocr/paddle/ort/', window.location.href).toString(),
  }) });
  const fixtures = ['clean-color', 'small-text', 'uneven-light', 'noise', 'skew', 'transparent'];
  const results: Array<{ fixture: string; sourceCer: number; processedCer: number; sourceWer: number; processedWer: number; preprocessMs: number; deskewApplied: boolean; thresholdApplied: boolean; denoiseApplied: boolean; upscaleApplied: boolean; sharpenApplied: boolean; skewDegrees: number; skewConfidence: number; sourceText: string; processedText: string }> = [];
  try {
    for (const fixture of fixtures) {
      const { blob, expected } = await makeFixture(fixture);
      const sourceBytes = new Uint8Array(await blob.arrayBuffer());
      const preprocessStarted = performance.now();
      const packet = await preprocessImage(1, `${fixture}.png`, sourceBytes, () => {});
      const preprocessMs = Math.round(performance.now() - preprocessStarted);
      const processed = new Blob([packet.processedBytes.slice().buffer as ArrayBuffer], { type: 'image/png' });
      if (packet.manifest.engine !== 'opencv.js' || packet.manifest.operations.length < 5) throw new Error('Middleware returned an incomplete manifest.');
      const before = await ocr.recognize(blob, { languages: 'eng' });
      const after = await ocr.recognize(processed, { languages: 'eng' });
      const applied = (name: string) => packet.manifest.operations.some(operation => operation.name === name && operation.applied);
      results.push({ fixture, sourceCer: characterErrorRate(expected, before.text), processedCer: characterErrorRate(expected, after.text), sourceWer: wordErrorRate(expected, before.text), processedWer: wordErrorRate(expected, after.text), preprocessMs, deskewApplied: applied('deskew'), thresholdApplied: applied('adaptive-threshold'), denoiseApplied: applied('median-denoise'), upscaleApplied: applied('upscale'), sharpenApplied: applied('light-sharpen'), skewDegrees: packet.manifest.quality.skewDegrees, skewConfidence: packet.manifest.quality.skewConfidence, sourceText: before.text, processedText: after.text });
    }
  } finally {
    await ocr.dispose();
  }
  const orientedJpeg = await makeOrientedJpeg();
  const orientedPacket = await preprocessImage(2, 'orientation-6.jpg', new Uint8Array(await orientedJpeg.arrayBuffer()), () => {});
  if (orientedPacket.manifest.sourceWidth !== 90 || orientedPacket.manifest.sourceHeight !== 180) {
    throw new Error(`EXIF orientation was not applied: ${orientedPacket.manifest.sourceWidth}x${orientedPacket.manifest.sourceHeight}`);
  }
  output.textContent = JSON.stringify({ measurements: results, orientationApplied: true });
} catch (error) {
  output.textContent = `failed: ${error instanceof Error ? error.stack ?? error.message : String(error)}`;
}

async function makeOrientedJpeg(): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = 180;
  canvas.height = 90;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is unavailable.');
  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#111';
  context.font = '28px Arial, sans-serif';
  context.fillText('ORIENTATION', 12, 50);
  const jpeg = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('JPEG fixture encoding failed.')), 'image/jpeg'));
  const tiff = new Uint8Array([0x49, 0x49, 0x2a, 0, 8, 0, 0, 0, 1, 0, 0x12, 0x01, 3, 0, 1, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0]);
  const exif = new Uint8Array([0x45, 0x78, 0x69, 0x66, 0, 0, ...tiff]);
  const segment = new Uint8Array(exif.length + 4);
  segment.set([0xff, 0xe1, (exif.length + 2) >> 8, (exif.length + 2) & 0xff]);
  segment.set(exif, 4);
  const original = new Uint8Array(await jpeg.arrayBuffer());
  const rotated = new Uint8Array(original.length + segment.length);
  rotated.set(original.subarray(0, 2), 0);
  rotated.set(segment, 2);
  rotated.set(original.subarray(2), 2 + segment.length);
  return new Blob([rotated.buffer as ArrayBuffer], { type: 'image/jpeg' });
}

async function makeFixture(kind: string): Promise<{ blob: Blob; expected: string }> {
  const width = 720;
  const height = kind === 'skew' ? 360 : 180;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is unavailable.');
  const gradient = context.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, kind === 'uneven-light' ? '#8b8b8b' : '#fff');
  gradient.addColorStop(1, '#fff');
  if (kind !== 'transparent') {
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
  }
  if (kind === 'noise') {
    const noise = context.getImageData(0, 0, width, height);
    let seed = 19;
    for (let i = 0; i < noise.data.length; i += 4) {
      seed = (seed * 16807) % 2147483647;
      const value = seed / 2147483647;
      if (value < 0.12) noise.data[i] = noise.data[i + 1] = noise.data[i + 2] = value < 0.06 ? 0 : 180;
    }
    context.putImageData(noise, 0, 0);
  }
  context.save();
  if (kind === 'skew') { context.translate(width / 2, height / 2); context.rotate(4 * Math.PI / 180); context.translate(-width / 2, -height / 2); }
  context.fillStyle = kind === 'clean-color' ? '#b00020' : '#111';
  context.font = `${kind === 'small-text' ? 15 : 42}px Arial, sans-serif`;
  const lines = kind === 'skew' ? [66, 140, 214, 288] : [104];
  lines.forEach(y => context.fillText('OSINT 2026', 34, y));
  context.restore();
  const mimeType = kind === 'clean-color' ? 'image/jpeg' : 'image/png';
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Fixture encoding failed.')), mimeType));
  return { blob, expected: lines.map(() => 'OSINT 2026').join(' ') };
}

function characterErrorRate(expected: string, actual: string): number {
  const left = expected.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const right = actual.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let row = 1; row <= left.length; row += 1) {
    let diagonal = previous[0];
    previous[0] = row;
    for (let column = 1; column <= right.length; column += 1) {
      const above = previous[column];
      previous[column] = Math.min(previous[column] + 1, previous[column - 1] + 1, diagonal + (left[row - 1] === right[column - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return previous[right.length] / Math.max(1, left.length);
}

function wordErrorRate(expected: string, actual: string): number {
  const left = expected.toUpperCase().trim().split(/\s+/).filter(Boolean);
  const right = actual.toUpperCase().trim().split(/\s+/).filter(Boolean);
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let row = 1; row <= left.length; row += 1) {
    let diagonal = previous[0];
    previous[0] = row;
    for (let column = 1; column <= right.length; column += 1) {
      const above = previous[column];
      previous[column] = Math.min(previous[column] + 1, previous[column - 1] + 1, diagonal + (left[row - 1] === right[column - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return previous[right.length] / Math.max(1, left.length);
}
