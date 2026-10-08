import { InsightsEngine } from '../InsightsEngine';
import { BaseAnalyzer } from '../BaseAnalyzer';
import { InsightImage, OverviewInsights } from '../../types';

class StubAnalyzer<T> extends BaseAnalyzer<T> {
  constructor(private readonly result: T) {
    super();
  }
  analyze(): T {
    return this.result;
  }
}

const sample: InsightImage[] = [
  { id: 'a', latitude: 51.5, longitude: -0.12, dateTimeOriginal: '2023:06:15 12:00:00', make: 'Canon', model: 'EOS R6', software: 'GIMP' },
  { id: 'b', latitude: 51.5, longitude: -0.12, dateTimeOriginal: '2023:06:15 12:00:01', make: 'Apple', model: 'iPhone 15 Pro' },
  { id: 'c' }
];

describe('InsightsEngine', () => {
  it('computes every section via the default analyzer set', () => {
    const insights = new InsightsEngine().compute(sample);
    expect(insights.overview.total).toBe(3);
    expect(insights.overview.withDevice).toBe(2);
    expect(insights.locations.unique).toHaveLength(1);
    expect(insights.devices.unique).toHaveLength(2);
    expect(insights.timeline.events).toHaveLength(2);
    expect(insights.software.editedCount).toBe(1);
    expect(insights.anomalies.multiDeviceLocations).toEqual(['grid:51.500,-0.120']);
  });

  it('handles an empty dataset', () => {
    const insights = new InsightsEngine().compute([]);
    expect(insights.overview.total).toBe(0);
    expect(insights.timeline.range).toBeNull();
  });

  it('allows analyzer injection for testing', () => {
    const stubResult: OverviewInsights = {
      total: 42, processing: 0, withGps: 0, withGpsPercent: 0,
      withDateTime: 0, withDateTimePercent: 0, withDevice: 0,
      withDevicePercent: 0, withSoftware: 0, withSoftwarePercent: 0
    };
    const engine = new InsightsEngine({
      overview: new StubAnalyzer(stubResult),
      locations: new StubAnalyzer(stubResult as never),
      devices: new StubAnalyzer(stubResult as never),
      timeline: new StubAnalyzer(stubResult as never),
      software: new StubAnalyzer(stubResult as never),
      anomalies: new StubAnalyzer(stubResult as never)
    });
    const insights = engine.compute(sample);
    expect(insights.overview.total).toBe(42);
    expect(insights.locations).toBe(stubResult);
  });
});
