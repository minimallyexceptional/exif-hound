import { DeviceAnalyzer } from '../analyzers/DeviceAnalyzer';
import { InsightImage } from '../../types';

function img(overrides: Partial<InsightImage>): InsightImage {
  return { id: 'i1', ...overrides };
}

describe('DeviceAnalyzer', () => {
  const analyzer = new DeviceAnalyzer();

  it('returns no devices on an empty dataset', () => {
    expect(analyzer.analyze([])).toEqual({ unique: [], unknownCount: 0 });
  });

  it('groups by make and model, case-insensitively', () => {
    const result = analyzer.analyze([
      img({ id: 'a', make: 'Canon', model: 'EOS R6' }),
      img({ id: 'b', make: 'canon', model: 'eos r6' })
    ]);
    expect(result.unique).toHaveLength(1);
    expect(result.unique[0]).toMatchObject({
      label: 'Canon EOS R6',
      count: 2,
      imageIds: ['a', 'b']
    });
    expect(result.unknownCount).toBe(0);
  });

  it('handles make-only and model-only devices with distinct labels', () => {
    const result = analyzer.analyze([
      img({ id: 'a', make: 'Canon' }),
      img({ id: 'b', model: 'Pixel 8' })
    ]);
    expect(result.unique.map(d => d.label).sort()).toEqual(['Canon', 'Pixel 8']);
    expect(result.unknownCount).toBe(0);
  });

  it('counts images with neither make nor model as unknown', () => {
    const result = analyzer.analyze([
      img({ id: 'a' }),
      img({ id: 'b', make: '  ', model: '' })
    ]);
    expect(result.unique).toEqual([]);
    expect(result.unknownCount).toBe(2);
  });

  it('collects lenses, attribution and software, sorted and deduplicated', () => {
    const result = analyzer.analyze([
      img({ id: 'a', make: 'Canon', model: 'R6', lensModel: 'RF 50mm', artist: 'Jane', copyright: '2024 Jane', software: 'GIMP' }),
      img({ id: 'b', make: 'canon', model: 'r6', lensModel: 'RF 24-70mm', artist: 'Jane Doe', copyright: '2025 Jane', software: 'Lightroom' })
    ]);
    expect(result.unique[0]).toMatchObject({
      lenses: ['RF 24-70mm', 'RF 50mm'],
      artists: ['Jane', 'Jane Doe'],
      copyrights: ['2024 Jane', '2025 Jane'],
      software: ['GIMP', 'Lightroom']
    });
  });

  it('ignores blank lens, attribution and software values', () => {
    const result = analyzer.analyze([
      img({ id: 'a', make: 'Canon', model: 'R6', lensModel: '  ', artist: null, copyright: '', software: undefined })
    ]);
    expect(result.unique[0]).toMatchObject({ lenses: [], artists: [], copyrights: [], software: [] });
  });

  it('sorts devices by count descending then label', () => {
    const result = analyzer.analyze([
      img({ id: 'a', make: 'Canon' }),
      img({ id: 'b', make: 'Canon' }),
      img({ id: 'c', make: 'Canon' }),
      img({ id: 'd', make: 'Apple' }),
      img({ id: 'e', make: 'Apple' })
    ]);
    expect(result.unique.map(d => d.label)).toEqual(['Canon', 'Apple']);
  });
});
