import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

/**
 * Drizzle schema for the archive database. Mirrors migrations.ts DDL —
 * schema.test.ts asserts both stay in sync via round-trips.
 */

export const investigations = sqliteTable('investigation_meta', {
  id: integer('id').primaryKey(), // always 1
  name: text('name').notNull(),
  createdAt: text('created_at').notNull(), // ISO string
  savedAt: text('saved_at').notNull(), // ISO string
  appVersion: text('app_version').notNull(),
  formatVersion: integer('format_version').notNull(),
  // Session state (restored on resume — design.md D4).
  viewMode: text('view_mode').notNull(),
  showRoute: integer('show_route', { mode: 'boolean' }).notNull(),
  investigationTool: text('investigation_tool'),
  importType: text('import_type'),
  importData: text('import_data'),
});

export const images = sqliteTable('images', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  fileName: text('file_name').notNull(),
  archivePath: text('archive_path').notNull().unique(),
  exifJson: text('exif_json').notNull(),
  /** 1 only when the original bytes are stored under images/. */
  hasImage: integer('has_image', { mode: 'boolean' }).notNull(),
  /** External image URL for imported point entries; null for real images. */
  sourceUrl: text('source_url'),
  addedAt: text('added_at').notNull(), // ISO string
});