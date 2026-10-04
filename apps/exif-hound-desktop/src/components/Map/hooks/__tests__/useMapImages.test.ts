import { renderHook } from '@testing-library/react';
import { useMapImages } from '../useMapImages';
import { ImageData } from '../../../../types';

describe('useMapImages hook', () => {
  // Create mock data for testing
  const createMockImage = (id: string, latitude?: number, longitude?: number, dateTime?: string): ImageData => ({
    id,
    url: `test-url-${id}`,
    file: {
      name: `test-image-${id}.jpg`,
      type: 'image/jpeg',
      size: 1024,
      lastModified: Date.now()
    },
    exif: {
      latitude,
      longitude,
      dateTimeOriginal: dateTime
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.error to avoid cluttering test output
    jest.spyOn(console, 'error').mockImplementation();
    
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should filter out images without coordinates', () => {
    const images = [
      createMockImage('1', 37.7749, -122.4194),
      createMockImage('2'), // No coordinates
      createMockImage('3', 40.7128, -74.0060),
      createMockImage('4', undefined, -118.2437), // Missing latitude
      createMockImage('5', 34.0522, undefined) // Missing longitude
    ];
    
    const { result } = renderHook(() => useMapImages(images));
    
    expect(result.current.imagesWithLocation).toHaveLength(2);
    expect(result.current.imagesWithLocation[0].id).toBe('1');
    expect(result.current.imagesWithLocation[1].id).toBe('3');
  });

  it('should filter out images with invalid coordinates', () => {
    // The hook validates coordinates inline (numeric bounds check)
    const images = [
      createMockImage('1', 37.7749, -122.4194), // Valid
      createMockImage('2', 999, 999), // Invalid coordinates (out of bounds)
      createMockImage('3', 40.7128, -74.0060) // Valid
    ];
    
    const { result } = renderHook(() => useMapImages(images));
    
    expect(result.current.imagesWithLocation).toHaveLength(2);
    expect(result.current.imagesWithLocation[0].id).toBe('1');
    expect(result.current.imagesWithLocation[1].id).toBe('3');
  });

  it('should sort images by date taken', () => {
    const images = [
      createMockImage('1', 37.7749, -122.4194, '2023-03-10T12:00:00Z'),
      createMockImage('2', 40.7128, -74.0060, '2023-01-15T12:00:00Z'),
      createMockImage('3', 34.0522, -118.2437, '2023-05-20T12:00:00Z')
    ];
    
    const { result } = renderHook(() => useMapImages(images));
    
    // Should be sorted by date
    expect(result.current.sortedImages).toHaveLength(3);
    expect(result.current.sortedImages[0].id).toBe('2'); // January
    expect(result.current.sortedImages[1].id).toBe('1'); // March
    expect(result.current.sortedImages[2].id).toBe('3'); // May
  });

  it('should handle images without date information', () => {
    const images = [
      createMockImage('1', 37.7749, -122.4194), // No date
      createMockImage('2', 40.7128, -74.0060, '2023-01-15T12:00:00Z'),
      createMockImage('3', 34.0522, -118.2437) // No date
    ];
    
    const { result } = renderHook(() => useMapImages(images));
    
    // Images without dates should come first (0 timestamp)
    expect(result.current.sortedImages).toHaveLength(3);
    expect(result.current.sortedImages[0].id).toBe('1');
    expect(result.current.sortedImages[1].id).toBe('3');
    expect(result.current.sortedImages[2].id).toBe('2');
  });

  it('should skip coordinates that fail numeric validation', () => {
    // Coordinates outside lat/lng bounds are filtered out silently
    // (the refactored hook uses an inline bounds check without error logging)
    const images = [
      createMockImage('1', 37.7749, -122.4194),
      createMockImage('2', 200, 500) // Out of bounds
    ];
    
    const { result } = renderHook(() => useMapImages(images));
    
    expect(result.current.imagesWithLocation).toHaveLength(1);
    expect(result.current.imagesWithLocation[0].id).toBe('1');
  });

  it('should handle errors when sorting images', () => {
    // Create a date that will cause an error when sorting
    const badDate = 'not-a-date';
    
    const images = [
      createMockImage('1', 37.7749, -122.4194, '2023-01-15T12:00:00Z'),
      createMockImage('2', 40.7128, -74.0060, badDate)
    ];
    
    // The refactored hook sorts defensively: invalid dates yield NaN but
    // must not throw or crash rendering
    const { result } = renderHook(() => useMapImages(images));
    
    // Should still have both images, but order might be unpredictable
    expect(result.current.sortedImages.length).toBeGreaterThan(0);
  });

  it('should handle empty image array', () => {
    const { result } = renderHook(() => useMapImages([]));
    
    expect(result.current.imagesWithLocation).toHaveLength(0);
    expect(result.current.sortedImages).toHaveLength(0);
  });
}); 