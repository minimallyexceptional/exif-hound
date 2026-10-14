import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import ImageUploader from '../ImageUploader';
import { notify } from '../../feedback/notify';

jest.mock('../../feedback/notify', () => ({
  notify: { success: jest.fn(), error: jest.fn(), loading: jest.fn(), action: jest.fn(), dismiss: jest.fn() },
  UPDATE_TOAST_IDS: {},
}));

jest.mock('../../hooks/useExifData', () => ({
  useExifData: () => ({
    processExifData: jest.fn(async (file: File) => {
      if (file.name.includes('bad')) throw new Error('parse failed');
      return { make: 'TestCam' };
    }),
  }),
}));

jest.mock('../../context/SettingsContext', () => ({
  useSettings: () => ({ privacySettings: { reverseGeocoding: false } }),
}));

function file(name: string, type = 'image/jpeg') {
  return new File(['bytes'], name, { type });
}

describe('ImageUploader', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('toasts a summary after a successful batch', async () => {
    const onImageUpload = jest.fn();
    const { container } = render(<ImageUploader onImageUpload={onImageUpload} inputId="test-upload" hideDropZone />);
    const input = container.querySelector('input') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file('a.jpg'), file('b.jpg')] } });
    await waitFor(() => expect(notify.success).toHaveBeenCalledWith('Imported 2 images'));
    expect(notify.error).not.toHaveBeenCalled();
  });

  it('toasts when processing fails', async () => {
    const onImageUpload = jest.fn();
    const { container } = render(<ImageUploader onImageUpload={onImageUpload} inputId="test-upload-fail" hideDropZone />);
    const input = container.querySelector('input') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file('bad.jpg')] } });
    await waitFor(() => expect(notify.error).toHaveBeenCalledWith("Couldn't process 1 image"));
  });

  it('toasts a partial-failure summary', async () => {
    const onImageUpload = jest.fn();
    const { container } = render(<ImageUploader onImageUpload={onImageUpload} inputId="test-upload-mix" hideDropZone />);
    const input = container.querySelector('input') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file('a.jpg'), file('bad.jpg')] } });
    await waitFor(() => expect(notify.error).toHaveBeenCalledWith("Couldn't process 1 of 2 images"));
    expect(notify.success).not.toHaveBeenCalled();
  });
});
