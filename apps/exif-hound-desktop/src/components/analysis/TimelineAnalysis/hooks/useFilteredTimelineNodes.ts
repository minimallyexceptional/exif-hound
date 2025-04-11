import { useMemo } from 'react';
import { TimelineNode } from './useTimelineNodes';
import { isWithinInterval, startOfDay, endOfDay } from 'date-fns';

export const useFilteredTimelineNodes = (
  nodes: TimelineNode[],
  selectedTimeRange: [Date | null, Date | null] | null
) => {
  return useMemo(() => {
    if (!selectedTimeRange || !selectedTimeRange[0] || !selectedTimeRange[1]) {
      return nodes;
    }

    const [start, end] = selectedTimeRange;
    const startOfRange = startOfDay(start);
    const endOfRange = endOfDay(end);

    return nodes.filter((node) => {
      return isWithinInterval(node.date, {
        start: startOfRange,
        end: endOfRange,
      });
    });
  }, [nodes, selectedTimeRange]);
}; 