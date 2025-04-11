import { renderHook } from '@testing-library/react';
import { useFilteredTimelineNodes } from '../useFilteredTimelineNodes';
import { TimelineNode } from '../useTimelineNodes';
import type { ImageData } from '../../../../../types';

describe('useFilteredTimelineNodes', () => {
  // Helper to create mock timeline nodes
  const createMockNode = (dateStr: string, count = 1): TimelineNode => {
    const date = new Date(dateStr);
    return {
      date,
      count,
      images: Array(count).fill(null).map(() => ({ 
        id: Math.random().toString(),
        url: `/path/to/image-${Math.random()}.jpg`,
        file: { 
          name: `test-${Math.random()}.jpg`, 
          type: 'image/jpeg', 
          size: 1000, 
          lastModified: date.getTime() 
        },
        exif: {
          dateTimeOriginal: date.toISOString()
        }
      } as ImageData))
    };
  };

  test('returns all nodes when no date range is selected', () => {
    const nodes = [
      createMockNode('2023-01-01'),
      createMockNode('2023-01-15'),
      createMockNode('2023-01-30')
    ];

    const { result } = renderHook(() => 
      useFilteredTimelineNodes(nodes, null)
    );
    
    expect(result.current).toEqual(nodes);
    expect(result.current.length).toBe(3);
  });

  test('filters nodes based on selected date range', () => {
    const nodes = [
      createMockNode('2023-01-01'),
      createMockNode('2023-01-15'),
      createMockNode('2023-01-30')
    ];

    const startDate = new Date('2023-01-10');
    const endDate = new Date('2023-01-20');
    const dateRange: [Date | null, Date | null] = [startDate, endDate];

    const { result } = renderHook(() => 
      useFilteredTimelineNodes(nodes, dateRange)
    );
    
    expect(result.current.length).toBe(1);
    expect(result.current[0].date.toISOString().split('T')[0]).toBe('2023-01-15');
  });

  test('includes nodes at the boundaries of the range', () => {
    const nodes = [
      createMockNode('2023-01-01'),
      createMockNode('2023-01-15'),
      createMockNode('2023-01-30')
    ];

    const startDate = new Date('2023-01-01');
    const endDate = new Date('2023-01-30');
    const dateRange: [Date | null, Date | null] = [startDate, endDate];

    const { result } = renderHook(() => 
      useFilteredTimelineNodes(nodes, dateRange)
    );
    
    expect(result.current.length).toBe(3);
  });

  test('returns empty array when no nodes match the range', () => {
    const nodes = [
      createMockNode('2023-01-01'),
      createMockNode('2023-01-15')
    ];

    const startDate = new Date('2023-02-01');
    const endDate = new Date('2023-02-28');
    const dateRange: [Date | null, Date | null] = [startDate, endDate];

    const { result } = renderHook(() => 
      useFilteredTimelineNodes(nodes, dateRange)
    );
    
    expect(result.current).toEqual([]);
    expect(result.current.length).toBe(0);
  });
}); 