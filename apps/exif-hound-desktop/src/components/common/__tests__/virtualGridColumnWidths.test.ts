import {
  buildGridTemplateColumns,
  computeVirtualGridColumnWidths,
  sumGridWidth,
} from '../virtualGridColumnWidths';

describe('virtualGridColumnWidths', () => {
  it('sizes columns from header and cell content', () => {
    const columns = [
      {
        id: 'coords',
        label: 'Coordinates',
        width: 'flex' as const,
        value: (row: { coords: string }) => row.coords,
      },
      {
        id: 'place',
        label: 'Place',
        width: 200,
        value: () => '—',
      },
    ];
    const rows = [{ coords: '43.468243, 11.880172' }];
    const widths = computeVirtualGridColumnWidths(columns, rows);
    expect(widths[0]).toBeGreaterThan(160);
    expect(widths[1]).toBeLessThan(120);
  });

  it('builds fixed pixel grid tracks', () => {
    expect(buildGridTemplateColumns(56, [120, 80])).toBe('56px 120px 80px');
    expect(sumGridWidth(56, [120, 80])).toBe(276);
  });
});
