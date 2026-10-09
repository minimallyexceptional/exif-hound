import { OcrMiddleware, PaddleOcrWorkerFactory } from 'ocr-middleware';

async function run(): Promise<void> {
  const canvas = document.createElement('canvas');
  canvas.width = 1000;
  canvas.height = 220;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is unavailable.');
  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#111';
  context.font = 'bold 72px Arial';
  context.fillText('PADDLE OCR TEST 12345', 36, 145);
  const image = await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Could not create OCR fixture.')), 'image/png'));
  const middleware = new OcrMiddleware({
    languages: ['eng'],
    workerFactory: new PaddleOcrWorkerFactory({
      detectionModelUrl: new URL('/ocr/paddle/PP-OCRv6_small_det_onnx_infer.tar', window.location.href).toString(),
      recognitionModelUrl: new URL('/ocr/paddle/PP-OCRv6_small_rec_onnx_infer.tar', window.location.href).toString(),
      wasmPaths: new URL('/ocr/paddle/ort/', window.location.href).toString(),
    }),
  });
  try {
    const result = await middleware.recognize(image);
    document.querySelector('#result')!.textContent = JSON.stringify({ text: result.text, provider: result.provider, engineVersion: result.engineVersion, words: result.words.length });
  } finally {
    await middleware.dispose();
  }
}

void run().catch(error => {
  document.querySelector('#result')!.textContent = `failed: ${error instanceof Error ? error.stack : String(error)}`;
});
