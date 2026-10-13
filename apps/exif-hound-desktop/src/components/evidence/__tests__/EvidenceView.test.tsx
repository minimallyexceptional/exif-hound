import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import EvidenceView from '../EvidenceView';
import type { ProjectStore } from 'investigation-archive';
import type { ImageData } from '../../../types';
const storeMocks = {
  listProjectOcrResults: jest.fn().mockResolvedValue([]),
  listProjectIdentifierResults: jest.fn().mockResolvedValue([]),
  listProjectProvenanceResults: jest.fn().mockResolvedValue([]),
};
const store = storeMocks as unknown as ProjectStore;

const image: ImageData = {
  id: 'img-a',
  projectImageId: 42,
  url: 'blob:x',
  file: { name: 'target.jpg', type: 'image/jpeg', size: 1, lastModified: 0 },
  exif: {},
};

describe('EvidenceView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    storeMocks.listProjectOcrResults.mockResolvedValue([]);
    storeMocks.listProjectIdentifierResults.mockResolvedValue([]);
    storeMocks.listProjectProvenanceResults.mockResolvedValue([]);
  });

  it('prompts to open an investigation when store is missing', () => {
    render(<EvidenceView images={[]} store={null} onSelectImage={jest.fn()} />);
    expect(screen.getByText('Open an investigation first')).toBeInTheDocument();
  });

  it('shows the bento hub with category cards', async () => {
    render(<EvidenceView images={[]} store={store} onSelectImage={jest.fn()} />);
    expect(await screen.findByRole('region', { name: 'Evidence' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Refresh evidence' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /License plates, 0 items/i })).toBeInTheDocument();
  });

  it('shows empty hub guidance when there are no findings', async () => {
    render(<EvidenceView images={[]} store={store} onSelectImage={jest.fn()} />);
    expect(await screen.findByText(/No findings yet/)).toBeInTheDocument();
    expect(screen.getByText('categories')).toBeInTheDocument();
    expect(screen.getByText('items')).toBeInTheDocument();
  });

  it('opens a category table when a card is selected', async () => {
    render(<EvidenceView images={[]} store={store} onSelectImage={jest.fn()} />);
    fireEvent.click(await screen.findByRole('button', { name: /Emails, 0 items/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'All categories' })).toBeInTheDocument();
    });
    expect(screen.getByText('No items yet')).toBeInTheDocument();
  });

  it('returns to the hub from a category', async () => {
    render(<EvidenceView images={[]} store={store} onSelectImage={jest.fn()} />);
    fireEvent.click(await screen.findByRole('button', { name: /Emails, 0 items/i }));
    fireEvent.click(await screen.findByRole('button', { name: 'All categories' }));
    expect(await screen.findByRole('button', { name: /License plates, 0 items/i })).toBeInTheDocument();
  });

  it('shows a generic message when loading throws a non-Error value', async () => {
    storeMocks.listProjectOcrResults.mockRejectedValueOnce('offline');
    render(<EvidenceView images={[]} store={store} onSelectImage={jest.fn()} />);
    expect(await screen.findByText('Could not load evidence.')).toBeInTheDocument();
  });

  it('surfaces load errors and retries', async () => {
    storeMocks.listProjectOcrResults.mockRejectedValueOnce(new Error('Database locked'));
    render(<EvidenceView images={[]} store={store} onSelectImage={jest.fn()} />);
    expect(await screen.findByText('Database locked')).toBeInTheDocument();
    storeMocks.listProjectOcrResults.mockResolvedValueOnce([]);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByRole('button', { name: /License plates, 0 items/i })).toBeInTheDocument();
  });

  it('selects an image from a category row and navigates to the map', async () => {
    const processedAt = new Date('2026-01-01T12:00:00Z');
    storeMocks.listProjectOcrResults.mockResolvedValueOnce([{
      id: 1,
      imageId: 42,
      imageName: 'target.jpg',
      text: 'plate ABC123',
      confidence: 95,
      processedAt,
      resultStatus: 'success',
      workflowId: 'wf',
      workflowRunId: 'run',
    }]);
    const onSelectImage = jest.fn();
    const onNavigateToMap = jest.fn();
    render(
      <EvidenceView
        images={[image]}
        store={store}
        onSelectImage={onSelectImage}
        onNavigateToMap={onNavigateToMap}
      />,
    );
    fireEvent.click(await screen.findByRole('button', { name: /OCR text, 1 item/i }));
    const rows = await screen.findAllByRole('row');
    const dataRow = rows.find((row) => row.textContent?.includes('plate ABC123'));
    fireEvent.click(dataRow!);
    expect(onSelectImage).toHaveBeenCalledWith(image);
    expect(onNavigateToMap).toHaveBeenCalled();
  });

  it('reloads evidence when refresh is clicked', async () => {
    render(<EvidenceView images={[]} store={store} onSelectImage={jest.fn()} />);
    await screen.findByRole('button', { name: /License plates, 0 items/i });
    const initialLoads = storeMocks.listProjectOcrResults.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'Refresh evidence' }));
    await waitFor(() => expect(storeMocks.listProjectOcrResults.mock.calls.length).toBeGreaterThan(initialLoads));
  });

  it('uses singular item label when total count is one', async () => {
    const processedAt = new Date('2026-01-01T12:00:00Z');
    storeMocks.listProjectIdentifierResults.mockResolvedValueOnce([{
      id: 1,
      imageId: 1,
      imageName: 'a.png',
      result: { candidates: [{ family: 'email', value: 'x@y.z', confidence: 80 }] },
      resultStatus: 'success',
      workflowId: 'wf',
      workflowRunId: 'run',
      nodeId: 'ids',
      toolVersion: '1',
      startedAt: processedAt,
      finishedAt: processedAt,
    }]);
    render(<EvidenceView images={[]} store={store} onSelectImage={jest.fn()} />);
    await screen.findByRole('button', { name: /Emails, 1 item/i });
    expect(screen.getByText('item')).toBeInTheDocument();
    expect(screen.queryByText('items')).not.toBeInTheDocument();
  });
});
