import { BaseAnalyzer } from '../BaseAnalyzer';
import { InsightImage, OverviewInsights } from '../../types';

class TestAnalyzer extends BaseAnalyzer<OverviewInsights> {
  analyze(images: readonly InsightImage[]): OverviewInsights {
    return {
      total: images.length, processing: 0, withGps: 0, withGpsPercent: 0,
      withDateTime: 0, withDateTimePercent: 0, withDevice: 0,
      withDevicePercent: 0, withSoftware: 0, withSoftwarePercent: 0
    };
  }

  expose() {
    return {
      hasText: (v: string | null | undefined) => this.hasText(v),
      hasGps: (image: InsightImage) => this.hasGps(image),
      deviceKey: (image: InsightImage) => this.deviceKey(image),
      deviceLabel: (image: InsightImage) => this.deviceLabel(image),
      byCountThenName: this.byCountThenName.bind(this)
    };
  }
}

const exposed = new TestAnalyzer().expose();

describe('BaseAnalyzer helpers', () => {
  it('hasText treats null, undefined and blank strings as absent', () => {
    expect(exposed.hasText(null)).toBe(false);
    expect(exposed.hasText(undefined)).toBe(false);
    expect(exposed.hasText('')).toBe(false);
    expect(exposed.hasText('   ')).toBe(false);
    expect(exposed.hasText('value')).toBe(true);
  });

  it('hasGps requires both coordinates', () => {
    expect(exposed.hasGps({ id: 'a', latitude: 1, longitude: 2 })).toBe(true);
    expect(exposed.hasGps({ id: 'a', latitude: 1 })).toBe(false);
    expect(exposed.hasGps({ id: 'a', longitude: 2 })).toBe(false);
    expect(exposed.hasGps({ id: 'a', latitude: null, longitude: null })).toBe(false);
  });

  it('deviceKey is stable and case-normalized', () => {
    expect(exposed.deviceKey({ id: 'a', make: 'Canon', model: 'R6' })).toBe('canon|r6');
    expect(exposed.deviceKey({ id: 'a' })).toBe('|');
  });

  it('deviceLabel composes make and model', () => {
    expect(exposed.deviceLabel({ id: 'a', make: 'Canon', model: 'R6' })).toBe('Canon R6');
    expect(exposed.deviceLabel({ id: 'a', make: 'Canon' })).toBe('Canon');
    expect(exposed.deviceLabel({ id: 'a', model: 'R6' })).toBe('R6');
    expect(exposed.deviceLabel({ id: 'a' })).toBe('Unknown device');
  });

  it('byCountThenName sorts descending by count, then ascending by name or key', () => {
    expect(exposed.byCountThenName({ count: 2, name: 'B' }, { count: 1, name: 'A' })).toBeLessThan(0);
    expect(exposed.byCountThenName({ count: 1, name: 'A' }, { count: 2, name: 'B' })).toBeGreaterThan(0);
    expect(exposed.byCountThenName({ count: 1, name: 'A' }, { count: 1, name: 'B' })).toBeLessThan(0);
    expect(exposed.byCountThenName({ count: 1, name: 'B' }, { count: 1, name: 'A' })).toBeGreaterThan(0);
    expect(exposed.byCountThenName({ count: 1, key: 'k1' }, { count: 1, key: 'k2' })).toBeLessThan(0);
    expect(exposed.byCountThenName({}, {})).toBe(0);
  });
});
