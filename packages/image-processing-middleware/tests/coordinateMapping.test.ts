import { mapProcessedBoxToSource } from '../src';

describe('mapProcessedBoxToSource', () => {
  it('maps an upscaled, bordered word region back to source coordinates', () => {
    const box = mapProcessedBoxToSource(
      { x: 0.25, y: 0.25, width: 0.5, height: 0.5 },
      220, 120, 100, 50,
      { a: 0.5, b: 0, c: 0, d: 0.5, e: -5, f: -5 },
    );

    expect(box.x).toBeCloseTo(0.225);
    expect(box.y).toBeCloseTo(0.2);
    expect(box.width).toBeCloseTo(0.55);
    expect(box.height).toBeCloseTo(0.6);
  });

  it('maps rotation using all box corners and clamps to source bounds', () => {
    const box = mapProcessedBoxToSource(
      { x: 0, y: 0, width: 1, height: 1 },
      100, 100, 100, 100,
      { a: 0, b: -1, c: 1, d: 0, e: 0, f: 100 },
    );

    expect(box).toEqual({ x: 0, y: 0, width: 1, height: 1 });
  });
});
