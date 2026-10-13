import type { OcrResultRecord, WorkflowToolResultRecord } from 'investigation-archive';
import type { ImageData } from '../../types';
import type {
  EvidenceCategoryId,
  EvidenceIndex,
  EvidenceRow,
  GpsEvidenceRow,
  IdentifierEvidenceRow,
  OcrEvidenceRow,
  ProvenanceEvidenceRow,
} from './evidenceTypes';

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

export function buildEvidenceIndex(
  ocrResults: OcrResultRecord[],
  identifierResults: WorkflowToolResultRecord[],
  provenanceResults: WorkflowToolResultRecord[],
  images: ImageData[],
): EvidenceIndex {
  const rowsByCategory = emptyRows();

  for (const record of identifierResults) {
    if (record.resultStatus !== 'success') continue;
    const payload = record.result as { candidates?: unknown[] };
    const candidates = Array.isArray(payload?.candidates) ? payload.candidates : [];
    candidates.forEach((candidate, index) => {
      if (!isIdentifierCandidate(candidate)) return;
      const categoryId = FAMILY_TO_CATEGORY[candidate.family];
      if (!categoryId) return;
      const row: IdentifierEvidenceRow = {
        id: `id-${record.id ?? record.workflowRunId}-${index}`,
        kind: 'identifier',
        family: candidate.family,
        value: candidate.value,
        confidence: typeof candidate.confidence === 'number' ? candidate.confidence : null,
        imageId: record.imageId,
        imageName: record.imageName,
        detectedAt: record.finishedAt ?? null,
        workflowId: record.workflowId,
        workflowRunId: record.workflowRunId,
      };
      rowsByCategory[categoryId].push(row);
    });
  }

  for (const record of ocrResults) {
    const row: OcrEvidenceRow = {
      id: `ocr-${record.id ?? `${record.imageId}-${record.processedAt.getTime()}`}`,
      kind: 'ocr',
      text: record.text,
      confidence: record.confidence,
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
