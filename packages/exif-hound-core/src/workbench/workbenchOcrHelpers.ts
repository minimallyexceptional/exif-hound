import type { OcrResult } from 'ocr-middleware';

export function hasOcrBoundingBox(value: unknown): value is OcrResult['words'][number] {
  if (!value || typeof value !== 'object') return false;
  const word = value as { text?: unknown; confidence?: unknown; boundingBox?: unknown };
  if (typeof word.text !== 'string' || typeof word.confidence !== 'number' || !word.boundingBox || typeof word.boundingBox !== 'object') {
    return false;
  }
  const box = word.boundingBox as Record<string, unknown>;
  return ['x', 'y', 'width', 'height'].every((key) => typeof box[key] === 'number' && Number.isFinite(box[key]));
}

export function formatOcrCoordinates(value: unknown): string {
  if (!value || typeof value !== 'object') return 'Coordinates unavailable';
  const box = value as Record<string, unknown>;
  const values = [box.x, box.y, box.width, box.height];
  if (!values.every((item) => typeof item === 'number' && Number.isFinite(item))) return 'Coordinates unavailable';
  const [x, y, width, height] = values as number[];
  return `${x.toFixed(3)}, ${y.toFixed(3)} · ${width.toFixed(3)}×${height.toFixed(3)}`;
}
