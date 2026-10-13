import type { VirtualGridColumn } from '../../components/common/VirtualDataGrid';
import type { EvidenceCategoryId, EvidenceRow } from './evidenceTypes';
import {
  evidenceRowDisplayValue,
  formatEvidenceConfidence,
  formatEvidenceWhen,
} from './evidenceTableFormatters';

const copyableValue = (): string => 'selectable-value';

/** Column layout rules for evidence category tables (no React). */
export class EvidenceCategoryColumnModel {
  buildColumns(categoryId: EvidenceCategoryId): VirtualGridColumn<EvidenceRow>[] {
    const base: VirtualGridColumn<EvidenceRow>[] = [
      {
        id: 'value',
        label: categoryId === 'ocr-text' ? 'Text' : 'Value',
        width: 'flex',
        value: evidenceRowDisplayValue,
        cellClassName: copyableValue,
      },
      {
        id: 'confidence',
        label: 'Confidence',
        width: 110,
        align: 'right',
        value: (row) => {
          if (row.kind === 'identifier' || row.kind === 'ocr') return formatEvidenceConfidence(row.confidence);
          return '—';
        },
      },
      {
        id: 'image',
        label: 'Source image',
        width: 180,
        value: (row) => row.imageName,
      },
      {
        id: 'detected',
        label: 'Detected',
        width: 144,
        value: (row) => formatEvidenceWhen(row.detectedAt),
      },
      {
        id: 'workflow',
        label: 'Workflow',
        width: 120,
        value: (row) => row.workflowId ?? '—',
      },
    ];

    if (categoryId === 'provenance') {
      return [
        {
          id: 'code',
          label: 'Code',
          width: 140,
          value: (row) => (row.kind === 'provenance' ? row.code : '—'),
          cellClassName: copyableValue,
        },
        {
          id: 'value',
          label: 'Value',
          width: 'flex',
          value: evidenceRowDisplayValue,
          cellClassName: copyableValue,
        },
        ...base.slice(2),
      ];
    }

    if (categoryId === 'gps-locations') {
      return [
        {
          id: 'value',
          label: 'Coordinates',
          width: 'flex',
          value: evidenceRowDisplayValue,
          cellClassName: copyableValue,
        },
        {
          id: 'location',
          label: 'Place',
          width: 200,
          value: (row) => (row.kind === 'gps' ? row.locationLabel ?? '—' : '—'),
          cellClassName: copyableValue,
        },
        ...base.slice(2),
      ];
    }

    return base;
  }
}
