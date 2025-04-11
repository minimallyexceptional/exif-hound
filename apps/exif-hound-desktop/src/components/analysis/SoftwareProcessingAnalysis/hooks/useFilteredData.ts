import { useMemo } from 'react';
import { ProcessedImageData } from './useProcessingData';

export const useFilteredData = (
  processingData: ProcessedImageData[],
  selectedSoftware: Set<string>
): ProcessedImageData[] => {
  return useMemo(() => {
    if (selectedSoftware.size === 0) return processingData;
    
    return processingData.filter(data => 
      data.info.software && selectedSoftware.has(data.info.software)
    );
  }, [processingData, selectedSoftware]);
}; 