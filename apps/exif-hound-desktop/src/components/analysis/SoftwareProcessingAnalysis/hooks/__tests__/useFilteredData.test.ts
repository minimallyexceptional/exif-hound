import { renderHook } from '@testing-library/react';
import { useFilteredData } from '../useFilteredData';
import { ProcessedImageData } from '../useProcessingData';

describe('useFilteredData hook', () => {
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

  it('should return all data when no software is selected', () => {
    const processingData = [
      createMockProcessedData('1', 'Adobe Photoshop'),
      createMockProcessedData('2', 'Adobe Lightroom'),
      createMockProcessedData('3', 'GIMP')
    ];

    const { result } = renderHook(() => useFilteredData(processingData, new Set()));
    
    expect(result.current.length).toBe(3);
    expect(result.current).toEqual(processingData);
  });

  it('should filter data based on selected software', () => {
    const processingData = [
      createMockProcessedData('1', 'Adobe Photoshop'),
      createMockProcessedData('2', 'Adobe Lightroom'),
      createMockProcessedData('3', 'GIMP')
    ];

    const selectedSoftware = new Set(['Adobe Photoshop', 'GIMP']);
    const { result } = renderHook(() => useFilteredData(processingData, selectedSoftware));
    
    expect(result.current.length).toBe(2);
    expect(result.current[0].info.software).toBe('Adobe Photoshop');
    expect(result.current[1].info.software).toBe('GIMP');
  });

  it('should filter out items with null software', () => {
    const processingData = [
      createMockProcessedData('1', 'Adobe Photoshop'),
      createMockProcessedData('2', null),
      createMockProcessedData('3', 'GIMP')
    ];

    const selectedSoftware = new Set(['Adobe Photoshop', 'GIMP']);
    const { result } = renderHook(() => useFilteredData(processingData, selectedSoftware));
    
    expect(result.current.length).toBe(2);
    expect(result.current.some(item => item.info.software === null)).toBe(false);
  });

  it('should return empty array when no items match selected software', () => {
    const processingData = [
      createMockProcessedData('1', 'Adobe Photoshop'),
      createMockProcessedData('2', 'Adobe Lightroom')
    ];

    const selectedSoftware = new Set(['GIMP', 'Capture One']);
    const { result } = renderHook(() => useFilteredData(processingData, selectedSoftware));
    
    expect(result.current).toEqual([]);
  });

  it('should handle empty processing data array', () => {
    const { result } = renderHook(() => useFilteredData([], new Set(['Adobe Photoshop'])));
    
    expect(result.current).toEqual([]);
  });
}); 