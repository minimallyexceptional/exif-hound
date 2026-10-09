import type { OpenCV } from '@opencvjs/web';
import type { AffineTransform, ImageEnhancementResult, ImageEnhancer, ImageOperationRecord, ImageProcessingProgress, RasterImage } from './types';

type OpenCvRuntime = typeof OpenCV;
type Progress = (progress: ImageProcessingProgress) => void;

export class OpenCvImageEnhancer implements ImageEnhancer {
  constructor(private readonly loadRuntime: () => Promise<OpenCvRuntime> = loadOpenCvRuntime) {}

  async enhance(source: RasterImage, onProgress?: Progress, outputLimits = { maxPixels: 60_000_000, maxSide: 12_000 }): Promise<ImageEnhancementResult> {
    const cv = await this.loadRuntime();
    const owned = new Set<OpenCV.Mat>();
    const createMat = () => {
      const mat = new cv.Mat();
      owned.add(mat);
      return mat;
    };
    const release = (mat: OpenCV.Mat) => {
      if (!owned.has(mat)) return;
      mat.delete();
      owned.delete(mat);
    };
    const operations: ImageOperationRecord[] = [];
    let current: OpenCV.Mat | null = null;
    let scale = 1;
    let correctionMatrix: number[] = [1, 0, 0, 0, 1, 0];
    let skewDegrees = 0;
    let skewConfidence = 0;

    try {
      const sourceRgba = createMat();
      sourceRgba.create(source.height, source.width, cv.CV_8UC4);
      sourceRgba.data.set(source.data);
      current = createMat();
      cv.cvtColor(sourceRgba, current, cv.COLOR_RGBA2GRAY);
      release(sourceRgba);
      operations.push({ name: 'luminance-normalization', applied: true, parameters: { colorSpace: 'grayscale' } });
      onProgress?.({ progress: 0.18, status: 'Measuring image quality' });

      const inputLuminance = getLuminanceRange(cv, current);
      const noiseRatio = getNoiseRatio(cv, current, createMat, release);
      const illuminationRange = getIlluminationRange(cv, current, createMat, release);
      const highNoise = noiseRatio >= 0.08;
      const outputScale = highNoise ? 1 : getUpscaleFactor(source.width, source.height, outputLimits);
      if (outputScale > 1) {
        const resized = createMat();
        cv.resize(current, resized, new cv.Size(Math.round(source.width * outputScale), Math.round(source.height * outputScale)), 0, 0, cv.INTER_CUBIC);
        release(current);
        current = resized;
        scale = outputScale;
        operations.push({ name: 'upscale', applied: true, parameters: { factor: outputScale, interpolation: 'cubic' } });
      } else {
        operations.push({ name: 'upscale', applied: false, reason: highNoise ? 'Upscaling is skipped because strong noise could be amplified.' : 'Image already meets the profile scale target.' });
      }
      onProgress?.({ progress: 0.3, status: 'Scaling image while preserving detail' });

      if (inputLuminance < 135) {
        const normalized = createMat();
        cv.normalize(current, normalized, 0, 255, cv.NORM_MINMAX, cv.CV_8U);
        release(current);
        current = normalized;
        operations.push({ name: 'contrast-normalization', applied: true, parameters: { minMax: true } });
      } else {
        operations.push({ name: 'contrast-normalization', applied: false, reason: 'Luminance range is adequate.' });
      }

      if (noiseRatio > 0.006 && noiseRatio < 0.08) {
        const denoised = createMat();
        cv.medianBlur(current, denoised, 3);
        release(current);
        current = denoised;
        operations.push({ name: 'median-denoise', applied: true, parameters: { kernel: 3, noiseRatio } });
      } else {
        operations.push({ name: 'median-denoise', applied: false, reason: highNoise ? 'Strong noise exceeds the safe median-filter range.' : 'Noise check is below the cleanup threshold.' });
      }
      onProgress?.({ progress: 0.48, status: 'Applying conservative cleanup' });

      if (highNoise) {
        operations.push({ name: 'light-sharpen', applied: false, reason: 'Sharpening could amplify strong image noise.' });
      } else {
        const blurred = createMat();
        cv.GaussianBlur(current, blurred, new cv.Size(0, 0), 0.8);
        const sharpened = createMat();
        cv.addWeighted(current, 1.12, blurred, -0.12, 0, sharpened);
        release(blurred);
        release(current);
        current = sharpened;
        operations.push({ name: 'light-sharpen', applied: true, parameters: { amount: 0.12, sigma: 0.8 } });
      }

      const skew = estimateSkew(cv, current, createMat, release);
      skewDegrees = skew.degrees;
      skewConfidence = skew.confidence;
      if (Math.abs(skewDegrees) >= 0.45 && Math.abs(skewDegrees) <= 8 && skewConfidence >= 0.6) {
        const rotated = rotateWithoutCropping(cv, current, -skewDegrees, createMat);
        release(current);
        current = rotated.image;
        correctionMatrix = rotated.matrix;
        operations.push({ name: 'deskew', applied: true, parameters: { detectedDegrees: skewDegrees, correctionDegrees: -skewDegrees, confidence: skewConfidence } });
      } else {
        operations.push({ name: 'deskew', applied: false, reason: 'No small, high-confidence text skew was detected.', parameters: { detectedDegrees: skewDegrees, confidence: skewConfidence } });
      }

      if (illuminationRange > 58 && noiseRatio < 0.04 && Math.min(current.rows, current.cols) >= 9) {
        const blockSize = Math.min(31, nearestOdd(Math.min(current.rows, current.cols) - 2));
        const thresholded = createMat();
        cv.adaptiveThreshold(current, thresholded, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, blockSize, 8);
        release(current);
        current = thresholded;
        operations.push({ name: 'adaptive-threshold', applied: true, parameters: { blockSize, constant: 8, illuminationRange } });
      } else {
        operations.push({ name: 'adaptive-threshold', applied: false, reason: 'Illumination is even or the noise level makes external thresholding unsafe for Tesseract.' });
      }
      onProgress?.({ progress: 0.78, status: 'Finishing OCR image' });

      const needsMargin = !highNoise && !hasWhiteMargin(current);
      const border = needsMargin ? 10 : 0;
      if (needsMargin) {
        const bordered = createMat();
        cv.copyMakeBorder(current, bordered, border, border, border, border, cv.BORDER_CONSTANT, new cv.Scalar(255, 255, 255, 255));
        release(current);
        current = bordered;
        operations.push({ name: 'white-margin', applied: true, parameters: { pixels: border } });
      } else {
        operations.push({ name: 'white-margin', applied: false, reason: highNoise ? 'A new margin could interfere with strongly noisy content.' : 'The source already has a clean white margin.' });
      }

      const outputRgba = createMat();
      cv.cvtColor(current, outputRgba, cv.COLOR_GRAY2RGBA);
      const rgba = new Uint8ClampedArray(outputRgba.data);
      const processedWidth = outputRgba.cols;
      const processedHeight = outputRgba.rows;
      release(outputRgba);
      const processedToSource = createProcessedToSourceMap(
        scale,
        correctionMatrix,
        border,
      );
      onProgress?.({ progress: 0.88, status: 'OCR image processing complete' });

      return {
        image: { width: processedWidth, height: processedHeight, data: rgba },
        operations,
        quality: {
          luminanceRange: inputLuminance,
          noiseRatio,
          illuminationRange,
          skewDegrees,
          skewConfidence,
        },
        processedToSource,
      };
    } finally {
      for (const mat of owned) mat.delete();
    }
  }
}

