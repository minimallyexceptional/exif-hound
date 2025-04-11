import { useMemo } from 'react';
import { ProcessedImageData } from './useProcessingData';

export const useSoftwareList = (processingData: ProcessedImageData[]): string[] => {
  return useMemo(() => {
    const software = new Set<string>();
    processingData.forEach(data => {
      if (data.info.software) {
        software.add(data.info.software);
      }
    });
    return Array.from(software);
  }, [processingData]);
}; 