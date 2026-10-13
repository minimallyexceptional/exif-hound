import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import EvidenceView from '../EvidenceView';
import type { ProjectStore } from 'investigation-archive';

const storeMocks = {
  listProjectOcrResults: jest.fn().mockResolvedValue([]),
  listProjectIdentifierResults: jest.fn().mockResolvedValue([]),
  listProjectProvenanceResults: jest.fn().mockResolvedValue([]),
};
const store = storeMocks as unknown as ProjectStore;

describe('EvidenceView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows the bento hub with category cards', async () => {
    render(<EvidenceView images={[]} store={store} onSelectImage={jest.fn()} />);
    expect(await screen.findByRole('region', { name: 'Evidence' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Refresh evidence' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /License plates, 0 items/i })).toBeInTheDocument();
  });

  it('opens a category table when a card is selected', async () => {
    render(<EvidenceView images={[]} store={store} onSelectImage={jest.fn()} />);
    fireEvent.click(await screen.findByRole('button', { name: /Emails, 0 items/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'All categories' })).toBeInTheDocument();
    });
    expect(screen.getByText('No items yet')).toBeInTheDocument();
  });
});
