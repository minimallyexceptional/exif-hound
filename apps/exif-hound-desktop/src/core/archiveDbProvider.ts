import initSqlJsModule from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { createSqlJsProvider, type DatabaseEngineProvider } from 'exif-hound-core';

/** WebKit-safe default for sql.js (CJS / re-export interop). */
const initSqlJs =
  typeof initSqlJsModule === 'function'
    ? initSqlJsModule
    : (initSqlJsModule as { default: typeof initSqlJsModule }).default;

let providerPromise: Promise<DatabaseEngineProvider> | null = null;

export function getArchiveDbProvider(): Promise<DatabaseEngineProvider> {
  if (!providerPromise) {
    providerPromise = initSqlJs({
      locateFile: (file: string) => (file.endsWith('.wasm') ? wasmUrl : file),
    }).then((SQL) => createSqlJsProvider(SQL));
  }
  return providerPromise;
}
