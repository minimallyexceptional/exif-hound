/**
 * sql.js wasm bootstrap for the archive database engine (design.md D2/D5).
 * The wasm asset is served by Vite; the provider is created once and reused.
 */
import initSqlJs from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { DatabaseEngineProvider, createSqlJsProvider } from 'investigation-archive';

let providerPromise: Promise<DatabaseEngineProvider> | null = null;

export function getArchiveDbProvider(): Promise<DatabaseEngineProvider> {
  if (!providerPromise) {
    providerPromise = initSqlJs({
      locateFile: (file: string) => (file.endsWith('.wasm') ? wasmUrl : file),
    }).then((SQL) => createSqlJsProvider(SQL));
  }
  return providerPromise;
}