async function loadOpenCvRuntime(): Promise<OpenCvRuntime> {
  const runtime = await import('@opencvjs/web');
  const cv = await runtime.loadOpenCV();
  const required = ['resize', 'filter2D', 'medianBlur', 'adaptiveThreshold', 'HoughLines', 'getRotationMatrix2D', 'warpAffine', 'cvtColor', 'morphologyEx', 'getStructuringElement'];
  const operators = cv as unknown as Record<string, unknown>;
  const missing = required.filter(operation => typeof operators[operation] !== 'function');
  if (missing.length) throw new Error(`The packaged OpenCV.js runtime is missing required operations: ${missing.join(', ')}.`);
  return cv;
}

function getUpscaleFactor(width: number, height: number, limits: { maxPixels: number; maxSide: number }): number {
  const longestSide = Math.max(width, height);
  const profileScale = longestSide >= 1800 ? 1 : Math.min(2, 1800 / longestSide);
  const resourceScale = Math.min(limits.maxSide / width, limits.maxSide / height, Math.sqrt(limits.maxPixels / (width * height)));
  return Math.max(1, Math.min(profileScale, resourceScale));
}

function getLuminanceRange(cv: OpenCvRuntime, image: OpenCV.Mat): number {
  return pixelRange(image.data);
}

function getNoiseRatio(
  cv: OpenCvRuntime,
  image: OpenCV.Mat,
  createMat: () => OpenCV.Mat,
  release: (mat: OpenCV.Mat) => void,
): number {
  const median = createMat();
  const difference = createMat();
  const noiseMask = createMat();
  try {
    cv.medianBlur(image, median, 3);
    cv.absdiff(image, median, difference);
    cv.threshold(difference, noiseMask, 60, 255, cv.THRESH_BINARY);
    return cv.countNonZero(noiseMask) / (image.rows * image.cols);
  } finally {
    release(median);
    release(difference);
    release(noiseMask);
  }
}

