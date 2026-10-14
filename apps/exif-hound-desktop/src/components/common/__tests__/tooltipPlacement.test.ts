import { placeTooltip } from '../tooltipPlacement';

const viewport = { width: 1024, height: 768 };
const tip = { width: 240, height: 40 };

describe('placeTooltip', () => {
  it('keeps the preferred top placement when there is room', () => {
    const trigger = { top: 200, left: 400, right: 440, bottom: 232, width: 40, height: 32 };
    expect(placeTooltip(trigger, tip, 'top', viewport)).toEqual({
      position: 'top',
      top: 152,
      left: 300,
    });
  });

  it('flips to bottom when a top tooltip would leave the viewport', () => {
    const trigger = { top: 8, left: 400, right: 440, bottom: 40, width: 40, height: 32 };
    const placed = placeTooltip(trigger, tip, 'top', viewport);
    expect(placed.position).toBe('bottom');
    expect(placed.top).toBe(48);
    expect(placed.left).toBe(300);
  });

  it('moves to a side that keeps a wide tooltip inside the viewport', () => {
    const trigger = { top: 200, left: 980, right: 1020, bottom: 232, width: 40, height: 32 };
    const placed = placeTooltip(trigger, tip, 'top', viewport);
    expect(placed.position).toBe('left');
    expect(placed.left).toBe(732);
    expect(placed.left + tip.width).toBeLessThanOrEqual(viewport.width - 8);
  });

  it('flips to the right when a left tooltip would be clipped', () => {
    const trigger = { top: 200, left: 12, right: 52, bottom: 232, width: 40, height: 32 };
    const placed = placeTooltip(trigger, tip, 'left', viewport);
    expect(placed.position).toBe('right');
    expect(placed.left).toBe(60);
  });
});
