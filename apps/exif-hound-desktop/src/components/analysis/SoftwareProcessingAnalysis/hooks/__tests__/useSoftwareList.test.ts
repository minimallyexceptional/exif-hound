import { renderHook } from '@testing-library/react';
import { useSoftwareList } from '../useSoftwareList';
import { ProcessedImageData } from '../useProcessingData';

describe('useSoftwareList hook', () => {
  // Helper function to create mock processed image data
  const createMockProcessedData = (
    id: string,
    software: string | null
  ): ProcessedImageData => ({
    image: {
      id,
      url: `test-url-${id}`,
      file: {
        name: `test-image-${id}.jpg`,
        type: 'image/jpeg',
        size: 1024,
        lastModified: Date.now()
      },
      exif: {
        software: software || undefined
      }
    },
    info: {
      software,
      originalDate: null,
      lastModified: new Date().toISOString(),
      hasBeenEdited: false,
      editingSoftware: software ? [software] : [],
      anomalies: []
    }
  });

  it('should extract unique software names', () => {
    const processingData = [
      createMockProcessedData('1', 'Adobe Photoshop'),
      createMockProcessedData('2', 'Adobe Lightroom'),
      createMockProcessedData('3', 'Adobe Photoshop'), // Duplicate software
      createMockProcessedData('4', 'GIMP')
    ];

    const { result } = renderHook(() => useSoftwareList(processingData));
    
    expect(result.current.length).toBe(3); // Should de-duplicate
    expect(result.current).toContain('Adobe Photoshop');
    expect(result.current).toContain('Adobe Lightroom');
    expect(result.current).toContain('GIMP');
  });

  it('should ignore null software values', () => {
    const processingData = [
      createMockProcessedData('1', 'Adobe Photoshop'),
      createMockProcessedData('2', null),
      createMockProcessedData('3', 'GIMP'),
      createMockProcessedData('4', null)
    ];

    const { result } = renderHook(() => useSoftwareList(processingData));
    
    expect(result.current.length).toBe(2);
    expect(result.current).toContain('Adobe Photoshop');
    expect(result.current).toContain('GIMP');
  });

  it('should return empty array when no software is found', () => {
    const processingData = [
      createMockProcessedData('1', null),
      createMockProcessedData('2', null)
    ];

    const { result } = renderHook(() => useSoftwareList(processingData));
    
    expect(result.current).toEqual([]);
  });

  it('should handle empty processing data array', () => {
    const { result } = renderHook(() => useSoftwareList([]));
    
    expect(result.current).toEqual([]);
  });
}); 