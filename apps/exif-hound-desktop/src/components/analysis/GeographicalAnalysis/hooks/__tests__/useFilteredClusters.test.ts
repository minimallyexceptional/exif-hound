import { renderHook } from '@testing-library/react';
import { useFilteredClusters } from '../useFilteredClusters';
import { LocationCluster } from '../useLocationStats';

describe('useFilteredClusters hook', () => {
  // Helper function to create a mock cluster
  const createMockCluster = (
    id: number, 
    lat: number, 
    lng: number, 
    earliest: Date, 
    latest: Date
  ): LocationCluster => ({
    latitude: lat,
    longitude: lng,
    count: 1,
    images: [{
      id: `image-${id}`,
      url: `url-${id}`,
      file: {
        name: `image-${id}.jpg`,
        type: 'image/jpeg',
        size: 1024,
        lastModified: Date.now()
      },
      exif: {
        latitude: lat,
        longitude: lng,
        dateTimeOriginal: earliest.toISOString()
      }
    }],
    timeRange: { earliest, latest }
  });

  it('should return all clusters when no time range is selected', () => {
    const today = new Date();
    const clusters = [
      createMockCluster(1, 40.7128, -74.0060, today, today),
      createMockCluster(2, 37.7749, -122.4194, today, today)
    ];

    const { result } = renderHook(() => useFilteredClusters(clusters, [null, null]));
    
    expect(result.current).toEqual(clusters);
    expect(result.current.length).toBe(2);
  });

  it('should filter clusters based on time range', () => {
    const now = new Date();
    
    const dayOne = new Date(now);
    dayOne.setDate(now.getDate() - 5);
    
    const dayTwo = new Date(now);
    dayTwo.setDate(now.getDate() - 4);
    
    const dayThree = new Date(now);
    dayThree.setDate(now.getDate() - 3);
    
    const dayFour = new Date(now);
    dayFour.setDate(now.getDate() - 2);
    
    const clusters = [
      createMockCluster(1, 40.7128, -74.0060, dayOne, dayTwo), // Earlier cluster
      createMockCluster(2, 37.7749, -122.4194, dayThree, dayFour) // Later cluster
    ];

    // Set filter to only include the second cluster
    const timeRange: [Date | null, Date | null] = [dayThree, dayFour];
    const { result } = renderHook(() => useFilteredClusters(clusters, timeRange));
    
    expect(result.current.length).toBe(1);
    expect(result.current[0].latitude).toBe(37.7749); // Should be the SF cluster
  });

  it('should return empty array when no clusters match time range', () => {
    const now = new Date();
    
    const dayOne = new Date(now);
    dayOne.setDate(now.getDate() - 5);
    
    const dayTwo = new Date(now);
    dayTwo.setDate(now.getDate() - 4);
    
    const clusters = [
      createMockCluster(1, 40.7128, -74.0060, dayOne, dayTwo)
    ];

    // Set filter to a future time range
    const futureDate1 = new Date(now);
    futureDate1.setDate(now.getDate() + 1);
    
    const futureDate2 = new Date(now);
    futureDate2.setDate(now.getDate() + 2);
    
    const { result } = renderHook(() => useFilteredClusters(clusters, [futureDate1, futureDate2]));
    
    expect(result.current.length).toBe(0);
  });
}); 