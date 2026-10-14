import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import OcrResultsView from '../OcrResultsView';
import type { ImageData } from '../../types';
import { notify } from '../../feedback/notify';

jest.mock('../../feedback/notify', () => ({
  notify: { success: jest.fn(), error: jest.fn(), loading: jest.fn(), action: jest.fn(), dismiss: jest.fn() },
  UPDATE_TOAST_IDS: {},
}));

const image = {
  id: 'image-a', projectImageId: 12, url: '',
  file: { name: 'poster.png', type: 'image/png', size: 20, lastModified: 0 }, exif: {},
} as ImageData;
const result = { imageId: 12, text: 'OPEN LATE', confidence: 95.7, processedAt: new Date() };

describe('OCR results view', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('copies recognized text and returns to the Workbench', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    const onBack = jest.fn();
    render(<OcrResultsView image={image} result={result} onBack={onBack} />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy text' }));
    expect(writeText).toHaveBeenCalledWith('OPEN LATE');
    await waitFor(() => expect(notify.success).toHaveBeenCalledWith('Extracted text copied to clipboard.'));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Back to Workbench' }));
    expect(onBack).toHaveBeenCalled();
  });

  it('toasts when clipboard access fails', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: jest.fn().mockRejectedValue(new Error('denied')) },
    });
    render(<OcrResultsView image={image} result={result} onBack={jest.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy text' }));
    await waitFor(() => expect(notify.error).toHaveBeenCalledWith('Clipboard access is unavailable.'));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
