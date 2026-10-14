import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ExportModal from '../ExportModal';
import { notify } from '../../feedback/notify';
import { saveCsvFile, saveJsonFile } from '../../utils/fileSystem';
import type { ImageData } from '../../types';

jest.mock('../../feedback/notify', () => ({
  notify: { success: jest.fn(), error: jest.fn(), loading: jest.fn(), action: jest.fn(), dismiss: jest.fn() },
  UPDATE_TOAST_IDS: {},
}));

jest.mock('../../utils/fileSystem', () => ({
  saveCsvFile: jest.fn(),
  saveJsonFile: jest.fn(),
}));

const images = [{
  id: '1',
  url: '',
  file: { name: 'a.jpg', type: 'image/jpeg', size: 10, lastModified: 0 },
  exif: {},
}] as ImageData[];

describe('ExportModal', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('toasts success and closes after CSV export', async () => {
    (saveCsvFile as jest.Mock).mockResolvedValue(true);
    const onClose = jest.fn();
    render(<ExportModal images={images} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Export as CSV' }));
    await waitFor(() => expect(notify.success).toHaveBeenCalledWith('Exported CSV'));
    expect(onClose).toHaveBeenCalled();
  });

  it('toasts an error and stays open when saving fails', async () => {
    (saveCsvFile as jest.Mock).mockResolvedValue(false);
    const onClose = jest.fn();
    render(<ExportModal images={images} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Export as CSV' }));
    await waitFor(() => expect(notify.error).toHaveBeenCalledWith('Failed to save CSV file. Please try again.'));
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Export Data' })).toBeInTheDocument();
  });

  it('toasts success after JSON export', async () => {
    (saveJsonFile as jest.Mock).mockResolvedValue(true);
    const onClose = jest.fn();
    render(<ExportModal images={images} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Export as JSON' }));
    await waitFor(() => expect(notify.success).toHaveBeenCalledWith('Exported JSON'));
    expect(onClose).toHaveBeenCalled();
  });
});
