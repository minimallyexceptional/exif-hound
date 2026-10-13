import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { EvidenceCategoryTable } from '../EvidenceCategoryTable';
import type { EvidenceRow } from 'exif-hound-core';

const baseMeta = {
  imageId: 9,
  imageName: 'scene.png',
  detectedAt: new Date('2026-01-01T12:00:00Z'),
  workflowId: 'wf-1',
  workflowRunId: 'run-1',
};

describe('EvidenceCategoryTable', () => {
  it('renders default columns and opens the source image on row click', () => {
    const rows: EvidenceRow[] = [{
      id: 'email-1',
      kind: 'identifier',
      family: 'email',
      value: 'user@example.org',
      confidence: 91,
      ...baseMeta,
    }];
    const onOpenImage = jest.fn();
    render(
      <div style={{ height: 400 }}>
        <EvidenceCategoryTable categoryId="emails" title="Emails" rows={rows} onOpenImage={onOpenImage} />
      </div>,
    );
    expect(screen.getByRole('grid', { name: 'Emails evidence table' })).toBeInTheDocument();
    expect(screen.getByText('user@example.org')).toBeInTheDocument();
    expect(screen.getByText('91%')).toBeInTheDocument();
    const rowsInGrid = screen.getAllByRole('row');
    const bodyRow = rowsInGrid.find((row) => within(row).queryByText('user@example.org'));
    fireEvent.click(bodyRow!);
    expect(onOpenImage).toHaveBeenCalledWith(9);
  });

  it('uses provenance-specific columns', () => {
    const rows: EvidenceRow[] = [{
      id: 'prov-1',
      kind: 'provenance',
      code: 'META_MISMATCH',
      message: 'Unexpected software tag',
      observedValue: 'EditorX',
      severity: 'medium',
      ...baseMeta,
    }];
    render(
      <div style={{ height: 400 }}>
        <EvidenceCategoryTable categoryId="provenance" title="Provenance" rows={rows} onOpenImage={jest.fn()} />
      </div>,
    );
    expect(screen.getByText('META_MISMATCH')).toBeInTheDocument();
    expect(screen.getByText('EditorX')).toBeInTheDocument();
  });

  it('uses GPS columns with place label', () => {
    const rows: EvidenceRow[] = [{
      id: 'gps-1',
      kind: 'gps',
      latitude: 51.5,
      longitude: -0.12,
      locationLabel: 'London',
      imageId: 3,
      imageName: 'geo.jpg',
      detectedAt: null,
      workflowId: null,
      workflowRunId: null,
    }];
    render(
      <div style={{ height: 400 }}>
        <EvidenceCategoryTable categoryId="gps-locations" title="GPS locations" rows={rows} onOpenImage={jest.fn()} />
      </div>,
    );
    expect(screen.getByText('51.500000, -0.120000')).toBeInTheDocument();
    expect(screen.getByText('London')).toBeInTheDocument();
  });

  it('labels the value column Text for OCR rows', () => {
    const rows: EvidenceRow[] = [{
      id: 'ocr-1',
      kind: 'ocr',
      text: 'hello',
      confidence: 80,
      resultStatus: 'success',
      imageId: 1,
      imageName: 'scan.png',
      detectedAt: new Date(),
      workflowId: 'wf',
      workflowRunId: 'run',
    }];
    render(
      <div style={{ height: 400 }}>
        <EvidenceCategoryTable categoryId="ocr-text" title="OCR text" rows={rows} onOpenImage={jest.fn()} />
      </div>,
    );
    expect(screen.getByRole('columnheader', { name: 'Text' })).toBeInTheDocument();
    expect(screen.getByText('hello')).toBeInTheDocument();
  });

  it('shows empty state when there are no rows', () => {
    render(
      <div style={{ height: 400 }}>
        <EvidenceCategoryTable categoryId="urls" title="URLs & domains" rows={[]} onOpenImage={jest.fn()} />
      </div>,
    );
    expect(screen.getByText('No items yet')).toBeInTheDocument();
  });
});
