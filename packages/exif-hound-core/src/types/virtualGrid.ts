export interface VirtualGridColumn<T> {
  id: string;
  label: string;
  width: number | 'flex';
  align?: 'right';
  sortField?: string;
  value: (row: T) => string;
  cellClassName?: (row: T) => string;
}
