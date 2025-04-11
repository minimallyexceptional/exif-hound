import { useMemo } from 'react';
import { LocationCluster } from './useLocationStats';

export type MapBounds = [[number, number], [number, number]] | null;

export const useMapBounds = (clusters: LocationCluster[]): MapBounds => {
  return useMemo(() => {
    if (clusters.length === 0) return null;

    const lats = clusters.map(c => c.latitude);
    const lngs = clusters.map(c => c.longitude);
    return [
      [Math.min(...lats) - 0.1, Math.min(...lngs) - 0.1],
      [Math.max(...lats) + 0.1, Math.max(...lngs) + 0.1]
    ] as [[number, number], [number, number]];
  }, [clusters]);
}; 