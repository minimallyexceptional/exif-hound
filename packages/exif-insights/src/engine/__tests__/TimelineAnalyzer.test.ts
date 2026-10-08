import { TimelineAnalyzer } from '../analyzers/TimelineAnalyzer';
import { InsightImage } from '../../types';

function img(id: string, dateTimeOriginal: string | null | undefined, overrides: Partial<InsightImage> = {}): InsightImage {
  return { id, dateTimeOriginal, ...overrides };
}

const T0 = new Date(2023, 5, 15, 12, 0, 0).getTime(); // 2023-06-15 12:00 local
const T1 = T0 + 1000;
const T2 = T0 + 2000;
const T3 = T0 + 3000;

describe('TimelineAnalyzer', () => {
  const analyzer = new TimelineAnalyzer();

  it('returns an empty timeline on an empty dataset', () => {
    expect(analyzer.analyze([])).toEqual({
      events: [],
      range: null,
      byHour: new Array(24).fill(0),
      byDay: [],
      bursts: [],
      gaps: [],
      noTimestamp: 0
    });
  });

  it('counts images without timestamps and excludes them from events', () => {
    const result = analyzer.analyze([
      img('a', '2023-06-15T12:00:00Z'),
      img('b', ''),
      img('c', null),
      img('d', 'garbage')
    ]);
    expect(result.noTimestamp).toBe(3);
    expect(result.events).toHaveLength(1);
  });

  it('parses ISO timestamps and orders events chronologically', () => {
    const result = analyzer.analyze([
      img('a', '2023-06-15T12:00:00Z'),
      img('b', '2023-06-15T12:00:05Z')
    ]);
    expect(result.events.map(e => e.imageIds)).toEqual([['a'], ['b']]);
    expect(result.range).toEqual({ start: result.events[0].timestamp, end: result.events[1].timestamp });
  });

  it('merges images sharing an identical timestamp and dedupes device labels', () => {
    const result = analyzer.analyze([
      img('a', '2023:06:15 12:00:00', { make: 'Canon', model: 'R6' }),
      img('b', '2023:06:15 12:00:00', { make: 'Canon', model: 'R6' }),
      img('c', '2023:06:15 12:00:00', { make: 'Apple', model: 'iPhone' })
    ]);
    expect(result.events).toHaveLength(1);
    expect(result.events[0]).toMatchObject({ count: 3, imageIds: ['a', 'b', 'c'] });
    expect(result.events[0].deviceLabels).toEqual(['Canon R6', 'Apple iPhone']);
    expect(result.events[0].iso).toBe(new Date(result.events[0].timestamp).toISOString());
  });

  it('builds by-hour and by-day activity', () => {
    const earlier = new Date(2023, 5, 14, 8, 0, 0).getTime();
    const result = analyzer.analyze([
      img('a', new Date(earlier).toISOString()),
      img('b', new Date(T0).toISOString()),
      img('c', new Date(T0).toISOString()),
      img('d', new Date(T3).toISOString())
    ]);
    expect(result.byHour.filter(count => count > 0)).toEqual([
      result.byHour[new Date(earlier).getHours()],
      result.byHour[new Date(T0).getHours()]
    ]);
    expect(result.byHour[new Date(earlier).getHours()]).toBe(1);
    expect(result.byHour[new Date(T0).getHours()]).toBe(3);
    expect(result.byDay).toEqual([
      { date: '2023-06-14', count: 1 },
      { date: '2023-06-15', count: 3 }
    ]);
  });

  it('detects bursts within the two-second threshold and flushes trailing bursts', () => {
    const result = analyzer.analyze([
      img('a', new Date(T0).toISOString()),
      img('b', new Date(T1).toISOString()),
      img('c', new Date(T2).toISOString()),
      img('d', new Date(T3).toISOString()) // still within 2s of previous event
    ]);
    expect(result.bursts).toHaveLength(1);
    expect(result.bursts[0]).toMatchObject({
      start: T0,
      end: T3,
      count: 4,
      imageIds: ['a', 'b', 'c', 'd']
    });
  });

  it('splits bursts when the interval exceeds the threshold', () => {
    const result = analyzer.analyze([
      img('a', new Date(T0).toISOString()),
      img('b', new Date(T1).toISOString()),
      img('c', new Date(T0 + 30000).toISOString())
    ]);
    expect(result.bursts).toHaveLength(1);
    expect(result.bursts[0].imageIds).toEqual(['a', 'b']);
  });

  it('does not flag a single event as a burst', () => {
    const result = analyzer.analyze([img('a', new Date(T0).toISOString())]);
    expect(result.bursts).toEqual([]);
  });

  it('detects gaps longer than ten percent of the range', () => {
    const start = T0;
    const end = start + 100000; // range 100s, gap threshold 10s
    const result = analyzer.analyze([
      img('a', new Date(start).toISOString()),
      img('b', new Date(start + 20000).toISOString()), // 20s gap > 10s
      img('c', new Date(start + 26000).toISOString()), // 6s gap, not a gap
      img('d', new Date(end).toISOString())            // 74s gap > 10s
    ]);
    expect(result.gaps).toEqual([
      { start: start, end: start + 20000, durationMs: 20000 },
      { start: start + 26000, end: end, durationMs: 74000 }
    ]);
  });

  it('reports no gaps for a single event', () => {
    const result = analyzer.analyze([img('a', new Date(T0).toISOString())]);
    expect(result.gaps).toEqual([]);
    expect(result.range).toEqual({ start: T0, end: T0 });
  });
});
