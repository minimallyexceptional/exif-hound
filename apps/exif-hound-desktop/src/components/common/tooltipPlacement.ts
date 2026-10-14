export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export interface RectLike {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export function placeTooltip(
  trigger: RectLike,
  tip: { width: number; height: number },
  preferred: TooltipPosition = 'top',
  viewport: { width: number; height: number } = { width: 1024, height: 768 },
  gap = 8,
  padding = 8,
): { top: number; left: number; position: TooltipPosition } {
  const candidates: Record<TooltipPosition, { top: number; left: number }> = {
    top: {
      top: trigger.top - tip.height - gap,
      left: trigger.left + trigger.width / 2 - tip.width / 2,
    },
    bottom: {
      top: trigger.bottom + gap,
      left: trigger.left + trigger.width / 2 - tip.width / 2,
    },
    left: {
      top: trigger.top + trigger.height / 2 - tip.height / 2,
      left: trigger.left - tip.width - gap,
    },
    right: {
      top: trigger.top + trigger.height / 2 - tip.height / 2,
      left: trigger.right + gap,
    },
  };

  const fits = (position: TooltipPosition) => {
    const { top, left } = candidates[position];
    return (
      top >= padding
      && left >= padding
      && top + tip.height <= viewport.height - padding
      && left + tip.width <= viewport.width - padding
    );
  };

  const fallback: TooltipPosition[] = ['bottom', 'top', 'right', 'left'];
  const order = [preferred, ...fallback.filter((position) => position !== preferred)];
  const position = order.find(fits) ?? preferred;
  const placed = candidates[position];
  const maxLeft = Math.max(padding, viewport.width - tip.width - padding);
  const maxTop = Math.max(padding, viewport.height - tip.height - padding);

  return {
    position,
    top: Math.min(Math.max(padding, placed.top), maxTop),
    left: Math.min(Math.max(padding, placed.left), maxLeft),
  };
}
