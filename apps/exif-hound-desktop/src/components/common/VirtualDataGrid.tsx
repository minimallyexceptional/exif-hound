import React, { useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import {
  buildGridTemplateColumns,
  computeVirtualGridColumnWidths,
  sumGridWidth,
  VIRTUAL_GRID_COLUMN_GAP,
} from './virtualGridColumnWidths';

export const VIRTUAL_GRID_ROW_HEIGHT = 48;
export const VIRTUAL_GRID_HEADER_HEIGHT = 40;

export interface VirtualGridColumn<T> {
  id: string;
  label: string;
  width: number | 'flex';
  align?: 'right';
  sortField?: string;
  value: (row: T) => string;
  cellClassName?: (row: T) => string;
}

interface Props<T> {
  rows: T[];
  columns: VirtualGridColumn<T>[];
  ariaLabel: string;
  getRowKey: (row: T, index: number) => string;
  leadColumnWidth?: number;
  renderLeadCell?: (row: T) => React.ReactNode;
  onRowClick?: (row: T) => void;
  selectedRowKey?: string | null;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
  emptyState?: React.ReactNode;
}

const cellClasses = (align?: 'right') =>
  `px-4 whitespace-nowrap ${align === 'right' ? 'text-right tabular-nums' : ''}`;

const gridRowStyle = (
  gridTemplateColumns: string,
  tableWidth: number,
  height?: number,
): React.CSSProperties => ({
  gridTemplateColumns,
  width: tableWidth,
  columnGap: VIRTUAL_GRID_COLUMN_GAP,
  ...(height != null ? { height } : {}),
});

export function VirtualDataGrid<T>({
  rows,
  columns,
  ariaLabel,
  getRowKey,
  leadColumnWidth = 0,
  renderLeadCell,
  onRowClick,
  selectedRowKey,
  sortField,
  sortDirection = 'asc',
  onSort,
  emptyState,
}: Props<T>): React.ReactElement {
  const parentRef = useRef<HTMLDivElement>(null);
  const activeColumns = columns;

  const columnWidths = useMemo(
    () => computeVirtualGridColumnWidths(activeColumns, rows),
    [activeColumns, rows],
  );

  const gridTemplateColumns = useMemo(
    () => buildGridTemplateColumns(leadColumnWidth, columnWidths),
    [columnWidths, leadColumnWidth],
  );

  const tableWidth = useMemo(
    () => sumGridWidth(leadColumnWidth, columnWidths),
    [columnWidths, leadColumnWidth],
  );

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => VIRTUAL_GRID_ROW_HEIGHT,
    overscan: 8,
  });

  if (!rows.length && emptyState) {
    return <>{emptyState}</>;
  }

  const colCount = activeColumns.length + (leadColumnWidth ? 1 : 0);

  return (
    <div className="flex-1 overflow-hidden glass-panel min-h-0">
      <div
        ref={parentRef}
        role="grid"
        aria-label={ariaLabel}
        className="h-full overflow-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-app-accent"
        aria-rowcount={rows.length + 1}
        aria-colcount={colCount}
      >
        <div style={{ width: tableWidth }}>
          <div
            role="row"
            className="sticky top-0 z-20 grid bg-app-gray border-b border-app-gray-light/40"
            style={gridRowStyle(gridTemplateColumns, tableWidth, VIRTUAL_GRID_HEADER_HEIGHT)}
          >
            {leadColumnWidth > 0 && (
              <div role="columnheader" className="border-r border-app-gray-light/20" aria-label="Preview" />
            )}
            {activeColumns.map(column => {
              const sortable = Boolean(column.sortField && onSort);
              const isActiveSort = sortable && sortField === column.sortField;
              return (
                <div
                  key={column.id}
                  role="columnheader"
                  className={`${sortable ? 'p-0' : 'px-4'} h-full flex items-center`}
                  aria-sort={isActiveSort ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  {sortable ? (
                    <button
                      type="button"
                      onClick={() => onSort?.(column.sortField!)}
                      className={`flex h-full w-full items-center gap-1.5 px-4 text-xs font-semibold uppercase tracking-wide text-app-accent-dim transition-colors hover:bg-app-gray-light/40 hover:text-app-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-app-accent ${column.align === 'right' ? 'justify-end text-right' : 'text-left'}`}
                    >
                      {column.label}
                      {isActiveSort ? (
                        sortDirection === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-app-white" aria-hidden="true" /> : <ArrowDown className="h-3.5 w-3.5 text-app-white" aria-hidden="true" />
                      ) : <ArrowUpDown className="h-3.5 w-3.5 text-app-accent-dim/50" aria-hidden="true" />}
                    </button>
                  ) : (
                    <span className="px-4 text-xs font-semibold uppercase tracking-wide text-app-accent-dim">{column.label}</span>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
            {virtualizer.getVirtualItems().map(virtualItem => {
              const row = rows[virtualItem.index];
              const rowKey = getRowKey(row, virtualItem.index);
              const isSelected = selectedRowKey === rowKey;
              const clickable = Boolean(onRowClick);
              return (
                <div
                  key={virtualItem.key}
                  role="row"
                  aria-rowindex={virtualItem.index + 2}
                  aria-selected={isSelected}
                  tabIndex={clickable ? 0 : undefined}
                  onClick={clickable ? () => onRowClick?.(row) : undefined}
                  onKeyDown={clickable ? (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onRowClick?.(row);
                    }
                  } : undefined}
                  className={`grid items-stretch border-b border-app-gray-light/10 outline-none transition-colors duration-150 ${clickable ? 'cursor-pointer hover:bg-app-gray-light/30 focus-visible:bg-app-gray-light/30 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-app-accent/70' : ''} ${isSelected ? 'bg-app-accent/10' : ''}`}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: tableWidth,
                    height: VIRTUAL_GRID_ROW_HEIGHT,
                    transform: `translateY(${virtualItem.start}px)`,
                    ...gridRowStyle(gridTemplateColumns, tableWidth),
                    boxShadow: isSelected ? 'inset 3px 0 0 var(--app-accent)' : undefined,
                  }}
                >
                  {leadColumnWidth > 0 && renderLeadCell && (
                    <div role="gridcell" className="flex items-center justify-center border-r border-app-gray-light/20">
                      {renderLeadCell(row)}
                    </div>
                  )}
                  {activeColumns.map((column) => {
                    const text = column.value(row);
                    return (
                      <div
                        key={column.id}
                        role="gridcell"
                        title={text}
                        className={`${cellClasses(column.align)} h-full flex items-center ${column.cellClassName?.(row) ?? ''}`}
                      >
                        <span className={`${text === '—' ? 'text-app-accent-dim/50' : 'text-app-white/90'} ${column.id === 'value' || column.id === 'text' ? 'selectable-value' : ''}`}>{text}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
