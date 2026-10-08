import { SoftwareAnalyzer } from '../analyzers/SoftwareAnalyzer';
import { InsightImage } from '../../types';

function img(overrides: Partial<InsightImage>): InsightImage {
  return { id: 'i1', ...overrides };
}

describe('SoftwareAnalyzer', () => {
  const analyzer = new SoftwareAnalyzer();

  it('returns empty results on an empty dataset', () => {
    expect(analyzer.analyze([])).toEqual({ detected: [], editedCount: 0, cameraOriginalCount: 0 });
  });

  it('counts detected software and the edited split, sorted by count then name', () => {
    const result = analyzer.analyze([
      img({ id: 'a', software: 'GIMP 2.10' }),
      img({ id: 'b', software: 'gimp 2.10' }),
      img({ id: 'c', software: 'Adobe Photoshop 25.0' }),
      img({ id: 'd', software: '  GIMP 2.10  ' }),
      img({ id: 'e' })
    ]);
    expect(result.detected).toEqual([
      { name: 'GIMP 2.10', count: 2 },
      { name: 'Adobe Photoshop 25.0', count: 1 },
      { name: 'gimp 2.10', count: 1 }
    ]);
    expect(result.editedCount).toBe(4);
    expect(result.cameraOriginalCount).toBe(1);
  });

  it('treats blank software as absent', () => {
    const result = analyzer.analyze([img({ id: 'a', software: '   ' })]);
    expect(result.detected).toEqual([]);
    expect(result.editedCount).toBe(0);
    expect(result.cameraOriginalCount).toBe(1);
  });
});
