import fs from 'node:fs';
import path from 'node:path';

export function resolvePublicOcrPath(requestPath: string, ocrRoot: string): string | null {
  const pathname = requestPath.split('?')[0] ?? '';
  if (!pathname.startsWith('/ocr/')) return null;
  const relative = decodeURIComponent(pathname.slice('/ocr/'.length));
  if (!relative || relative.endsWith('/')) return null;
  const resolved = path.resolve(ocrRoot, relative);
  const root = path.resolve(ocrRoot);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) return null;
  try {
    const stat = fs.statSync(resolved);
    if (!stat.isFile()) return null;
  } catch {
    return null;
  }
  return resolved;
}

export function contentTypeForOcrAsset(filePath: string): string {
  if (filePath.endsWith('.mjs') || filePath.endsWith('.js')) return 'text/javascript';
  if (filePath.endsWith('.wasm')) return 'application/wasm';
  if (filePath.endsWith('.tar')) return 'application/x-tar';
  return 'application/octet-stream';
}
