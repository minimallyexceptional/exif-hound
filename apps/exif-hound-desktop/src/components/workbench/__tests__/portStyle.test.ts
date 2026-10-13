import { portColor, portEdgeStyle, portHandleClass } from '../portStyle';

describe('portStyle', () => {
  it('maps each data type to a dedicated token', () => {
    expect(portColor('image')).toBe('var(--port-image)');
    expect(portColor('text')).toBe('var(--port-text)');
    expect(portColor('evidence')).toBe('var(--port-evidence)');
  });

  it('sizes connection points at three-quarters of the doubled handle and tints them by type', () => {
    expect(portHandleClass('image')).toContain('!h-[18px]');
    expect(portHandleClass('image')).toContain('!w-[18px]');
    expect(portHandleClass('text')).toContain('bg-[var(--port-text)]');
    expect(portHandleClass('evidence')).toContain('bg-[var(--port-evidence)]');
  });

  it('strokes edges with the source port color', () => {
    expect(portEdgeStyle('image')).toEqual({ stroke: 'var(--port-image)', strokeWidth: 2.5 });
    expect(portEdgeStyle('unknown')).toEqual({ stroke: 'var(--app-accent-dim)', strokeWidth: 2.5 });
  });
});
