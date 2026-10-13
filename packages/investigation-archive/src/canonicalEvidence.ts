import type { OcrResultRecord, WorkflowToolResultRecord } from './format';

export function normalizeIdentifierValue(family: string, value: string): string {
  const trimmed = value.trim();
  if (family === 'email' || family === 'url-domain') {
    return trimmed.toLowerCase();
  }
  return trimmed;
}

function identifierKey(family: string, value: string): string {
  return `${family}\0${normalizeIdentifierValue(family, value)}`;
}

function provenanceKey(code: string, observedValue: string | null | undefined): string {
  return `${code}\0${(observedValue ?? '').trim()}`;
}

export function ocrConfidenceScore(confidence: number | null | undefined): number {
  if (confidence == null || !Number.isFinite(confidence)) return 0;
  return confidence;
}

/** Pick winning OCR row when workflows differ (best confidence, then newest). */
export function pickCanonicalOcr(existing: OcrResultRecord, incoming: OcrResultRecord): OcrResultRecord {
  const left = ocrConfidenceScore(existing.confidence);
  const right = ocrConfidenceScore(incoming.confidence);
  if (right > left) return incoming;
  if (right < left) return existing;
  const leftTime = existing.processedAt.getTime();
  const rightTime = incoming.processedAt.getTime();
  return rightTime >= leftTime ? incoming : existing;
}

export function resolveOcrUpsert(
  existing: OcrResultRecord | null,
  incoming: OcrResultRecord,
): OcrResultRecord {
  if (!existing) return incoming;
  const sameWorkflow = (existing.workflowId ?? null) === (incoming.workflowId ?? null);
  if (sameWorkflow) return incoming;
  return pickCanonicalOcr(existing, incoming);
}

type IdentifierCandidate = { family: string; value: string; confidence?: number; boundingBox?: unknown };

type IdentifierPayload = {
  text?: string;
  words?: unknown[];
  candidates?: IdentifierCandidate[];
};

type ProvenancePayload = {
  indicators?: Array<{ code?: string; message?: string; observedValue?: string; severity?: string }>;
};

function parseIdentifierPayload(result: unknown): IdentifierPayload {
  if (!result || typeof result !== 'object') return {};
  const payload = result as IdentifierPayload;
  return {
    text: typeof payload.text === 'string' ? payload.text : '',
    words: Array.isArray(payload.words) ? payload.words : [],
    candidates: Array.isArray(payload.candidates) ? payload.candidates : [],
  };
}

function parseProvenancePayload(result: unknown): ProvenancePayload {
  if (!result || typeof result !== 'object') return {};
  const payload = result as ProvenancePayload;
  return {
    indicators: Array.isArray(payload.indicators) ? payload.indicators : [],
  };
}

export function mergeIdentifierResults(
  existing: WorkflowToolResultRecord,
  incoming: WorkflowToolResultRecord,
): WorkflowToolResultRecord {
  const left = parseIdentifierPayload(existing.result);
  const right = parseIdentifierPayload(incoming.result);
  const merged = new Map<string, IdentifierCandidate>();
  for (const candidate of [...(left.candidates ?? []), ...(right.candidates ?? [])]) {
    if (!candidate || typeof candidate.family !== 'string' || typeof candidate.value !== 'string') continue;
    const key = identifierKey(candidate.family, candidate.value);
    const prev = merged.get(key);
    if (!prev) {
      merged.set(key, candidate);
      continue;
    }
    const prevConf = prev.confidence ?? 0;
    const nextConf = candidate.confidence ?? 0;
    if (nextConf >= prevConf) merged.set(key, candidate);
  }
  const preferIncomingText = incoming.finishedAt.getTime() >= existing.finishedAt.getTime();
  return {
    ...incoming,
    resultStatus: existing.resultStatus === 'success' || incoming.resultStatus === 'success' ? 'success' : incoming.resultStatus,
    result: {
      text: preferIncomingText && right.text ? right.text : (left.text || right.text || ''),
      words: (right.words?.length ? right.words : left.words) ?? [],
      candidates: [...merged.values()],
    },
    finishedAt: incoming.finishedAt.getTime() >= existing.finishedAt.getTime() ? incoming.finishedAt : existing.finishedAt,
  };
}

export function mergeProvenanceResults(
  existing: WorkflowToolResultRecord,
  incoming: WorkflowToolResultRecord,
): WorkflowToolResultRecord {
  const left = parseProvenancePayload(existing.result);
  const right = parseProvenancePayload(incoming.result);
  const merged = new Map<string, NonNullable<ProvenancePayload['indicators']>[number]>();
  for (const indicator of [...(left.indicators ?? []), ...(right.indicators ?? [])]) {
    if (!indicator || typeof indicator !== 'object') continue;
    const code = typeof indicator.code === 'string' ? indicator.code : 'Indicator';
    const key = provenanceKey(code, indicator.observedValue);
    if (!merged.has(key)) merged.set(key, indicator);
  }
  return {
    ...incoming,
    resultStatus: existing.resultStatus === 'success' || incoming.resultStatus === 'success' ? 'success' : incoming.resultStatus,
    result: { indicators: [...merged.values()] },
    finishedAt: incoming.finishedAt.getTime() >= existing.finishedAt.getTime() ? incoming.finishedAt : existing.finishedAt,
  };
}

export function resolveToolResultUpsert(
  existing: WorkflowToolResultRecord | null,
  incoming: WorkflowToolResultRecord,
  kind: 'identifiers' | 'provenance',
): WorkflowToolResultRecord {
  if (!existing) return incoming;
  if (existing.workflowId === incoming.workflowId) return incoming;
  return kind === 'identifiers'
    ? mergeIdentifierResults(existing, incoming)
    : mergeProvenanceResults(existing, incoming);
}

/** Fold chronologically sorted rows into one canonical row per image. */
export function foldOcrRows(rows: OcrResultRecord[]): OcrResultRecord | null {
  if (!rows.length) return null;
  const sorted = [...rows].sort((a, b) => a.processedAt.getTime() - b.processedAt.getTime());
  return sorted.reduce((acc, row) => resolveOcrUpsert(acc, row)) ?? null;
}

export function foldToolResultRows(
  rows: WorkflowToolResultRecord[],
  kind: 'identifiers' | 'provenance',
): WorkflowToolResultRecord | null {
  if (!rows.length) return null;
  const sorted = [...rows].sort((a, b) => a.finishedAt.getTime() - b.finishedAt.getTime());
  return sorted.reduce((acc, row) => resolveToolResultUpsert(acc, row, kind)) ?? null;
}
