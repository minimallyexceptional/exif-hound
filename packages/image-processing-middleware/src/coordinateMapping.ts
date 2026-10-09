import type { AffineTransform, NormalizedBoundingBox } from './types';

export function mapProcessedBoxToSource(
  box: NormalizedBoundingBox,
  processedWidth: number,
  processedHeight: number,
  sourceWidth: number,
  sourceHeight: number,
  transform: AffineTransform,
): NormalizedBoundingBox {
  const left = box.x * processedWidth;
  const top = box.y * processedHeight;
  const right = (box.x + box.width) * processedWidth;
  const bottom = (box.y + box.height) * processedHeight;
  const corners = [
    mapPoint(left, top, transform), mapPoint(right, top, transform),
    mapPoint(left, bottom, transform), mapPoint(right, bottom, transform),
  ];
  const minX = Math.min(...corners.map(point => point.x));
  const maxX = Math.max(...corners.map(point => point.x));
  const minY = Math.min(...corners.map(point => point.y));
  const maxY = Math.max(...corners.map(point => point.y));
  const x = clamp(minX / sourceWidth);
  const y = clamp(minY / sourceHeight);
  const sourceRight = clamp(maxX / sourceWidth);
  const sourceBottom = clamp(maxY / sourceHeight);
  return { x, y, width: Math.max(0, sourceRight - x), height: Math.max(0, sourceBottom - y) };
}

function mapPoint(x: number, y: number, transform: AffineTransform) {
  return {
    x: transform.a * x + transform.c * y + transform.e,
    y: transform.b * x + transform.d * y + transform.f,
  };
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}