function getIlluminationRange(
  cv: OpenCvRuntime,
  image: OpenCV.Mat,
  createMat: () => OpenCV.Mat,
  release: (mat: OpenCV.Mat) => void,
): number {
  const background = createMat();
  try {
    const sigma = Math.max(3, Math.min(image.rows, image.cols) / 12);
    cv.GaussianBlur(image, background, new cv.Size(0, 0), sigma);
    return pixelRange(background.data);
  } finally {
    release(background);
  }
}

function pixelRange(pixels: Uint8Array): number {
  let minimum = 255;
  let maximum = 0;
  for (const value of pixels) {
    if (value < minimum) minimum = value;
    if (value > maximum) maximum = value;
  }
  return maximum - minimum;
}

function hasWhiteMargin(image: OpenCV.Mat, margin = 8): boolean {
  if (image.rows <= margin * 2 || image.cols <= margin * 2) return false;
  let white = 0;
  const total = image.rows * margin * 2 + (image.cols - margin * 2) * margin * 2;
  for (let y = 0; y < image.rows; y += 1) {
    for (let x = 0; x < image.cols; x += 1) {
      if (x >= margin && x < image.cols - margin && y >= margin && y < image.rows - margin) continue;
      if (image.ucharPtr(y, x)[0] >= 245) white += 1;
    }
  }
  return white / total >= 0.9;
}

function estimateSkew(
  cv: OpenCvRuntime,
  image: OpenCV.Mat,
  createMat: () => OpenCV.Mat,
  release: (mat: OpenCV.Mat) => void,
): { degrees: number; confidence: number } {
  if (Math.min(image.rows, image.cols) < 32) return { degrees: 0, confidence: 0 };
  const edges = createMat();
  const lines = createMat();
  try {
    cv.Canny(image, edges, 50, 150);
    cv.HoughLines(edges, lines, 1, Math.PI / 180, Math.max(20, Math.round(Math.min(image.rows, image.cols) * 0.12)));
    const lineValues = lines.data32F;
    const angles: number[] = [];
    for (let index = 1; index < lineValues.length; index += 2) {
      const theta = lineValues[index];
      const degrees = 90 - (theta * 180 / Math.PI);
      if (Math.abs(degrees) <= 12) angles.push(degrees);
    }
    if (angles.length < 3) return { degrees: 0, confidence: 0 };
    angles.sort((left, right) => left - right);
    const median = angles[Math.floor(angles.length / 2)];
    const deviations = angles.map(angle => Math.abs(angle - median)).sort((left, right) => left - right);
    const medianDeviation = deviations[Math.floor(deviations.length / 2)];
    const confidence = Math.min(1, angles.length / 5) * Math.max(0, 1 - medianDeviation / 5);
    return { degrees: median, confidence };
  } finally {
    release(edges);
    release(lines);
  }
}

function rotateWithoutCropping(
  cv: OpenCvRuntime,
  image: OpenCV.Mat,
  angle: number,
  createMat: () => OpenCV.Mat,
): { image: OpenCV.Mat; matrix: number[] } {
  const radians = angle * Math.PI / 180;
  const sine = Math.abs(Math.sin(radians));
  const cosine = Math.abs(Math.cos(radians));
  const width = Math.ceil(image.rows * sine + image.cols * cosine);
  const height = Math.ceil(image.rows * cosine + image.cols * sine);
  const matrix = cv.getRotationMatrix2D(new cv.Point(image.cols / 2, image.rows / 2), angle, 1);
  const matrixData = matrix.data64F;
  matrixData[2] += (width - image.cols) / 2;
  matrixData[5] += (height - image.rows) / 2;
  const output = createMat();
  cv.warpAffine(image, output, matrix, new cv.Size(width, height), cv.INTER_CUBIC, cv.BORDER_CONSTANT, new cv.Scalar(255));
  const values = Array.from(matrixData.slice(0, 6));
  matrix.delete();
  return { image: output, matrix: values };
}

function createProcessedToSourceMap(scale: number, forward: number[], border: number): AffineTransform {
  const [a, b, c, d, e, f] = forward;
  const determinant = a * d - b * c;
  const invA = d / determinant;
  const invB = -b / determinant;
  const invC = -c / determinant;
  const invD = a / determinant;
  const invE = (c * f - d * e) / determinant;
  const invF = (b * e - a * f) / determinant;
  const offsetX = -border;
  const offsetY = -border;
  return {
    a: invA / scale,
    b: invB / scale,
    c: invC / scale,
    d: invD / scale,
    e: (invA * offsetX + invC * offsetY + invE) / scale,
    f: (invB * offsetX + invD * offsetY + invF) / scale,
  };
}

function nearestOdd(value: number): number {
  const integer = Math.max(3, Math.floor(value));
  return integer % 2 === 0 ? integer - 1 : integer;
}
