import type { Database, SqlJsStatic } from 'sql.js';
import { DatabaseEngine, DatabaseEngineProvider, QueryResult, SqlMethod } from './ports';

/**
 * sql.js adapter for the DatabaseEngine port. Works identically in the
 * webview (wasm located via Vite asset) and in Node tests (default locate).
 * Rows are positional arrays — drizzle's sqlite-proxy maps positionally.
 */

function methodOf(m?: SqlMethod): SqlMethod {
  return m ?? 'run';
}

function execSync(db: Database, sql: string, params: unknown[], method: SqlMethod): QueryResult {
  if (method === 'run') {
    db.run(sql, params as never);
    return { rows: [] };
  }
  const stmt = db.prepare(sql);
  try {
    if (params.length > 0) stmt.bind(params as never);
    const rows: unknown[][] = [];
    while (stmt.step()) rows.push(stmt.get() as unknown[]);
    return { rows };
  } finally {
    stmt.free();
  }
}

export function createSqlJsEngine(db: Database): DatabaseEngine {
  return {
    async exec(sql, params = [], method): Promise<QueryResult> {
      return execSync(db, sql, params, methodOf(method));
    },
    async serialize(): Promise<Uint8Array> {
      return db.export();
    },
    close(): void {
      db.close();
    },
  };
}

export function createSqlJsProvider(SQL: SqlJsStatic): DatabaseEngineProvider {
  return {
    async open(bytes?: Uint8Array): Promise<DatabaseEngine> {
      const db = bytes ? new SQL.Database(bytes) : new SQL.Database();
      return createSqlJsEngine(db);
    },
  };
}