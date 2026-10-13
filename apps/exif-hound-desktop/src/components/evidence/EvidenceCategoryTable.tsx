import React, { useMemo } from 'react';
import { VirtualDataGrid, type VirtualGridColumn } from '../common/VirtualDataGrid';
import type { EvidenceCategoryId, EvidenceRow } from '../../services/evidence/evidenceTypes';
import { formatShortDateTime } from '../../utils/date';

interface Props {
  categoryId: EvidenceCategoryId;
  title: string;
  rows: EvidenceRow[];
  onOpenImage: (imageId: number) => void;
}

function formatWhen(date: Date | null): string {
  if (!date) return '—';
  return formatShortDateTime(date.toISOString());
}

function formatConfidence(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${Math.round(value)}%`;
}

function rowValue(row: EvidenceRow): string {
  if (row.kind === 'identifier') return row.value;
  if (row.kind === 'ocr') return row.text.trim() || '(no text)';
  if (row.kind === 'gps') return `${row.latitude.toFixed(6)}, ${row.longitude.toFixed(6)}`;
  return row.observedValue ?? row.message ?? row.code;
}

export const EvidenceCategoryTable: React.FC<Props> = ({ categoryId, title, rows, onOpenImage }) => {
  const columns = useMemo((): VirtualGridColumn<EvidenceRow>[] => {
    const copyableValue = (): string => 'selectable-value';
    const base: VirtualGridColumn<EvidenceRow>[] = [
      {
        id: 'value',
        label: categoryId === 'ocr-text' ? 'Text' : 'Value',
        width: 'flex',
        value: rowValue,
        cellClassName: copyableValue,
      },
      {
        id: 'confidence',
        label: 'Confidence',
        width: 110,
        align: 'right',
        value: (row) => {
          if (row.kind === 'identifier' || row.kind === 'ocr') return formatConfidence(row.confidence);
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
        value: (row) => formatWhen(row.detectedAt),
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
        { id: 'code', label: 'Code', width: 140, value: (row) => (row.kind === 'provenance' ? row.code : '—'), cellClassName: copyableValue },
        { id: 'value', label: 'Value', width: 'flex', value: rowValue, cellClassName: copyableValue },
        ...base.slice(2),
      ];
    }
    if (categoryId === 'gps-locations') {
      return [
        { id: 'value', label: 'Coordinates', width: 'flex', value: rowValue, cellClassName: copyableValue },
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
  }, [categoryId]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <VirtualDataGrid
        rows={rows}
        columns={columns}
        ariaLabel={`${title} evidence table`}
        getRowKey={(row) => row.id}
        onRowClick={(row) => onOpenImage(row.imageId)}
        emptyState={(
          <div className="flex h-full min-h-[12rem] flex-col items-center justify-center px-6 text-center">
            <p className="text-base font-medium text-app-white">No items yet</p>
            <p className="mt-1 max-w-md text-sm text-app-accent-dim">
              Run a Workbench workflow with Text &amp; Identifiers, OCR, or Provenance to populate this list.
            </p>
          </div>
        )}
      />
    </div>
  );
};
