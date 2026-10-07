import { zipSync, unzipSync } from 'fflate';
import { Zipper } from './ports';

/**
 * Zipper port implementation backed by fflate (sync, dependency-free).
 * The same implementation serves production and Node tests.
 */

function toEntries(entries: Map<string, Uint8Array>): Record<string, Uint8Array> {
  const out: Record<string, Uint8Array> = {};
  for (const [name, data] of entries) out[name] = data;
  return out;
}

export const fflateZipper: Zipper = {
  async zip(entries: Map<string, Uint8Array>): Promise<Uint8Array> {
    const zipped = zipSync(toEntries(entries), { level: 6 });
    return new Uint8Array(zipped);
  },
  async unzip(bytes: Uint8Array): Promise<Map<string, Uint8Array>> {
    const unzipped = unzipSync(bytes);
    const out = new Map<string, Uint8Array>();
    for (const [name, data] of Object.entries(unzipped)) out.set(name, new Uint8Array(data));
    return out;
  },
};