/**
 * Ports (dependency inversion) for the archive service. The package owns all
 * format/domain logic; concrete runtimes (sql.js wasm in the app, sql.js in
 * Node tests, fflate zip) are bound from outside.
 */

export type SqlMethod = 'run' | 'all' | 'get' | 'values';

/**
 * Positional result rows (drizzle's sqlite-proxy maps positionally).
 */
export interface QueryResult {
  rows: unknown[][];
}

export interface DatabaseEngine {
  /**
   * Execute a statement. `run` takes no results; `all`/`get`/`values` return
   * positional rows (for `get`, a single row or an empty array).
   */
  exec(sql: string, params?: unknown[], method?: SqlMethod): Promise<QueryResult>;
  /** Serialize the database to bytes for embedding in the archive. */
  serialize(): Promise<Uint8Array>;
  /** Release engine resources (no-op for engines without any). */
  close(): void;
}

export interface DatabaseEngineProvider {
  /** Open a fresh engine, or one initialized from existing database bytes. */
  open(bytes?: Uint8Array): Promise<DatabaseEngine>;
}

export interface Zipper {
  zip(entries: Map<string, Uint8Array>): Promise<Uint8Array>;
  unzip(bytes: Uint8Array): Promise<Map<string, Uint8Array>>;
}