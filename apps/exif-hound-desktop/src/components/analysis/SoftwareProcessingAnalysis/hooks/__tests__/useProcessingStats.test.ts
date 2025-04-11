import { renderHook } from '@testing-library/react';
import { useProcessingStats } from '../useProcessingStats';
import { ProcessedImageData } from '../useProcessingData';

describe('useProcessingStats hook', () => {
  // Helper function to create mock processed image data
  const createMockProcessedData = (
    id: string,
    software: string | null,
    hasBeenEdited: boolean = false,
    anomalies: string[] = []
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
      hasBeenEdited,
      editingSoftware: software ? [software] : [],
      anomalies
    }
  });

  it('should calculate correct statistics', () => {
    const processedData = [
      createMockProcessedData('1', 'Adobe Photoshop', true, []),
      createMockProcessedData('2', 'Adobe Lightroom', false, ['Missing original timestamp']),
      createMockProcessedData('3', null, true, ['Modified without software info']),
      createMockProcessedData('4', 'GIMP', true, [])
    ];

    const { result } = renderHook(() => useProcessingStats(processedData));
    
    expect(result.current.total).toBe(4);
    expect(result.current.edited).toBe(3); // Three items have hasBeenEdited = true
    expect(result.current.withSoftware).toBe(3); // Three items have software
    expect(result.current.withAnomalies).toBe(2); // Two items have anomalies
  });

  it('should calculate zero counts for empty array', () => {
    const { result } = renderHook(() => useProcessingStats([]));
    
    expect(result.current.total).toBe(0);
    expect(result.current.edited).toBe(0);
    expect(result.current.withSoftware).toBe(0);
    expect(result.current.withAnomalies).toBe(0);
  });

  it('should update when data changes', () => {
    // Initial data
    const initialData = [
      createMockProcessedData('1', 'Adobe Photoshop', true, [])
    ];
    
    const { result, rerender } = renderHook(
      (data) => useProcessingStats(data),
      { initialProps: initialData }
    );
    
    expect(result.current.total).toBe(1);
    expect(result.current.edited).toBe(1);
    
    // Update with new data
    const updatedData = [
      ...initialData,
      createMockProcessedData('2', 'Adobe Lightroom', false, []),
      createMockProcessedData('3', 'GIMP', true, ['Anomaly'])
    ];
    
    rerender(updatedData);
    
    expect(result.current.total).toBe(3);
    expect(result.current.edited).toBe(2);
    expect(result.current.withSoftware).toBe(3);
    expect(result.current.withAnomalies).toBe(1);
  });
}); 