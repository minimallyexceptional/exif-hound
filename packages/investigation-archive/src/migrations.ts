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
  `CREATE TABLE IF NOT EXISTS ocr_results (
    image_id INTEGER PRIMARY KEY REFERENCES images(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    confidence REAL NOT NULL,
    processed_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS workbench_workflows (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    graph_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS workflow_runs (
    id TEXT PRIMARY KEY,
    workflow_id TEXT NOT NULL REFERENCES workbench_workflows(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    started_at TEXT NOT NULL,
    finished_at TEXT,
    current_node_id TEXT,
    completed_nodes INTEGER NOT NULL DEFAULT 0,
    total_nodes INTEGER NOT NULL DEFAULT 0,
    error TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS image_provenance_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    image_id INTEGER NOT NULL REFERENCES images(id) ON DELETE CASCADE,
    image_name TEXT NOT NULL,
    result_json TEXT NOT NULL,
    result_status TEXT NOT NULL,
    workflow_id TEXT NOT NULL REFERENCES workbench_workflows(id) ON DELETE CASCADE,
    workflow_run_id TEXT NOT NULL REFERENCES workflow_runs(id) ON DELETE CASCADE,
    node_id TEXT NOT NULL,
    tool_version TEXT NOT NULL,
    started_at TEXT NOT NULL,
    finished_at TEXT NOT NULL,
    error TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS visual_identifier_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    image_id INTEGER NOT NULL REFERENCES images(id) ON DELETE CASCADE,
    image_name TEXT NOT NULL,
    result_json TEXT NOT NULL,
    result_status TEXT NOT NULL,
    workflow_id TEXT NOT NULL REFERENCES workbench_workflows(id) ON DELETE CASCADE,
    workflow_run_id TEXT NOT NULL REFERENCES workflow_runs(id) ON DELETE CASCADE,
    node_id TEXT NOT NULL,
    tool_version TEXT NOT NULL,
    started_at TEXT NOT NULL,
    finished_at TEXT NOT NULL,
    error TEXT
  )`,
];

/** Tables every valid project database must have. */
export const EXPECTED_TABLES = [
  'investigation_meta',
  'images',
  'project_imports',
];

export async function runMigrations(engine: DatabaseEngine): Promise<void> {
  for (const ddl of MIGRATIONS) {
    await engine.exec(ddl, [], 'run');
  }
  const columns = await engine.exec('PRAGMA table_info(ocr_results)', [], 'all');
  const hasAppendOnlyId = columns.rows.some((row) => row[1] === 'id');
  if (!hasAppendOnlyId) {
    await engine.exec('BEGIN TRANSACTION', [], 'run');
    try {
      await engine.exec('ALTER TABLE ocr_results RENAME TO ocr_results_v3', [], 'run');
      await engine.exec(`CREATE TABLE ocr_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        image_id INTEGER NOT NULL REFERENCES images(id) ON DELETE CASCADE,
        image_name TEXT NOT NULL,
        text TEXT NOT NULL,
        confidence REAL,
        result_status TEXT NOT NULL,
        workflow_id TEXT,
        workflow_run_id TEXT,
        node_id TEXT,
        processed_at TEXT NOT NULL
      )`, [], 'run');
      await engine.exec(`INSERT INTO ocr_results
        (image_id, image_name, text, confidence, result_status, processed_at)
        SELECT old.image_id, images.file_name, old.text, old.confidence,
          CASE WHEN trim(old.text) = '' THEN 'no-text' ELSE 'success' END, old.processed_at
        FROM ocr_results_v3 AS old JOIN images ON images.id = old.image_id`, [], 'run');
      await engine.exec('DROP TABLE ocr_results_v3', [], 'run');
      await engine.exec('COMMIT', [], 'run');
    } catch (error) {
      await engine.exec('ROLLBACK', [], 'run').catch(() => {});
      throw error;
    }
  }
  await engine.exec('UPDATE investigation_meta SET schema_format_version = 5 WHERE schema_format_version < 5', [], 'run');
}
import type { DatabaseEngine } from './ports';
