declare module '@paddleocr/paddleocr-js' {
  export interface PaddleOCRCreateOptions {
    lang?: string;
    ocrVersion?: string;
    textDetectionModelName?: string;
    textRecognitionModelName?: string;
    textDetectionModelAsset?: { url: string };
    textRecognitionModelAsset?: { url: string };
    worker?: boolean;
    ortOptions?: { backend?: string; wasmPaths?: string; numThreads?: number; simd?: boolean };
  }

  export interface PaddleOCRResultItem { text: string; score: number; poly: Array<{ x: number; y: number }> }
  export interface PaddleOCRResult { items: PaddleOCRResultItem[] }
  export interface PaddleOCREngine {
    predict(image: unknown): Promise<PaddleOCRResult[]>;
    dispose(): Promise<void>;
  }
  export const PaddleOCR: {
    create(options?: PaddleOCRCreateOptions): Promise<PaddleOCREngine>;
  };
}
