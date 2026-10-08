import { AnomalyAnalyzer } from '../analyzers/AnomalyAnalyzer';
import { InsightImage } from '../../types';

function img(overrides: Partial<InsightImage>): InsightImage {
  return { id: 'i1', ...overrides };
}

describe('AnomalyAnalyzer', () => {
  const analyzer = new AnomalyAnalyzer();

  it('returns empty arrays on an empty dataset', () => {
    expect(analyzer.analyze([])).toEqual({
      gpsWithoutTimestamp: [],
      timestampWithoutGps: [],
      sparseMetadata: [],
      multiDeviceLocations: [],
      resolutionOutliers: [],
      orientationOutliers: []
    });
  });

  it('flags GPS without timestamp and timestamp without GPS', () => {
    const result = analyzer.analyze([
      img({ id: 'gps-no-time', latitude: 1, longitude: 1 }),
      img({ id: 'time-no-gps', dateTimeOriginal: '2023-01-01T00:00:00Z' }),
      img({ id: 'clean', latitude: 1, longitude: 1, dateTimeOriginal: '2023-01-01T00:00:00Z' })
    ]);
    expect(result.gpsWithoutTimestamp).toEqual(['gps-no-time']);
    expect(result.timestampWithoutGps).toEqual(['time-no-gps']);
  });

  it('does not count an unparseable timestamp as present', () => {
    const result = analyzer.analyze([img({ id: 'a', latitude: 1, longitude: 1, dateTimeOriginal: 'garbage' })]);
    expect(result.gpsWithoutTimestamp).toEqual(['a']);
    expect(result.timestampWithoutGps).toEqual([]);
  });

  it('flags sparse metadata (fewer than three core fields)', () => {
    const result = analyzer.analyze([
      img({ id: 'sparse', make: 'Canon' }),
      img({ id: 'rich', make: 'Canon', dateTimeOriginal: '2023-01-01T00:00:00Z', latitude: 1, longitude: 1, imageWidth: 100, imageHeight: 50 })
    ]);
    expect(result.sparseMetadata).toEqual(['sparse']);
  });

  it('flags locations captured by multiple devices, both grouping modes', () => {
    const result = analyzer.analyze([
      img({ id: 'a', latitude: 1, longitude: 1, make: 'Canon', model: 'R6', location: { formatted: 'Paris' } }),
      img({ id: 'b', latitude: 1.0001, longitude: 1.0001, make: 'Apple', model: 'iPhone', location: { formatted: 'paris' } }),
      img({ id: 'c', latitude: 10, longitude: 10, make: 'Canon' }),
      img({ id: 'd', latitude: 10.0001, longitude: 10.0001, make: 'Apple' }),
      img({ id: 'e', latitude: 20, longitude: 20, make: 'Canon' })
    ]);
    expect(result.multiDeviceLocations).toEqual(['grid:10.000,10.000', 'name:paris']);
  });

  it('flags single-device locations as clean', () => {
    const result = analyzer.analyze([
      img({ id: 'a', latitude: 1, longitude: 1, make: 'Canon', model: 'R6' }),
      img({ id: 'b', latitude: 1.0001, longitude: 1.0001, make: 'Canon', model: 'R6' })
    ]);
    expect(result.multiDeviceLocations).toEqual([]);
  });

  it('flags resolution outliers below ten percent of sized images', () => {
    const images: InsightImage[] = Array.from({ length: 19 }, (_, i) =>
      img({ id: `std-${i}`, imageWidth: 4000, imageHeight: 3000 }));
    images.push(img({ id: 'odd1', imageWidth: 640, imageHeight: 480 }));
    images.push(img({ id: 'odd2', imageWidth: 800, imageHeight: 600 }));
    const result = analyzer.analyze(images);
    expect(result.resolutionOutliers).toEqual(['odd1', 'odd2']);
  });

  it('does not flag small groups at or above the ten percent boundary', () => {
    const images: InsightImage[] = Array.from({ length: 9 }, (_, i) =>
      img({ id: `std-${i}`, imageWidth: 4000, imageHeight: 3000 }));
    images.push(img({ id: 'small-group', imageWidth: 640, imageHeight: 480 }));
    const result = analyzer.analyze(images);
    expect(result.resolutionOutliers).toEqual([]);
  });

  it('returns no resolution outliers when no image has dimensions', () => {
    expect(analyzer.analyze([img({ id: 'a' })]).resolutionOutliers).toEqual([]);
  });

  it('flags orientations differing from the dataset majority', () => {
    const result = analyzer.analyze([
      img({ id: 'normal-1', orientation: 1 }),
      img({ id: 'normal-2', orientation: 1 }),
      img({ id: 'flipped', orientation: 6 })
    ]);
    expect(result.orientationOutliers).toEqual(['flipped']);
  });

  it('ignores images without an orientation value and handles majority ties', () => {
    const result = analyzer.analyze([
      img({ id: 'first', orientation: 1 }),
      img({ id: 'second', orientation: 6 }),
      img({ id: 'no-orientation' })
    ]);
    // Majority tie: the first-seen orientation wins; the other is flagged.
    expect(result.orientationOutliers).toEqual(['second']);
  });

  it('returns no orientation outliers when no image is oriented', () => {
    expect(analyzer.analyze([img({ id: 'a' })]).orientationOutliers).toEqual([]);
  });
});
