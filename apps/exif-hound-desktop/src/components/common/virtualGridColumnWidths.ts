/** Horizontal padding per cell (Tailwind px-4 × 2). */
export const VIRTUAL_GRID_CELL_PADDING_X = 32;

/** Space between column tracks in the virtual grid. */
export const VIRTUAL_GRID_COLUMN_GAP = 10;

const HEADER_FONT = '600 12px system-ui, -apple-system, Segoe UI, sans-serif';
const BODY_FONT = '400 14px system-ui, -apple-system, Segoe UI, sans-serif';

let measureCanvas: HTMLCanvasElement | null = null;
let canvasMeasureEnabled: boolean | undefined;

function estimateTextPx(text: string): number {
  return text.length * 7.5;
}

function measureTextPx(text: string, font: string): number {
  if (!text) return 0;
  if (canvasMeasureEnabled === false || typeof document === 'undefined') {
    return estimateTextPx(text);
  }
  if (canvasMeasureEnabled !== true) {
    try {
      measureCanvas ??= document.createElement('canvas');
      const ctx = measureCanvas.getContext('2d');
      canvasMeasureEnabled = Boolean(ctx);
    } catch {
      canvasMeasureEnabled = false;
    }
    if (!canvasMeasureEnabled) {
      return estimateTextPx(text);
    }
  }
  const ctx = measureCanvas!.getContext('2d');
  if (!ctx) {
    return estimateTextPx(text);
  }
  ctx.font = font;
  return ctx.measureText(text).width;
}

export interface ColumnWidthInput<T> {
  id: string;
  label: string;
  width: number | 'flex';
  sortField?: string;
  value: (row: T) => string;
}

export function computeVirtualGridColumnWidths<T>(
  columns: ColumnWidthInput<T>[],
  rows: T[],
): number[] {
  const sortIconAllowance = 28;

  return columns.map((column) => {
    const headerText = column.label.toUpperCase();
    let contentMax = measureTextPx(headerText, HEADER_FONT);
    if (column.sortField) {
      contentMax += sortIconAllowance;
    }

    for (const row of rows) {
      contentMax = Math.max(contentMax, measureTextPx(column.value(row), BODY_FONT));
    }

    const minColumnWidth = 56;

    return Math.max(Math.ceil(contentMax) + VIRTUAL_GRID_CELL_PADDING_X, minColumnWidth);
  });
}

export function buildGridTemplateColumns(leadColumnWidth: number, columnWidths: number[]): string {
  const parts: string[] = [];
  if (leadColumnWidth > 0) {
    parts.push(`${leadColumnWidth}px`);
  }
  for (const width of columnWidths) {
    parts.push(`${width}px`);
  }
  return parts.join(' ');
}

export function sumGridWidth(leadColumnWidth: number, columnWidths: number[]): number {
  const columnCount = columnWidths.length + (leadColumnWidth > 0 ? 1 : 0);
  const gapTotal = columnCount > 1 ? (columnCount - 1) * VIRTUAL_GRID_COLUMN_GAP : 0;
  return leadColumnWidth + columnWidths.reduce((sum, width) => sum + width, 0) + gapTotal;
}
