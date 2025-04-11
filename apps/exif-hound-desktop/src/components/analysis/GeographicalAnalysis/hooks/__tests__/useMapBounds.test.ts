import { renderHook } from '@testing-library/react';
import { useMapBounds } from '../useMapBounds';
import { LocationCluster } from '../useLocationStats';

describe('useMapBounds hook', () => {
  // Helper function to create a mock cluster
  const createMockCluster = (lat: number, lng: number): LocationCluster => ({
    latitude: lat,
    longitude: lng,
    count: 1,
    images: [{
      id: `image-${lat}-${lng}`,
      url: `url-${lat}-${lng}`,
      file: {
        name: `image-${lat}-${lng}.jpg`,
        type: 'image/jpeg',
        size: 1024,
        lastModified: Date.now()
      },
      exif: {
        latitude: lat,
        longitude: lng,
        dateTimeOriginal: new Date().toISOString()
      }
    }],
    timeRange: {
      earliest: new Date(),
      latest: new Date()
    }
  });

  it('should return null for empty clusters array', () => {
    const { result } = renderHook(() => useMapBounds([]));
    
    expect(result.current).toBeNull();
  });

  it('should calculate correct bounds for single location', () => {
    const clusters = [
      createMockCluster(40.7128, -74.0060) // NYC
    ];

    const { result } = renderHook(() => useMapBounds(clusters));
    
    expect(result.current).not.toBeNull();
    
    // Bounds should be center ± padding
    if (result.current) {
      const [[southLat, westLng], [northLat, eastLng]] = result.current;
      
      // Check with a 0.1 padding 
      expect(southLat).toBeCloseTo(40.7128 - 0.1, 4);
      expect(westLng).toBeCloseTo(-74.0060 - 0.1, 4);
      expect(northLat).toBeCloseTo(40.7128 + 0.1, 4);
      expect(eastLng).toBeCloseTo(-74.0060 + 0.1, 4);
    }
  });

  it('should calculate correct bounds for multiple locations', () => {
    const clusters = [
      createMockCluster(40.7128, -74.0060), // NYC
      createMockCluster(37.7749, -122.4194), // SF
      createMockCluster(34.0522, -118.2437) // LA
    ];

    const { result } = renderHook(() => useMapBounds(clusters));
    
    expect(result.current).not.toBeNull();
    
    if (result.current) {
      const [[southLat, westLng], [northLat, eastLng]] = result.current;
      
      // The southernmost point is LA (34.0522)
      expect(southLat).toBeCloseTo(34.0522 - 0.1, 4);
      
      // The westernmost point is SF (-122.4194)
      expect(westLng).toBeCloseTo(-122.4194 - 0.1, 4);
      
      // The northernmost point is NYC (40.7128)
      expect(northLat).toBeCloseTo(40.7128 + 0.1, 4);
      
      // The easternmost point is NYC (-74.0060)
      expect(eastLng).toBeCloseTo(-74.0060 + 0.1, 4);
    }
  });
}); 