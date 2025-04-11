import { renderHook } from '@testing-library/react';
import { useMapImages } from '../useMapImages';
import { ImageData } from '../../../../types';
import * as geolib from 'geolib';

// Mock geolib
jest.mock('geolib', () => ({
  isValidCoordinate: jest.fn(() => true)
}));

describe('useMapImages hook', () => {
  const mockIsValidCoordinate = geolib.isValidCoordinate as jest.MockedFunction<typeof geolib.isValidCoordinate>;
  
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
    
    // Default behavior for geolib
    mockIsValidCoordinate.mockReturnValue(true);
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
    mockIsValidCoordinate.mockImplementation(coords => {
      // Only validate specific coordinates
      interface LatLng { latitude: number; longitude: number }
      const coordsWithLatLng = coords as unknown as LatLng;
      if (coordsWithLatLng.latitude === 37.7749 && coordsWithLatLng.longitude === -122.4194) {
        return true;
      }
      return false;
    });
    
    const images = [
      createMockImage('1', 37.7749, -122.4194), // Valid
      createMockImage('2', 999, 999), // Invalid coordinates
      createMockImage('3', 40.7128, -74.0060) // Valid coords but mockIsValidCoordinate returns false
    ];
    
    const { result } = renderHook(() => useMapImages(images));
    
    expect(result.current.imagesWithLocation).toHaveLength(1);
    expect(result.current.imagesWithLocation[0].id).toBe('1');
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

  it('should handle errors when validating coordinates', () => {
    mockIsValidCoordinate.mockImplementation(() => {
      throw new Error('Validation error');
    });
    
    const images = [
      createMockImage('1', 37.7749, -122.4194)
    ];
    
    const { result } = renderHook(() => useMapImages(images));
    
    expect(console.error).toHaveBeenCalledWith(
      'Error validating coordinates:',
      expect.any(Error)
    );
    expect(result.current.imagesWithLocation).toHaveLength(0);
  });

  it('should handle errors when sorting images', () => {
    // Create a date that will cause an error when sorting
    const badDate = 'not-a-date';
    
    const images = [
      createMockImage('1', 37.7749, -122.4194, '2023-01-15T12:00:00Z'),
      createMockImage('2', 40.7128, -74.0060, badDate)
    ];
    
    // We need to mock getTime() to throw an error
    const originalDate = global.Date;
    const mockDateGetTime = jest.fn().mockImplementation(function(this: Date) {
      if (String(this) === 'Invalid Date') {
        throw new Error('Invalid Date');
      }
      return originalDate.prototype.getTime.call(this);
    });
    
    // Replace Date.prototype.getTime with our mock
    const originalGetTime = Date.prototype.getTime;
    Date.prototype.getTime = mockDateGetTime;
    
    try {
      const { result } = renderHook(() => useMapImages(images));
      
      expect(console.error).toHaveBeenCalledWith(
        'Error sorting images:',
        expect.any(Error)
      );
      
      // Should still have both images, but order might be unpredictable
      expect(result.current.sortedImages.length).toBeGreaterThan(0);
    } finally {
      // Restore original getTime function
      Date.prototype.getTime = originalGetTime;
    }
  });

  it('should handle empty image array', () => {
    const { result } = renderHook(() => useMapImages([]));
    
    expect(result.current.imagesWithLocation).toHaveLength(0);
    expect(result.current.sortedImages).toHaveLength(0);
  });
}); 