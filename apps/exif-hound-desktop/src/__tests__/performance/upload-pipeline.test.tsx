import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ImageUploader from '../../components/ImageUploader';
import { useExifData } from '../../hooks/useExifData';
import { SettingsProvider } from '../../context/SettingsContext';

const renderUploader = (onImageUpload: jest.Mock) =>
  render(
    <SettingsProvider>
      <ImageUploader onImageUpload={onImageUpload} inputId="test-input" />
    </SettingsProvider>
  );

// Mock the EXIF worker
jest.mock('../../workers/exifWorker', () => ({
  __esModule: true,
  default: class MockExifWorker {
    postMessage = jest.fn();
    addEventListener = jest.fn();
    terminate = jest.fn();
  }
}));

// Mock useExifData hook
jest.mock('../../hooks/useExifData');
const mockUseExifData = useExifData as jest.MockedFunction<typeof useExifData>;

const createMockFile = (name: string, size: number = 1000000): File => {
  const file = new File([''], name, { type: 'image/jpeg' });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('Upload Pipeline Performance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();

    // Mock the processExifData function
    mockUseExifData.mockReturnValue({
      processExifData: jest.fn().mockImplementation(() =>
        Promise.resolve({
          dateTimeOriginal: '2023-01-01T12:00:00.000Z',
          make: 'Test Camera',
          model: 'Model X',
          latitude: 40.7128,
          longitude: -74.0060,
          location: { loading: true } // Initially loading
        })
      ),
      cleanup: jest.fn()
    });
  });

  test('should process multiple files concurrently', async () => {
    const onImageUpload = jest.fn();
    const files = [
      createMockFile('test1.jpg'),
      createMockFile('test2.jpg'),
      createMockFile('test3.jpg'),
      createMockFile('test4.jpg'),
      createMockFile('test5.jpg')
    ];

    const { container } = renderUploader(onImageUpload);

    const input = container.querySelector('input[type="file"]');

    const startTime = Date.now();

    // Upload files
    if (input) {
      Object.defineProperty(input, 'files', { value: files });
      fireEvent.change(input);
    }

    // Wait for all uploads to complete
    await waitFor(() => {
      // 2 calls per file: initial loading-state image + processed result
      expect(onImageUpload).toHaveBeenCalledTimes(10);
    }, { timeout: 2000 });

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    // Should complete much faster than sequential processing
    // With concurrency, 5 files should take roughly the same time as 1-2 files
    expect(totalTime).toBeLessThan(1000); // Should be fast due to concurrency
  });

  test('should not block UI during EXIF processing', async () => {
    const onImageUpload = jest.fn();
    const file = createMockFile('large-image.jpg', 10000000);

    const { container } = renderUploader(onImageUpload);

    const input = container.querySelector('input[type="file"]');

    // Upload file
    if (input) {
      Object.defineProperty(input, 'files', { value: [file] });
      fireEvent.change(input);
    }

    // UI should remain responsive immediately: the file input is still
    // present and enabled (the component renders no button role)
    expect(input).not.toBeNull();
    expect(input).not.toBeDisabled();

    await waitFor(() => {
      expect(onImageUpload).toHaveBeenCalledTimes(1);
    });
  });

  test('should add images with loading location state initially', async () => {
    localStorage.setItem('privacySettings', JSON.stringify({ reverseGeocoding: true }));
    const onImageUpload = jest.fn();
    const file = createMockFile('test.jpg');

    const { container } = renderUploader(onImageUpload);

    const input = container.querySelector('input[type="file"]');

    if (input) {
      Object.defineProperty(input, 'files', { value: [file] });
      fireEvent.change(input);
    }

    await waitFor(() => {
      expect(onImageUpload).toHaveBeenCalledWith(
        expect.objectContaining({
          exif: expect.objectContaining({
            location: { loading: true }
          })
        })
      );
    });
  });

  test('should limit concurrent processing to avoid overwhelming system', async () => {
    const onImageUpload = jest.fn();

    // Create many files
    const files = Array.from({ length: 20 }, (_, i) =>
      createMockFile(`test${i}.jpg`)
    );

    let concurrentProcessing = 0;
    let maxConcurrent = 0;

    // Track concurrent processing
    mockUseExifData.mockReturnValue({
      processExifData: jest.fn().mockImplementation(() => {
        concurrentProcessing++;
        maxConcurrent = Math.max(maxConcurrent, concurrentProcessing);

        return new Promise(resolve => {
          setTimeout(() => {
            concurrentProcessing--;
            resolve({
              dateTimeOriginal: '2023-01-01T12:00:00.000Z',
              make: 'Test Camera',
              model: 'Model X',
              latitude: 40.7128,
              longitude: -74.0060,
              location: { loading: true }
            });
          }, 10);
        });
      }),
      cleanup: jest.fn()
    });

    const { container } = renderUploader(onImageUpload);

    const input = container.querySelector('input[type="file"]');

    if (input) {
      Object.defineProperty(input, 'files', { value: files });
      fireEvent.change(input);
    }

    await waitFor(() => {
      // 2 calls per file: initial loading-state image + processed result
      expect(onImageUpload).toHaveBeenCalledTimes(40);
    }, { timeout: 5000 });

    // Should limit concurrent processing (e.g., max 3-4 concurrent)
    expect(maxConcurrent).toBeLessThanOrEqual(4);
    expect(maxConcurrent).toBeGreaterThan(1); // But should use some concurrency
  });

  test('should include resolved location when reverse geocoding is enabled', async () => {
    localStorage.setItem('privacySettings', JSON.stringify({ reverseGeocoding: true }));
    const onImageUpload = jest.fn();
    const file = createMockFile('test.jpg');

    mockUseExifData.mockReturnValue({
      processExifData: jest.fn().mockResolvedValue({
        dateTimeOriginal: '2023-01-01T12:00:00.000Z',
        latitude: 40.7128,
        longitude: -74.0060,
        location: { loading: false, country: 'Test Country', city: 'Test City' },
      }),
      cleanup: jest.fn(),
    });

    const { container } = renderUploader(onImageUpload);

    const input = container.querySelector('input[type="file"]');

    if (input) {
      Object.defineProperty(input, 'files', { value: [file] });
      fireEvent.change(input);
    }

    await waitFor(() => {
      expect(onImageUpload.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    const lastUploaded = onImageUpload.mock.calls[onImageUpload.mock.calls.length - 1]?.[0];
    expect(lastUploaded?.exif.location).toMatchObject({
      city: 'Test City',
      country: 'Test Country',
    });
  });
});
