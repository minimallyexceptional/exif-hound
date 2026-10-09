import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Workbench from '../Workbench';
import type { ImageData } from '../../types';
import type { OcrResultRecord } from 'investigation-archive';

jest.mock('../ImageGallery', () => () => <div data-testid="gallery" />);

const image = {
  id: 'image-a',
  projectImageId: 12,
  url: 'blob:image-a',
  file: { name: 'poster.png', type: 'image/png', size: 20, lastModified: 0 },
  exif: {},
} as ImageData;
const result: OcrResultRecord = { imageId: 12, text: 'OPEN LATE', confidence: 96, processedAt: new Date() };
const baseProps = {
  images: [image],
  selectedImage: image,
  onSelectImage: jest.fn(),
  onRunOcr: jest.fn(),
  onGetOcrResult: jest.fn().mockResolvedValue(null),
  onOpenResults: jest.fn(),
};

describe('Workbench OCR tool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    baseProps.onGetOcrResult.mockResolvedValue(null);
  });

  it('runs OCR, shows progress, then offers saved results', async () => {
    baseProps.onRunOcr.mockImplementation(async (_image, onProgress) => {
      onProgress({ status: 'Recognizing text', progress: 0.54 });
      return result;
    });
    render(<Workbench {...baseProps} />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Run OCR' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Run OCR' }));
    await waitFor(() => expect(screen.getByRole('button', { name: /View/ })).toBeInTheDocument());
    expect(baseProps.onRunOcr).toHaveBeenCalledWith(image, expect.any(Function));
    fireEvent.click(screen.getByRole('button', { name: /View/ }));
    expect(baseProps.onOpenResults).toHaveBeenCalledWith(image, result);
  });

  it('stays on the Workbench and explains when no text was found', async () => {
    baseProps.onRunOcr.mockResolvedValue({ ...result, text: ' \n ' });
    render(<Workbench {...baseProps} />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Run OCR' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Run OCR' }));
    expect(await screen.findByRole('dialog')).toHaveTextContent('No text could be extracted from this image.');
    expect(screen.getByRole('region', { name: 'Workbench' })).toBeInTheDocument();
  });

  it('shows a retryable error when recognition fails', async () => {
    baseProps.onRunOcr.mockRejectedValue(new Error('Worker unavailable'));
    render(<Workbench {...baseProps} />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Run OCR' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Run OCR' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Worker unavailable');
    expect(screen.getByRole('button', { name: 'Run OCR' })).toBeEnabled();
  });
});
