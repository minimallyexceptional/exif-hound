import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ExifPanel from '../ExifPanel';
import type { ImageData } from '../../types';
import { CoreProvider } from '../../core/CoreContext';
import type { ExifHoundCore } from 'exif-hound-core';

jest.mock('../ProjectImage', () => ({
  ProjectImage: ({ alt }: { alt: string }) => (
    <img alt={alt} src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==" />
  ),
}));

const loadExifReaderTags = jest.fn();

const core = {
  middleware: {
    exif: { loadExifReaderTags },
  },
} as unknown as ExifHoundCore;

const image: ImageData = {
  id: 'img-1',
  url: 'blob:x',
  file: new File([Uint8Array.from([1, 2, 3])], 'shot.jpg', { type: 'image/jpeg' }),
  exif: {
    make: 'TestCam',
    model: 'Hound-1',
    dateTimeOriginal: '2024:06:15 10:30:00',
    latitude: 51.5,
    longitude: -0.127778,
  },
};

function renderPanel() {
  return render(
    <CoreProvider core={core}>
      <ExifPanel image={image} onShowComparison={jest.fn()} />
    </CoreProvider>
  );
}

describe('ExifPanel', () => {
  beforeEach(() => {
    loadExifReaderTags.mockReset();
    loadExifReaderTags.mockResolvedValue({
      exif: {
        Make: { description: 'TestCam', value: 'TestCam' },
        Model: { description: 'Hound-1', value: 'Hound-1' },
        ExposureTime: { description: '1/250', value: [1, 250] },
      },
    });
  });

  it('keeps the preview and compare action and shows the full EXIF list without a click-through', async () => {
    renderPanel();

    expect(screen.getByRole('img', { name: 'Selected' })).toBeInTheDocument();
    expect(screen.getByTestId('exif-sidebar-chrome')).toHaveClass('bg-app-dark');
    expect(screen.getByTestId('exif-sidebar-preview')).toHaveClass('w-full');
    expect(screen.getByText('shot.jpg')).toBeInTheDocument();
    const preview = screen.getByRole('img', { name: 'Selected' });
    const compare = screen.getByRole('button', { name: 'Compare with EXIF Thumbnail' });
    expect(preview.compareDocumentPosition(compare) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'View All EXIF Data' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Back to Details' })).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Camera Details' })).toBeInTheDocument();
    });
    expect(screen.getByText('TestCam')).toBeInTheDocument();
    expect(screen.getByTestId('exif-tag-list')).toHaveClass('overflow-y-auto');

    const headings = screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent);
    const location = headings.indexOf('Location');
    const dateTaken = headings.indexOf('Date Taken');
    const camera = headings.indexOf('Camera Details');
    const fileDetails = headings.indexOf('File Details');
    expect(location).toBeGreaterThanOrEqual(0);
    expect(dateTaken).toBeGreaterThan(location);
    expect(camera).toBeGreaterThan(dateTaken);
    expect(fileDetails).toBeGreaterThan(camera);
  });
});
