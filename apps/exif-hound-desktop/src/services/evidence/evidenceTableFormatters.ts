import type { EvidenceRow } from './evidenceTypes';
import { formatShortDateTime } from '../../utils/date';

export function formatEvidenceWhen(date: Date | null): string {
  if (!date) return '—';
  return formatShortDateTime(date.toISOString());
}

export function formatEvidenceConfidence(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${Math.round(value)}%`;
}

export function evidenceRowDisplayValue(row: EvidenceRow): string {
  if (row.kind === 'identifier') return row.value;
  if (row.kind === 'ocr') return row.text.trim() || '(no text)';
  if (row.kind === 'gps') return `${row.latitude.toFixed(6)}, ${row.longitude.toFixed(6)}`;
  return row.observedValue ?? row.message ?? row.code;
}
