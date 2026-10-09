import { sqliteTable, integer, real, text } from 'drizzle-orm/sqlite-core';

/**
 * Drizzle schema for the project database (schema format version 5).
 * Mirrors migrations.ts DDL — the test suite asserts both stay in sync
 * via round-trips through a real sql.js engine.
 */

export const investigations = sqliteTable('investigation_meta', {
  id: integer('id').primaryKey(), // always 1
  name: text('name').notNull(),
  createdAt: text('created_at').notNull(), // ISO string
  appVersion: text('app_version').notNull(),
  schemaFormatVersion: integer('schema_format_version').notNull(),
  // Session state (restored on open).
  viewMode: text('view_mode').notNull(),
  showRoute: integer('show_route', { mode: 'boolean' }).notNull(),
  investigationTool: text('investigation_tool'),
});

export const images = sqliteTable('images', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  fileName: text('file_name').notNull(),
  /** Path of the image file relative to the project root ('images/…'). */
  diskPath: text('disk_path').notNull().unique(),
  exifJson: text('exif_json').notNull(),
  /** 1 only when the original bytes live on disk under images/. */
  hasImage: integer('has_image', { mode: 'boolean' }).notNull(),
  /** External image URL for imported point entries; null for real images. */
  sourceUrl: text('source_url'),
  addedAt: text('added_at').notNull(), // ISO string
});

export const projectImports = sqliteTable('project_imports', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  /** 'kml' | 'csv' — one current import per type. */
  type: text('type').notNull().unique(),
  fileName: text('file_name').notNull(),
  addedAt: text('added_at').notNull(), // ISO string
});

export const ocrResults = sqliteTable('ocr_results', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  imageId: integer('image_id').notNull().references(() => images.id, { onDelete: 'cascade' }),
  imageName: text('image_name').notNull(),
  text: text('text').notNull(),
  confidence: real('confidence'),
  resultStatus: text('result_status').notNull(),
  workflowId: text('workflow_id'),
  workflowRunId: text('workflow_run_id'),
  nodeId: text('node_id'),
  processedAt: text('processed_at').notNull(),
});

export const workbenchWorkflows = sqliteTable('workbench_workflows', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  graphJson: text('graph_json').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const workflowRuns = sqliteTable('workflow_runs', {
  id: text('id').primaryKey(),
  workflowId: text('workflow_id').notNull().references(() => workbenchWorkflows.id, { onDelete: 'cascade' }),
  status: text('status').notNull(),
  startedAt: text('started_at').notNull(),
  finishedAt: text('finished_at'),
  currentNodeId: text('current_node_id'),
  completedNodes: integer('completed_nodes').notNull(),
  totalNodes: integer('total_nodes').notNull(),
  error: text('error'),
});

export const imageProvenanceResults = sqliteTable('image_provenance_results', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  imageId: integer('image_id').notNull().references(() => images.id, { onDelete: 'cascade' }),
  imageName: text('image_name').notNull(),
  resultJson: text('result_json').notNull(),
  resultStatus: text('result_status').notNull(),
  workflowId: text('workflow_id').notNull().references(() => workbenchWorkflows.id, { onDelete: 'cascade' }),
  workflowRunId: text('workflow_run_id').notNull().references(() => workflowRuns.id, { onDelete: 'cascade' }),
  nodeId: text('node_id').notNull(),
  toolVersion: text('tool_version').notNull(),
  startedAt: text('started_at').notNull(),
  finishedAt: text('finished_at').notNull(),
  error: text('error'),
});

export const visualIdentifierResults = sqliteTable('visual_identifier_results', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  imageId: integer('image_id').notNull().references(() => images.id, { onDelete: 'cascade' }),
  imageName: text('image_name').notNull(),
  resultJson: text('result_json').notNull(),
  resultStatus: text('result_status').notNull(),
  workflowId: text('workflow_id').notNull().references(() => workbenchWorkflows.id, { onDelete: 'cascade' }),
  workflowRunId: text('workflow_run_id').notNull().references(() => workflowRuns.id, { onDelete: 'cascade' }),
  nodeId: text('node_id').notNull(),
  toolVersion: text('tool_version').notNull(),
  startedAt: text('started_at').notNull(),
  finishedAt: text('finished_at').notNull(),
  error: text('error'),
});
