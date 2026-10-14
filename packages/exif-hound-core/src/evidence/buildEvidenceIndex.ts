import type { OcrResultRecord, WorkflowToolResultRecord } from 'investigation-archive';
import type { ImageData } from '../types/imageData';
import type {
  EvidenceCategoryId,
  EvidenceIndex,
  EvidenceRow,
  GpsEvidenceRow,
  IdentifierEvidenceRow,
  OcrEvidenceRow,
  ProvenanceEvidenceRow,
} from './evidenceTypes';
import { parseEvidenceConfidence, shouldIncludeEvidenceConfidence } from './evidenceTableFormatters';

const CATEGORY_ORDER: EvidenceCategoryId[] = [
  'license-plates',
  'phone-numbers',
  'emails',
  'urls',
  'text-coordinates',
  'gps-locations',
  'ocr-text',
  'provenance',
];

const CATEGORY_TITLES: Record<EvidenceCategoryId, string> = {
  'license-plates': 'License plates',
  'phone-numbers': 'Phone numbers',
  emails: 'Emails',
  urls: 'URLs & domains',
  'text-coordinates': 'Text coordinates',
  'gps-locations': 'GPS locations',
  'ocr-text': 'OCR text',
  provenance: 'Provenance',
};

const FAMILY_TO_CATEGORY: Record<string, EvidenceCategoryId> = {
  'license-plate-like': 'license-plates',
  'phone-like': 'phone-numbers',
  email: 'emails',
  'url-domain': 'urls',
  'coordinate-pair': 'text-coordinates',
};

function emptyRows(): Record<EvidenceCategoryId, EvidenceRow[]> {
  return {
    'license-plates': [],
    'phone-numbers': [],
    emails: [],
    urls: [],
    'text-coordinates': [],
    'gps-locations': [],
    'ocr-text': [],
    provenance: [],
  };
}

function isIdentifierCandidate(value: unknown): value is { family: string; value: string; confidence?: number } {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as { family?: unknown; value?: unknown };
  return typeof candidate.family === 'string' && typeof candidate.value === 'string';
}

function isProvenanceIndicator(value: unknown): value is { code?: string; message?: string; observedValue?: string; severity?: string } {
  return Boolean(value && typeof value === 'object');
}

function identifierDedupeKey(categoryId: EvidenceCategoryId, imageId: number, value: string): string {
  const normalized = categoryId === 'emails' || categoryId === 'urls'
    ? value.trim().toLowerCase()
    : value.trim();
  return `${categoryId}:${imageId}:${normalized}`;
}

function identifierConfidenceScore(confidence: number | null): number {
  if (confidence == null || !Number.isFinite(confidence)) return -1;
  return confidence;
}

export function buildEvidenceIndex(
  ocrResults: OcrResultRecord[],
  identifierResults: WorkflowToolResultRecord[],
  provenanceResults: WorkflowToolResultRecord[],
  images: ImageData[],
): EvidenceIndex {
  const rowsByCategory = emptyRows();
  const bestIdentifierByKey = new Map<string, IdentifierEvidenceRow>();
  const seenProvenance = new Set<string>();
  const seenOcrByImage = new Set<number>();

  for (const record of identifierResults) {
    if (record.resultStatus !== 'success') continue;
    const payload = record.result as { candidates?: unknown[] };
    const candidates = Array.isArray(payload?.candidates) ? payload.candidates : [];
    candidates.forEach((candidate, index) => {
      if (!isIdentifierCandidate(candidate)) return;
      const confidence = parseEvidenceConfidence(candidate.confidence);
      if (!shouldIncludeEvidenceConfidence(confidence)) return;
      const categoryId = FAMILY_TO_CATEGORY[candidate.family];
      if (!categoryId) return;
      const dedupeKey = identifierDedupeKey(categoryId, record.imageId, candidate.value);
      const row: IdentifierEvidenceRow = {
        id: `id-${record.id ?? record.workflowRunId}-${index}`,
        kind: 'identifier',
        family: candidate.family,
        value: candidate.value,
        confidence,
        imageId: record.imageId,
        imageName: record.imageName,
        detectedAt: record.finishedAt ?? null,
        workflowId: record.workflowId,
        workflowRunId: record.workflowRunId,
      };
      const previous = bestIdentifierByKey.get(dedupeKey);
      if (
        !previous
        || identifierConfidenceScore(row.confidence) > identifierConfidenceScore(previous.confidence)
      ) {
        bestIdentifierByKey.set(dedupeKey, row);
      }
    });
  }

  for (const row of bestIdentifierByKey.values()) {
    const categoryId = FAMILY_TO_CATEGORY[row.family];
    if (categoryId) rowsByCategory[categoryId].push(row);
  }

  for (const record of ocrResults) {
    if (seenOcrByImage.has(record.imageId)) continue;
    const confidence = parseEvidenceConfidence(record.confidence);
    if (!shouldIncludeEvidenceConfidence(confidence)) continue;
    seenOcrByImage.add(record.imageId);
    const row: OcrEvidenceRow = {
      id: `ocr-${record.id ?? `${record.imageId}-${record.processedAt.getTime()}`}`,
      kind: 'ocr',
      text: record.text,
      confidence,
      resultStatus: record.resultStatus ?? null,
      imageId: record.imageId,
      imageName: record.imageName ?? `Image ${record.imageId}`,
      detectedAt: record.processedAt,
      workflowId: record.workflowId ?? null,
      workflowRunId: record.workflowRunId ?? null,
    };
    rowsByCategory['ocr-text'].push(row);
  }

  for (const record of provenanceResults) {
    if (record.resultStatus !== 'success') continue;
    const payload = record.result as { indicators?: unknown[] };
    const indicators = Array.isArray(payload?.indicators) ? payload.indicators : [];
    indicators.forEach((indicator, index) => {
      if (!isProvenanceIndicator(indicator)) return;
      const code = indicator.code ?? 'Indicator';
      const dedupeKey = `${record.imageId}:${code}:${(indicator.observedValue ?? '').trim()}`;
      if (seenProvenance.has(dedupeKey)) return;
      seenProvenance.add(dedupeKey);
      const row: ProvenanceEvidenceRow = {
        id: `prov-${record.id ?? record.workflowRunId}-${index}`,
        kind: 'provenance',
        code: indicator.code ?? 'Indicator',
        message: indicator.message ?? '',
        observedValue: indicator.observedValue ?? null,
        severity: indicator.severity ?? null,
        imageId: record.imageId,
        imageName: record.imageName,
        detectedAt: record.finishedAt ?? null,
        workflowId: record.workflowId,
        workflowRunId: record.workflowRunId,
      };
      rowsByCategory.provenance.push(row);
    });
  }

  for (const image of images) {
    if (image.projectImageId === undefined || 'hasImage' in image) continue;
    const { latitude, longitude } = image.exif;
    if (latitude == null || longitude == null) continue;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;
    const locationLabel = image.exif.location?.formatted ?? null;
    const row: GpsEvidenceRow = {
      id: `gps-${image.projectImageId}`,
      kind: 'gps',
      latitude,
      longitude,
      locationLabel,
      imageId: image.projectImageId,
      imageName: image.file.name,
      detectedAt: null,
      workflowId: null,
      workflowRunId: null,
    };
    rowsByCategory['gps-locations'].push(row);
  }

  const categories = CATEGORY_ORDER.map((id) => ({
    id,
    title: CATEGORY_TITLES[id],
    count: rowsByCategory[id].length,
  }));

  return { categories, rowsByCategory };
}
