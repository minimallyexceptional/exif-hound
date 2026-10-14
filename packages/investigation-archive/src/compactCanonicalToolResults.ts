import { foldOcrRows, foldToolResultRows } from './canonicalEvidence';
import type { OcrResultRecord, WorkflowToolResultRecord } from './format';
import type { DatabaseEngine } from './ports';

function rowCell(row: unknown[], index: number): unknown {
  return row[index];
}

function parseOcrRow(row: unknown[]): OcrResultRecord {
  return {
    id: rowCell(row, 0) as number,
    imageId: rowCell(row, 1) as number,
    imageName: rowCell(row, 2) as string,
    text: rowCell(row, 3) as string,
    confidence: rowCell(row, 4) as number | null,
    resultStatus: rowCell(row, 5) as OcrResultRecord['resultStatus'],
    workflowId: rowCell(row, 6) as string | null,
    workflowRunId: rowCell(row, 7) as string | null,
    nodeId: rowCell(row, 8) as string | null,
    processedAt: new Date(rowCell(row, 9) as string),
    provider: rowCell(row, 10) as OcrResultRecord['provider'],
    engineVersion: rowCell(row, 11) as string,
    preprocessingManifest: rowCell(row, 12) ? JSON.parse(String(rowCell(row, 12))) : undefined,
    words: rowCell(row, 13) ? JSON.parse(String(rowCell(row, 13))) : [],
  };
}

function parseToolRow(row: unknown[]): WorkflowToolResultRecord {
  return {
    id: rowCell(row, 0) as number,
    imageId: rowCell(row, 1) as number,
    imageName: rowCell(row, 2) as string,
    result: JSON.parse(String(rowCell(row, 3))),
    resultStatus: rowCell(row, 4) as WorkflowToolResultRecord['resultStatus'],
    workflowId: rowCell(row, 5) as string,
    workflowRunId: rowCell(row, 6) as string,
    nodeId: rowCell(row, 7) as string,
    toolVersion: rowCell(row, 8) as string,
    startedAt: new Date(rowCell(row, 9) as string),
    finishedAt: new Date(rowCell(row, 10) as string),
    error: rowCell(row, 11) as string | null,
    preprocessingManifest: rowCell(row, 12) ? JSON.parse(String(rowCell(row, 12))) : undefined,
  };
}

async function compactOcrTable(engine: DatabaseEngine): Promise<void> {
  const result = await engine.exec(
    `SELECT id, image_id, image_name, text, confidence, result_status, workflow_id, workflow_run_id, node_id,
      processed_at, provider, engine_version, preprocessing_manifest_json, words_json FROM ocr_results`,
    [],
    'all',
  );
  const byImage = new Map<number, OcrResultRecord[]>();
  for (const row of result.rows) {
    const parsed = parseOcrRow(row);
    const list = byImage.get(parsed.imageId) ?? [];
    list.push(parsed);
    byImage.set(parsed.imageId, list);
  }
  if (byImage.size === 0) return;
  await engine.exec('DELETE FROM ocr_results', [], 'run');
  for (const rows of byImage.values()) {
    const canonical = foldOcrRows(rows);
    if (!canonical) continue;
    await engine.exec(
      `INSERT INTO ocr_results
        (image_id, image_name, text, confidence, result_status, workflow_id, workflow_run_id, node_id,
         processed_at, provider, engine_version, preprocessing_manifest_json, words_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        canonical.imageId,
        canonical.imageName ?? rows[0].imageName ?? 'image',
        canonical.text,
        canonical.confidence,
        canonical.resultStatus ?? (canonical.text.trim() ? 'success' : 'no-text'),
        canonical.workflowId ?? null,
        canonical.workflowRunId ?? null,
        canonical.nodeId ?? null,
        canonical.processedAt.toISOString(),
        canonical.provider ?? 'paddle',
        canonical.engineVersion ?? 'PaddleOCR.js@0.4.2 / PP-OCRv6_small',
        canonical.preprocessingManifest == null ? null : JSON.stringify(canonical.preprocessingManifest),
        JSON.stringify(canonical.words ?? []),
      ],
      'run',
    );
  }
}

async function compactToolTable(
  engine: DatabaseEngine,
  table: 'image_provenance_results' | 'visual_identifier_results',
  kind: 'provenance' | 'identifiers',
): Promise<void> {
  const result = await engine.exec(
    `SELECT id, image_id, image_name, result_json, result_status, workflow_id, workflow_run_id, node_id,
      tool_version, started_at, finished_at, error, preprocessing_manifest_json FROM ${table}`,
    [],
    'all',
  );
  const byImage = new Map<number, WorkflowToolResultRecord[]>();
  for (const row of result.rows) {
    const parsed = parseToolRow(row);
    const list = byImage.get(parsed.imageId) ?? [];
    list.push(parsed);
    byImage.set(parsed.imageId, list);
  }
  if (byImage.size === 0) return;
  await engine.exec(`DELETE FROM ${table}`, [], 'run');
  for (const rows of byImage.values()) {
    const canonical = foldToolResultRows(rows, kind);
    if (!canonical) continue;
    await engine.exec(
      `INSERT INTO ${table}
        (image_id, image_name, result_json, result_status, workflow_id, workflow_run_id, node_id,
         tool_version, started_at, finished_at, error, preprocessing_manifest_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        canonical.imageId,
        canonical.imageName,
        JSON.stringify(canonical.result),
        canonical.resultStatus,
        canonical.workflowId,
        canonical.workflowRunId,
        canonical.nodeId,
        canonical.toolVersion,
        canonical.startedAt.toISOString(),
        canonical.finishedAt.toISOString(),
        canonical.error ?? null,
        canonical.preprocessingManifest == null ? null : JSON.stringify(canonical.preprocessingManifest),
      ],
      'run',
    );
  }
}

export async function compactCanonicalToolResults(engine: DatabaseEngine): Promise<void> {
  await engine.exec('BEGIN TRANSACTION', [], 'run');
  try {
    await compactOcrTable(engine);
    await compactToolTable(engine, 'image_provenance_results', 'provenance');
    await compactToolTable(engine, 'visual_identifier_results', 'identifiers');
    await engine.exec('COMMIT', [], 'run');
  } catch (error) {
    await engine.exec('ROLLBACK', [], 'run').catch(() => {});
    throw error;
  }
}

export async function ensureCanonicalImageIndexes(engine: DatabaseEngine): Promise<void> {
  await engine.exec(
    'CREATE UNIQUE INDEX IF NOT EXISTS uq_ocr_results_image_id ON ocr_results(image_id)',
    [],
    'run',
  );
  await engine.exec(
    'CREATE UNIQUE INDEX IF NOT EXISTS uq_image_provenance_results_image_id ON image_provenance_results(image_id)',
    [],
    'run',
  );
  await engine.exec(
    'CREATE UNIQUE INDEX IF NOT EXISTS uq_visual_identifier_results_image_id ON visual_identifier_results(image_id)',
    [],
    'run',
  );
}
