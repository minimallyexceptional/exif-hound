import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

/**
 * Drizzle schema for the project database (schema format version 2).
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