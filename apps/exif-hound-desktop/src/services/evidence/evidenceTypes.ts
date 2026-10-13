export type EvidenceCategoryId =
  | 'license-plates'
  | 'phone-numbers'
  | 'emails'
  | 'urls'
  | 'text-coordinates'
  | 'gps-locations'
  | 'ocr-text'
  | 'provenance';

export interface EvidenceRowBase {
  id: string;
  imageId: number;
  imageName: string;
  detectedAt: Date | null;
  workflowId: string | null;
  workflowRunId: string | null;
}

export interface IdentifierEvidenceRow extends EvidenceRowBase {
  kind: 'identifier';
  value: string;
  confidence: number | null;
  family: string;
}

export interface GpsEvidenceRow extends EvidenceRowBase {
  kind: 'gps';
  latitude: number;
  longitude: number;
  locationLabel: string | null;
}

export interface OcrEvidenceRow extends EvidenceRowBase {
  kind: 'ocr';
  text: string;
  confidence: number | null;
  resultStatus: string | null;
}

export interface ProvenanceEvidenceRow extends EvidenceRowBase {
  kind: 'provenance';
  code: string;
  message: string;
  observedValue: string | null;
  severity: string | null;
}

export type EvidenceRow = IdentifierEvidenceRow | GpsEvidenceRow | OcrEvidenceRow | ProvenanceEvidenceRow;

export interface EvidenceCategoryMeta {
  id: EvidenceCategoryId;
  title: string;
  count: number;
}

export interface EvidenceIndex {
  categories: EvidenceCategoryMeta[];
  rowsByCategory: Record<EvidenceCategoryId, EvidenceRow[]>;
}
