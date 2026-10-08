/**
 * Ports (dependency inversion) for the project store. The package owns all
 * project/domain logic; concrete runtimes (sql.js wasm in the app, sql.js in
 * Node tests, Tauri fs in the desktop app) are bound from outside.
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
  /** Serialize the database to bytes for writing to disk. */
  serialize(): Promise<Uint8Array>;
  /** Release engine resources. */
  close(): void;
}

export interface DatabaseEngineProvider {
  /** Open a fresh engine, or one initialized from existing database bytes. */
  open(bytes?: Uint8Array): Promise<DatabaseEngine>;
}

/**
 * Filesystem port for project folder operations. Paths are project-absolute
 * POSIX-style ('images/beach.jpg', 'data/data.db') joined onto a root path
 * supplied by the caller.
 */
export interface FsPort {
  exists(path: string): Promise<boolean>;
  mkdir(path: string): Promise<void>;
  writeFile(path: string, data: Uint8Array): Promise<void>;
  readFile(path: string): Promise<Uint8Array>;
  deleteFile(path: string): Promise<void>;
}