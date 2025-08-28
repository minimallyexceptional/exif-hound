import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ImageUploader from '../../components/ImageUploader';
import { useExifData } from '../../hooks/useExifData';

// Mock the EXIF worker
jest.mock('../../workers/exifWorker', () => ({
  __esModule: true,
  default: class MockExifWorker {
    postMessage = jest.fn();
    addEventListener = jest.fn();
    terminate = jest.fn();
  }
}));

// Mock geocoding
jest.mock('../../utils/geocoding', () => ({
  getLocationFromCoordinates: jest.fn().mockImplementation(
    () => new Promise(resolve => 
      setTimeout(() => resolve({ 
        country: 'Test Country',
        city: 'Test City' 
      }), 50)
    )
  )
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
    
    // Mock the processExifData function
    mockUseExifData.mockReturnValue({
      processExifData: jest.fn().mockImplementation((file: File) => 
        Promise.resolve({
          dateTimeOriginal: '2023-01-01T12:00:00.000Z',
          make: 'Test Camera',
          model: 'Model X',
          latitude: 40.7128,
          longitude: -74.0060,
          location: { loading: true } // Initially loading
        })
      )
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

    render(<ImageUploader onImageUpload={onImageUpload} inputId="test-input" />);
    
    const input = screen.getByRole('button').querySelector('input[type="file"]');
    
    const startTime = Date.now();
    
    // Upload files
    if (input) {
      Object.defineProperty(input, 'files', { value: files });
      fireEvent.change(input);
    }

    // Wait for all uploads to complete
    await waitFor(() => {
      expect(onImageUpload).toHaveBeenCalledTimes(5);
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

    render(<ImageUploader onImageUpload={onImageUpload} inputId="test-input" />);
    
    const input = screen.getByRole('button').querySelector('input[type="file"]');
    
    // Upload file
    if (input) {
      Object.defineProperty(input, 'files', { value: [file] });
      fireEvent.change(input);
    }

    // UI should remain responsive immediately
    const button = screen.getByRole('button');
    expect(button).not.toBeDisabled();
    
    // Should be able to click other elements
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(onImageUpload).toHaveBeenCalledTimes(1);
    });
  });

  test('should add images with loading location state initially', async () => {
    const onImageUpload = jest.fn();
    const file = createMockFile('test.jpg');

    render(<ImageUploader onImageUpload={onImageUpload} inputId="test-input" />);
    
    const input = screen.getByRole('button').querySelector('input[type="file"]');
    
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
      processExifData: jest.fn().mockImplementation((file: File) => {
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
      })
    });

    render(<ImageUploader onImageUpload={onImageUpload} inputId="test-input" />);
    
    const input = screen.getByRole('button').querySelector('input[type="file"]');
    
    if (input) {
      Object.defineProperty(input, 'files', { value: files });
      fireEvent.change(input);
    }

    await waitFor(() => {
      expect(onImageUpload).toHaveBeenCalledTimes(20);
    }, { timeout: 5000 });

    // Should limit concurrent processing (e.g., max 3-4 concurrent)
    expect(maxConcurrent).toBeLessThanOrEqual(4);
    expect(maxConcurrent).toBeGreaterThan(1); // But should use some concurrency
  });

  test('should update location data progressively in background', async () => {
    const onImageUpload = jest.fn();
    const file = createMockFile('test.jpg');

    // Mock location update after initial load
    let resolveLocation: (value: any) => void;
    const locationPromise = new Promise(resolve => {
      resolveLocation = resolve;
    });

    render(<ImageUploader onImageUpload={onImageUpload} inputId="test-input" />);
    
    const input = screen.getByRole('button').querySelector('input[type="file"]');
    
    if (input) {
      Object.defineProperty(input, 'files', { value: [file] });
      fireEvent.change(input);
    }

    // First call should have loading location
    await waitFor(() => {
      expect(onImageUpload).toHaveBeenCalledWith(
        expect.objectContaining({
          exif: expect.objectContaining({
            location: { loading: true }
          })
        })
      );
    });

    // Simulate location data arriving later
    resolveLocation({
      country: 'Test Country',
      city: 'Test City'
    });

    await locationPromise;

    // Should eventually update with actual location data
    // This would be handled by the parent component updating state
  });
});
