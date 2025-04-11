import { renderHook } from '@testing-library/react';
import { useMapCenter } from '../useMapCenter';
import { ImageData } from '../../../../types';
import { fixCoordinates } from '../../../../utils/diagnostics';
import { act } from '@testing-library/react';

// Mock the diagnostics utility
jest.mock('../../../../utils/diagnostics', () => ({
  fixCoordinates: jest.fn((lat, lng) => [lat, lng])
}));

describe('useMapCenter hook', () => {
  const mockFixCoordinates = fixCoordinates as jest.MockedFunction<typeof fixCoordinates>;
  
  // Create mock data for testing
  const createMockImageWithCoords = (latitude: number, longitude: number): ImageData => ({
    id: 'test-id',
    url: 'test-url',
    file: {
      name: 'test-image.jpg',
      type: 'image/jpeg',
      size: 1024,
      lastModified: Date.now()
    },
    exif: {
      latitude,
      longitude,
      dateTimeOriginal: new Date().toISOString()
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

  it('should use selectedImage coordinates when available', () => {
    const selectedImage = createMockImageWithCoords(37.7749, -122.4194);
    const imagesWithLocation = [
      createMockImageWithCoords(40.7128, -74.0060),
      createMockImageWithCoords(34.0522, -118.2437)
    ];
    
    mockFixCoordinates.mockReturnValue([37.7749, -122.4194]);
    
    const { result } = renderHook(() => useMapCenter(selectedImage, imagesWithLocation));
    
    expect(mockFixCoordinates).toHaveBeenCalledWith(37.7749, -122.4194);
    expect(result.current.center).toEqual([37.7749, -122.4194]);
    expect(result.current.isFullscreen).toBe(false);
  });

  it('should fall back to first image in array when selectedImage has no coordinates', () => {
    const selectedImage = createMockImageWithCoords(0, 0);
    selectedImage.exif.latitude = undefined;
    selectedImage.exif.longitude = undefined;
    
    const imagesWithLocation = [
      createMockImageWithCoords(40.7128, -74.0060),
      createMockImageWithCoords(34.0522, -118.2437)
    ];
    
    mockFixCoordinates.mockReturnValue([40.7128, -74.0060]);
    
    const { result } = renderHook(() => useMapCenter(selectedImage, imagesWithLocation));
    
    expect(mockFixCoordinates).toHaveBeenCalledWith(40.7128, -74.0060);
    expect(result.current.center).toEqual([40.7128, -74.0060]);
  });

  it('should fall back to first image in array when selectedImage is null', () => {
    const imagesWithLocation = [
      createMockImageWithCoords(40.7128, -74.0060),
      createMockImageWithCoords(34.0522, -118.2437)
    ];
    
    mockFixCoordinates.mockReturnValue([40.7128, -74.0060]);
    
    const { result } = renderHook(() => useMapCenter(null, imagesWithLocation));
    
    expect(mockFixCoordinates).toHaveBeenCalledWith(40.7128, -74.0060);
    expect(result.current.center).toEqual([40.7128, -74.0060]);
  });

  it('should return default coordinates when no valid images are available', () => {
    const { result } = renderHook(() => useMapCenter(null, []));
    
    expect(mockFixCoordinates).not.toHaveBeenCalled();
    expect(result.current.center).toEqual([0, 0]);
  });

  it('should handle errors when calculating center', () => {
    const selectedImage = createMockImageWithCoords(37.7749, -122.4194);
    
    mockFixCoordinates.mockImplementation(() => {
      throw new Error('Coordinate calculation error');
    });
    
    const { result } = renderHook(() => useMapCenter(selectedImage, []));
    
    expect(console.error).toHaveBeenCalledWith(
      'Error calculating map center:',
      expect.any(Error)
    );
    expect(result.current.center).toEqual([0, 0]);
  });

  it('should toggle fullscreen state', () => {
    const { result } = renderHook(() => useMapCenter(null, []));
    
    // Initial state
    expect(result.current.isFullscreen).toBe(false);
    
    // Update state using act
    act(() => {
      result.current.setIsFullscreen(true);
    });
    
    // Check updated state
    expect(result.current.isFullscreen).toBe(true);
  });
}); 