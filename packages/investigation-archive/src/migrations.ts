/**
 * Idempotent DDL applied on every project open and create. Kept as plain
 * SQL so the engine port can run it before drizzle touches anything.
 */
export const MIGRATIONS: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS investigation_meta (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL,
    app_version TEXT NOT NULL,
    schema_format_version INTEGER NOT NULL,
    view_mode TEXT NOT NULL,
    show_route INTEGER NOT NULL,
    investigation_tool TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_name TEXT NOT NULL,
    disk_path TEXT NOT NULL UNIQUE,
    exif_json TEXT NOT NULL,
    has_image INTEGER NOT NULL,
    source_url TEXT,
    added_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS project_imports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL UNIQUE,
    file_name TEXT NOT NULL,
    added_at TEXT NOT NULL
  )`,
];

/** Tables every valid project database must have. */
export const EXPECTED_TABLES = [
  'investigation_meta',
  'images',
  'project_imports',
];

export async function runMigrations(engine: {
  exec(sql: string, params?: unknown[], method?: 'run'): Promise<unknown>;
}): Promise<void> {
  for (const ddl of MIGRATIONS) {
    await engine.exec(ddl, [], 'run');
  }
}