import { useMemo } from 'react';
import { ProcessedImageData } from './useProcessingData';

export interface ProcessingStats {
  total: number;
  edited: number;
  withAnomalies: number;
  withSoftware: number;
}

export const useProcessingStats = (filteredData: ProcessedImageData[]): ProcessingStats => {
  return useMemo(() => {
    const total = filteredData.length;
    const edited = filteredData.filter(d => d.info.hasBeenEdited).length;
    const withAnomalies = filteredData.filter(d => d.info.anomalies.length > 0).length;
    const withSoftware = filteredData.filter(d => d.info.software).length;

    return { total, edited, withAnomalies, withSoftware };
  }, [filteredData]);
}; 