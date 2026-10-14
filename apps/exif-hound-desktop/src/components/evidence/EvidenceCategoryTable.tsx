import React, { useMemo } from 'react';
import { VirtualDataGrid } from '../common/VirtualDataGrid';
import type { EvidenceCategoryId, EvidenceRow } from 'exif-hound-core';
import { EvidenceCategoryColumnModel } from 'exif-hound-core';

interface Props {
  categoryId: EvidenceCategoryId;
  title: string;
  rows: EvidenceRow[];
  onOpenImage: (imageId: number) => void;
}

const columnModel = new EvidenceCategoryColumnModel();

export const EvidenceCategoryTable: React.FC<Props> = ({ categoryId, title, rows, onOpenImage }) => {
  const columns = useMemo(
    () => columnModel.buildColumns(categoryId),
    [categoryId],
  );

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
