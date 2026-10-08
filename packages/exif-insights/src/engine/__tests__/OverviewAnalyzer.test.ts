import { OverviewAnalyzer } from '../analyzers/OverviewAnalyzer';
import { InsightImage } from '../../types';

function img(overrides: Partial<InsightImage>): InsightImage {
  return { id: 'i1', ...overrides };
}

describe('OverviewAnalyzer', () => {
  const analyzer = new OverviewAnalyzer();

  it('returns zeroes on an empty dataset', () => {
    expect(analyzer.analyze([])).toEqual({
      total: 0,
      processing: 0,
      withGps: 0,
      withGpsPercent: 0,
      withDateTime: 0,
      withDateTimePercent: 0,
      withDevice: 0,
      withDevicePercent: 0,
      withSoftware: 0,
      withSoftwarePercent: 0
    });
  });

  it('computes coverage counts and rounded percentages', () => {
    const images: InsightImage[] = [
      img({ id: 'a', latitude: 1, longitude: 1, dateTimeOriginal: '2023-01-01T00:00:00Z', make: 'Canon', software: 'GIMP' }),
      img({ id: 'b', latitude: 2, longitude: 2, dateTimeOriginal: '2023-01-02T00:00:00Z', model: 'R6' }),
      img({ id: 'c', isProcessing: true }),
      img({ id: 'd' })
    ];
    expect(analyzer.analyze(images)).toEqual({
      total: 4,
      processing: 1,
      withGps: 2,
      withGpsPercent: 50,
      withDateTime: 2,
      withDateTimePercent: 50,
      withDevice: 2,
      withDevicePercent: 50,
      withSoftware: 1,
      withSoftwarePercent: 25
    });
  });

  it('counts 100 percent when every image qualifies', () => {
    const images: InsightImage[] = [
      img({ id: 'a', latitude: 1, longitude: 1 }),
      img({ id: 'b', latitude: 2, longitude: 2 })
    ];
    expect(analyzer.analyze(images).withGpsPercent).toBe(100);
  });
});
