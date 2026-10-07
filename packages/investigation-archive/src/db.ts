import { drizzle, SqliteRemoteDatabase } from 'drizzle-orm/sqlite-proxy';
import { DatabaseEngine } from './ports';
import * as schema from './schema';

/**
 * Bind drizzle's sqlite-proxy driver to our DatabaseEngine port. Drizzle maps
 * rows positionally, which is exactly what the engine returns.
 */
export function createDb(engine: DatabaseEngine): SqliteRemoteDatabase<typeof schema> {
  return drizzle<typeof schema>(async (sql, params, method) => {
    const result = await engine.exec(sql, params as unknown[], method);
    return { rows: result.rows };
  });
}

export { schema };