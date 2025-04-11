import { useMemo } from 'react';
import { LocationCluster } from './useLocationStats';

export type TimeRange = [Date | null, Date | null];

export const useFilteredClusters = (
  clusters: LocationCluster[],
  selectedTimeRange: TimeRange
): LocationCluster[] => {
  return useMemo(() => {
    if (!selectedTimeRange[0] || !selectedTimeRange[1]) {
      return clusters;
    }

    return clusters.filter(cluster => {
      const clusterStart = cluster.timeRange.earliest;
      const clusterEnd = cluster.timeRange.latest;
      return clusterStart >= selectedTimeRange[0]! && clusterEnd <= selectedTimeRange[1]!;
    });
  }, [clusters, selectedTimeRange]);
}; 