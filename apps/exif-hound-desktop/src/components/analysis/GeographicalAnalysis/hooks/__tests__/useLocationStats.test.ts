import { renderHook } from '@testing-library/react';
import { useLocationStats } from '../useLocationStats';
import { ImageData } from '../../../../../types';

describe('useLocationStats hook', () => {
  // Helper function to create image data with coordinates
  const createImageWithLocation = (
    id: string, 
    lat: number | undefined = undefined, 
    lng: number | undefined = undefined,
    date: string | undefined = undefined
  ): ImageData => ({
    id,
    url: `image-${id}`,
    file: {
      name: `image-${id}.jpg`,
      type: 'image/jpeg',
      size: 1024,
      lastModified: Date.now()
    },
    exif: {
      latitude: lat,
      longitude: lng,
      dateTimeOriginal: date
    }
  });

  it('should calculate correct number of images with location', () => {
    const images = [
      createImageWithLocation('1', 40.7128, -74.0060),
      createImageWithLocation('2'), // No coordinates
      createImageWithLocation('3', 40.7580, -73.9855)
    ];

    const { result } = renderHook(() => useLocationStats(images));
    
    expect(result.current.totalWithLocation).toBe(2);
  });

  it('should create location clusters based on proximity', () => {
    const closeImages = [
      createImageWithLocation('1', 40.7128, -74.0060), // NYC
      createImageWithLocation('2', 40.7129, -74.0061), // Very close to first
      createImageWithLocation('3', 37.7749, -122.4194) // SF - far away
    ];

    const { result } = renderHook(() => useLocationStats(closeImages));
    
    expect(result.current.clusters.length).toBe(3);
    
    // First cluster contains 2 images
    const nycCluster = result.current.clusters.find(c => c.latitude === 40.7128);
    expect(nycCluster?.count).toBe(2);
    
    // Second cluster contains 1 image
    const sfCluster = result.current.clusters.find(c => c.latitude === 37.7749);
    expect(sfCluster?.count).toBe(1);
  });

  it('should calculate time range for clusters', () => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(now.getDate() - 2);
    
    const images = [
      createImageWithLocation('1', 40.7128, -74.0060, now.toISOString()),
      createImageWithLocation('2', 40.7129, -74.0061, yesterday.toISOString()),
      createImageWithLocation('3', 40.7130, -74.0062, twoDaysAgo.toISOString()),
    ];

    const { result } = renderHook(() => useLocationStats(images));
    
    expect(result.current.timeSpan.start).toEqual(twoDaysAgo);
    expect(result.current.timeSpan.end).toEqual(now);
    
    const cluster = result.current.clusters[0];
    expect(cluster.timeRange.earliest).toEqual(twoDaysAgo);
    expect(cluster.timeRange.latest).toEqual(now);
  });

  it('should handle empty image list', () => {
    const { result } = renderHook(() => useLocationStats([]));
    
    expect(result.current.totalWithLocation).toBe(0);
    expect(result.current.uniqueLocations).toBe(0);
    expect(result.current.clusters).toEqual([]);
    expect(result.current.timeSpan.start).toBeNull();
    expect(result.current.timeSpan.end).toBeNull();
  });

  it('should handle images with no date information', () => {
    const images = [
      createImageWithLocation('1', 40.7128, -74.0060), // No date
      createImageWithLocation('2', 40.7129, -74.0061), // No date
    ];

    const { result } = renderHook(() => useLocationStats(images));
    
    // Clusters still form correctly
    expect(result.current.clusters.length).toBe(2);
    expect(result.current.timeSpan.start).toBeNull();
    expect(result.current.timeSpan.end).toBeNull();
  });
}); 