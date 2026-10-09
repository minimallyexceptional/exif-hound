import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import OcrResultsView from '../OcrResultsView';
import type { ImageData } from '../../types';

const image = {
  id: 'image-a', projectImageId: 12, url: '',
  file: { name: 'poster.png', type: 'image/png', size: 20, lastModified: 0 }, exif: {},
} as ImageData;
const result = { imageId: 12, text: 'OPEN LATE', confidence: 95.7, processedAt: new Date() };

describe('OCR results view', () => {
  it('copies recognized text and returns to the Workbench', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    const onBack = jest.fn();
    render(<OcrResultsView image={image} result={result} onBack={onBack} />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy text' }));
    expect(writeText).toHaveBeenCalledWith('OPEN LATE');
    expect(await screen.findByText('Extracted text copied to clipboard.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Back to Workbench' }));
    expect(onBack).toHaveBeenCalled();
  });
});
