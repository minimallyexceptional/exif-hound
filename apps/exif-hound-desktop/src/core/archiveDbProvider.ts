import initSqlJs from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { createSqlJsProvider, type DatabaseEngineProvider } from 'exif-hound-core';

let providerPromise: Promise<DatabaseEngineProvider> | null = null;

export function getArchiveDbProvider(): Promise<DatabaseEngineProvider> {
  if (!providerPromise) {
    providerPromise = initSqlJs({
      locateFile: (file: string) => (file.endsWith('.wasm') ? wasmUrl : file),
    }).then((SQL) => createSqlJsProvider(SQL));
  }
  return providerPromise;
}
