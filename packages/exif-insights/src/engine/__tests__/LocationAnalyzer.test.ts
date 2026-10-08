import { LocationAnalyzer } from '../analyzers/LocationAnalyzer';
import { InsightImage } from '../../types';

function img(overrides: Partial<InsightImage>): InsightImage {
  return { id: 'i1', ...overrides };
}

describe('LocationAnalyzer', () => {
  const analyzer = new LocationAnalyzer();

  it('returns no locations and counts no-Gps on an empty dataset', () => {
    expect(analyzer.analyze([])).toEqual({ unique: [], noGps: 0 });
  });

  it('groups by reverse-geocoded name, case-insensitively', () => {
    const result = analyzer.analyze([
      img({ id: 'a', latitude: 51.5, longitude: -0.12, location: { formatted: 'London, UK' } }),
      img({ id: 'b', latitude: 51.5001, longitude: -0.1201, location: { formatted: 'london, uk' } }),
      img({ id: 'c', latitude: 48.85, longitude: 2.35, location: { formatted: 'Paris, France' } })
    ]);
    expect(result.unique).toHaveLength(2);
    const london = result.unique.find(l => l.name === 'London, UK');
    expect(london).toMatchObject({ count: 2, imageIds: ['a', 'b'] });
    expect(result.unique[0].name).toBe('London, UK');
    expect(result.noGps).toBe(0);
  });

  it('composes names from parts when formatted is absent', () => {
    const result = analyzer.analyze([
      img({ id: 'a', latitude: 48.85, longitude: 2.35, location: { city: 'Paris', country: 'France' } })
    ]);
    expect(result.unique[0]).toMatchObject({ name: 'Paris, France', count: 1 });
  });

  it('falls back to ~100 m grid cells for unnamed GPS points', () => {
    const result = analyzer.analyze([
      img({ id: 'a', latitude: 51.50011, longitude: -0.12012 }),
      img({ id: 'b', latitude: 51.50049, longitude: -0.12049 }),
      img({ id: 'c', latitude: 51.50100, longitude: -0.12000 })
    ]);
    // a and b share the 3-decimal cell; c is one cell away.
    expect(result.unique).toHaveLength(2);
    const pair = result.unique.find(l => l.count === 2);
    expect(pair).toMatchObject({ name: null, imageIds: ['a', 'b'] });
    expect(result.unique[0].name).toBeNull();
  });

  it('counts images without GPS as noGps', () => {
    const result = analyzer.analyze([
      img({ id: 'a', latitude: 1, longitude: 1 }),
      img({ id: 'b' }),
      img({ id: 'c', latitude: null, longitude: null })
    ]);
    expect(result.noGps).toBe(2);
    expect(result.unique).toHaveLength(1);
  });

  it('tracks sorted altitudes and sorted device labels per location', () => {
    const result = analyzer.analyze([
      img({ id: 'a', latitude: 1, longitude: 1, gpsAltitude: 30, make: 'Canon', model: 'R6' }),
      img({ id: 'b', latitude: 1.0001, longitude: 1.0001, gpsAltitude: 10, make: 'Apple', model: 'iPhone' }),
      img({ id: 'c', latitude: 1.0002, longitude: 1.0002, make: 'Apple', model: 'iPhone' })
    ]);
    expect(result.unique[0]).toMatchObject({
      altitudes: [10, 30],
      deviceLabels: ['Apple iPhone', 'Canon R6']
    });
  });

  it('uses centroid coordinates for the label', () => {
    const result = analyzer.analyze([
      img({ id: 'a', latitude: 10.0, longitude: 20.0 }),
      img({ id: 'b', latitude: 10.0001, longitude: 20.0001 })
    ]);
    expect(result.unique[0].coordinateLabel).toBe('10.0000, 20.0001');
  });

  it('sorts by count descending then name', () => {
    const result = analyzer.analyze([
      img({ id: 'a', latitude: 1, longitude: 1, location: { formatted: 'Small' } }),
      img({ id: 'b', latitude: 2, longitude: 2, location: { formatted: 'Big A' } }),
      img({ id: 'c', latitude: 3, longitude: 3, location: { formatted: 'Big B' } }),
      img({ id: 'd', latitude: 4, longitude: 4, location: { formatted: 'Big C' } })
    ]);
    expect(result.unique.map(l => l.name)).toEqual(['Big A', 'Big B', 'Big C', 'Small']);
  });
});
