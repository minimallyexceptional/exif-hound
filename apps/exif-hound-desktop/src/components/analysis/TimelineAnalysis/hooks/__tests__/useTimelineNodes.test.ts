import { renderHook } from '@testing-library/react';
import { useTimelineNodes } from '../useTimelineNodes';
import type { ImageData } from '../../../../../types';

describe('useTimelineNodes', () => {
  // Helper function to create a mock image with a date
  const createImageWithDate = (date: string | undefined = '2023-01-01T12:00:00Z'): ImageData => ({
    id: Math.random().toString(),
    url: 'test-url',
    file: { name: 'test.jpg', type: 'image/jpeg', size: 1000, lastModified: 1000 },
    exif: {
      dateTimeOriginal: date
    }
  });

  test('should calculate correct nodes from images with dates', () => {
    const images = [
      createImageWithDate('2023-01-01T12:00:00Z'),
      createImageWithDate('2023-01-02T12:00:00Z'),
    ];

    const { result } = renderHook(() => useTimelineNodes(images));

    expect(result.current.nodes.length).toBe(2);
    expect(result.current.totalImagesWithDate).toBe(2);
    expect(result.current.startDate).toEqual(expect.any(Date));
    expect(result.current.endDate).toEqual(expect.any(Date));
  });

  test('should handle images with same date', () => {
    const images = [
      createImageWithDate('2023-01-01T12:00:00Z'),
      createImageWithDate('2023-01-01T14:00:00Z'),
    ];

    const { result } = renderHook(() => useTimelineNodes(images));

    expect(result.current.nodes.length).toBe(1);
    expect(result.current.nodes[0].count).toBe(2);
    expect(result.current.totalImagesWithDate).toBe(2);
  });

  test('should return empty nodes for empty image list', () => {
    const images: ImageData[] = [];

    const { result } = renderHook(() => useTimelineNodes(images));

    expect(result.current.nodes.length).toBe(0);
    expect(result.current.totalImagesWithDate).toBe(0);
    expect(result.current.startDate).toBeNull();
    expect(result.current.endDate).toBeNull();
  });

  test('should handle images without dates', () => {
    const images = [
      {
        id: "1",
        url: 'test-url',
        file: { name: 'test1.jpg', type: 'image/jpeg', size: 1000, lastModified: 1000 },
        exif: {} // empty exif object, no dateTimeOriginal
      },
      {
        id: "2",
        url: 'test-url',
        file: { name: 'test2.jpg', type: 'image/jpeg', size: 1000, lastModified: 1000 },
        exif: {
          dateTimeOriginal: null // null date
        }
      },
      {
        id: "3",
        url: 'test-url',
        file: { name: 'test-with-date.jpg', type: 'image/jpeg', size: 1000, lastModified: 1000 },
        exif: {
          dateTimeOriginal: '2023-01-01T12:00:00Z' // the only one with a valid date
        }
      }
    ] as ImageData[];

    const { result } = renderHook(() => useTimelineNodes(images));

    // There should be one node (one day with images)
    expect(result.current.nodes.length).toBe(1);
    // Only one image has a date
    expect(result.current.totalImagesWithDate).toBe(1);
  });
}); 