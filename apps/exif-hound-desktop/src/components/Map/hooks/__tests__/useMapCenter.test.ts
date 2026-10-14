import { renderHook } from '@testing-library/react';
import { useMapCenter } from '../useMapCenter';
import { ImageData } from '../../../../types';
import { act } from '@testing-library/react';

describe('useMapCenter hook', () => {
  const createMockImageWithCoords = (latitude: number, longitude: number): ImageData => ({
    id: 'test-id',
    url: 'test-url',
    file: {
      name: 'test-image.jpg',
      type: 'image/jpeg',
      size: 1024,
      lastModified: Date.now(),
    },
    exif: {
      latitude,
      longitude,
      dateTimeOriginal: new Date().toISOString(),
    },
  });

  it('should use selectedImage coordinates when available', () => {
    const selectedImage = createMockImageWithCoords(37.7749, -122.4194);
    const imagesWithLocation = [
      createMockImageWithCoords(40.7128, -74.0060),
      createMockImageWithCoords(34.0522, -118.2437),
    ];

    const { result } = renderHook(() => useMapCenter(selectedImage, imagesWithLocation));

    expect(result.current.center).toEqual([37.7749, -122.4194]);
    expect(result.current.isFullscreen).toBe(false);
  });

  it('should fall back to first image in array when selectedImage has no coordinates', () => {
    const selectedImage = createMockImageWithCoords(0, 0);
    selectedImage.exif.latitude = undefined;
    selectedImage.exif.longitude = undefined;

    const imagesWithLocation = [
      createMockImageWithCoords(40.7128, -74.0060),
      createMockImageWithCoords(34.0522, -118.2437),
    ];

    const { result } = renderHook(() => useMapCenter(selectedImage, imagesWithLocation));

    expect(result.current.center).toEqual([40.7128, -74.0060]);
  });

  it('should fall back to first image in array when selectedImage is null', () => {
    const imagesWithLocation = [
      createMockImageWithCoords(40.7128, -74.0060),
      createMockImageWithCoords(34.0522, -118.2437),
    ];

    const { result } = renderHook(() => useMapCenter(null, imagesWithLocation));

    expect(result.current.center).toEqual([40.7128, -74.0060]);
  });

  it('should return default coordinates when no valid images are available', () => {
    const { result } = renderHook(() => useMapCenter(null, []));

    expect(result.current.center).toEqual([0, 0]);
  });

  it('should toggle fullscreen state', () => {
    const { result } = renderHook(() => useMapCenter(null, []));

    expect(result.current.isFullscreen).toBe(false);

    act(() => {
      result.current.setIsFullscreen(true);
    });

    expect(result.current.isFullscreen).toBe(true);
  });
});
