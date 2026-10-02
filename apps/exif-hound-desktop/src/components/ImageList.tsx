import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ImageData } from '../types';
import { ArrowUpDown, Camera, Clock, MapPin, Info, Settings2, Check } from 'lucide-react';
import { formatFileSize } from '../utils/formatters';
import { formatShortDateTime } from '../utils/date';
import { ImportedPoint } from '../utils/importData';

interface Props {
  images: (ImageData | ImportedPoint)[];
  selectedImage: ImageData | null;
  onSelect: (image: ImageData) => void;
}

type SortField = 'name' | 'date' | 'size' | 'make';
type SortDirection = 'asc' | 'desc';

/** One spreadsheet column: a single atomic value per cell. */
interface ColumnDef {
  id: string;
  label: string;
  /** Fixed width in px, or 'flex' for the one stretchy column (Name) */
  width: number | 'flex';
  align?: 'right';
  sortField?: SortField;
  value: (image: ImageData) => string;
}

/** A toggleable group of spreadsheet columns (Customize Columns panel). */
interface ColumnGroup {
  id: string;
  label: string;
  icon: React.ReactNode;
  defaultEnabled: boolean;
  columns: ColumnDef[];
}

/** Fixed row/header heights — rows are single-line, so virtual sizing is exact. */
const ROW_HEIGHT = 44;
const HEADER_HEIGHT = 40;
const THUMB_WIDTH = 56;

const na = (value: string | number | null | undefined): string =>
  value == null || value === '' ? '—' : String(value);

const COLUMN_GROUPS: ColumnGroup[] = [
  {
    id: 'fileInfo',
    label: 'File Information',
    icon: <Info className="w-4 h-4" />,
    defaultEnabled: true,
    columns: [
      { id: 'name', label: 'Name', width: 'flex', sortField: 'name', value: (img) => img.file.name },
      { id: 'size', label: 'Size', width: 90, align: 'right', sortField: 'size', value: (img) => formatFileSize(img.file.size) },
      { id: 'type', label: 'Type', width: 80, value: (img) => img.file.type.split('/')[1]?.toUpperCase() || '—' },
    ],
  },
  {
    id: 'temporal',
    label: 'Temporal Data',
    icon: <Clock className="w-4 h-4" />,
    defaultEnabled: true,
    columns: [
      { id: 'created', label: 'Created', width: 160, sortField: 'date', value: (img) => na(img.exif.dateTimeOriginal ? formatShortDateTime(img.exif.dateTimeOriginal) : null) },
      { id: 'modified', label: 'Modified', width: 160, value: (img) => formatShortDateTime(new Date(img.file.lastModified).toISOString()) },
    ],
  },
  {
    id: 'device',
    label: 'Device & Technical Info',
    icon: <Camera className="w-4 h-4" />,
    defaultEnabled: true,
    columns: [
      {
        id: 'device',
        label: 'Device',
        width: 190,
        sortField: 'make',
        value: (img) => {
          const parts = [
            `${img.exif.make || ''} ${img.exif.model || ''}`.trim(),
            img.exif.software ? `Software: ${img.exif.software}` : '',
            img.exif.lensModel ? `Lens: ${img.exif.lensModel}` : '',
          ].filter(Boolean);
          return parts.length > 0 ? parts.join(' • ') : '—';
        },
      },
      {
        id: 'dimensions',
        label: 'Dimensions',
        width: 110,
        value: (img) => (img.exif.imageWidth && img.exif.imageHeight ? `${img.exif.imageWidth}×${img.exif.imageHeight}` : '—'),
      },
    ],
  },
  {
    id: 'metadata',
    label: 'Metadata',
    icon: <Info className="w-4 h-4" />,
    defaultEnabled: true,
    columns: [
      { id: 'description', label: 'Description', width: 200, value: (img) => na(img.exif.description) },
      { id: 'copyright', label: 'Copyright', width: 180, value: (img) => na(img.exif.copyright) },
      { id: 'author', label: 'Author', width: 140, value: (img) => na(img.exif.artist) },
    ],
  },
  {
    id: 'gps',
    label: 'GPS Data',
    icon: <MapPin className="w-4 h-4" />,
    defaultEnabled: false,
    columns: [
      { id: 'latitude', label: 'Latitude', width: 120, value: (img) => (img.exif.latitude != null ? `${img.exif.latitude.toFixed(6)}°` : '—') },
      { id: 'longitude', label: 'Longitude', width: 120, value: (img) => (img.exif.longitude != null ? `${img.exif.longitude.toFixed(6)}°` : '—') },
      { id: 'altitude', label: 'Altitude', width: 90, align: 'right', value: (img) => (img.exif.gpsAltitude ? `${img.exif.gpsAltitude}m` : '—') },
    ],
  },
  {
    id: 'camera',
    label: 'Camera Settings',
    icon: <Camera className="w-4 h-4" />,
    defaultEnabled: false,
    columns: [
      { id: 'aperture', label: 'Aperture', width: 90, align: 'right', value: (img) => (img.exif.fNumber ? `ƒ/${img.exif.fNumber}` : '—') },
      { id: 'shutter', label: 'Shutter', width: 90, align: 'right', value: (img) => (img.exif.exposureTime ? `${img.exif.exposureTime}s` : '—') },
      { id: 'iso', label: 'ISO', width: 70, align: 'right', value: (img) => na(img.exif.iso) },
      { id: 'focalLength', label: 'Focal Length', width: 100, align: 'right', value: (img) => (img.exif.focalLength ? `${img.exif.focalLength}mm` : '—') },
    ],
  },
];

const cellClasses = (align?: 'right') =>
  `px-3 truncate ${align === 'right' ? 'text-right tabular-nums' : ''}`;

const ImageList: React.FC<Props> = ({ images, selectedImage, onSelect }) => {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showColumnSelector, setShowColumnSelector] = useState(false);

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField]);

  // Memoize sorted images to avoid re-sorting on every render
  const sortedImages = useMemo(() => {
    return [...images].sort((a, b) => {
      const multiplier = sortDirection === 'asc' ? 1 : -1;

      switch (sortField) {
        case 'name':
          return multiplier * a.file.name.localeCompare(b.file.name);
        case 'date': {
          const dateA = a.exif.dateTimeOriginal ? new Date(a.exif.dateTimeOriginal).getTime() : 0;
          const dateB = b.exif.dateTimeOriginal ? new Date(b.exif.dateTimeOriginal).getTime() : 0;
          return multiplier * (dateA - dateB);
        }
        case 'size':
          return multiplier * (a.file.size - b.file.size);
        case 'make': {
          const makeA = (a.exif.make || '') + (a.exif.model || '');
          const makeB = (b.exif.make || '') + (b.exif.model || '');
          return multiplier * makeA.localeCompare(makeB);
        }
        default:
          return 0;
      }
    });
  }, [images, sortField, sortDirection]);

  // Filter out items without images - memoized
  const imagesWithImages = useMemo(() => {
    return sortedImages.filter(image => {
      const isImportedPoint = 'hasImage' in image;
      return isImportedPoint ? image.hasImage : true;
    });
  }, [sortedImages]);

  const [enabledGroups, setEnabledGroups] = useState<string[]>(
    COLUMN_GROUPS.filter(group => group.defaultEnabled).map(group => group.id)
  );

  const toggleGroup = (groupId: string) => {
    setEnabledGroups(prev => {
      if (prev.includes(groupId)) {
        return prev.filter(id => id !== groupId);
      }
      return [...prev, groupId];
    });
  };

  // Active spreadsheet columns come from the enabled groups, in fixed order
  const activeColumns = useMemo(
    () => COLUMN_GROUPS.filter(group => enabledGroups.includes(group.id)).flatMap(group => group.columns),
    [enabledGroups]
  );

  // One shared grid template guarantees header/body alignment. The Name
  // column flexes; everything else is fixed so extra columns scroll
  // horizontally like a spreadsheet.
  const gridTemplateColumns = useMemo(
    () =>
      `${THUMB_WIDTH}px ` +
      activeColumns.map(col => (col.width === 'flex' ? 'minmax(180px, 1fr)' : `${col.width}px`)).join(' '),
    [activeColumns]
  );

  const minTableWidth = useMemo(
    () =>
      THUMB_WIDTH +
      activeColumns.reduce((sum, col) => sum + (col.width === 'flex' ? 180 : col.width), 0),
    [activeColumns]
  );

  // Virtual list setup — fixed row height makes estimates exact
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: imagesWithImages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  });

  const renderCell = (image: ImageData, column: ColumnDef, index: number) => {
    const text = column.value(image);
    return (
      <div
        key={column.id}
        role="gridcell"
        title={text}
        className={`${cellClasses(column.align)} ${
          index > 0 ? 'border-l border-app-gray-light/20' : ''
        } h-full flex items-center`}
      >
        <span className={text === '—' ? 'text-app-accent-dim/50' : 'text-app-white/90'}>{text}</span>
      </div>
    );
  };

  if (imagesWithImages.length === 0) {
    return (
      <div className="glass-panel p-6">
        <div className="text-center">
          <Camera className="w-12 h-12 mx-auto mb-3 text-app-white" />
          <p className="text-app-white">No images available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex justify-between items-center mb-3 flex-none">
        <p className="text-sm text-app-accent-dim">
          {imagesWithImages.length} {imagesWithImages.length === 1 ? 'image' : 'images'}
        </p>
        <div className="relative">
          <button
            onClick={() => setShowColumnSelector(!showColumnSelector)}
            className="flex items-center gap-2 px-3 py-2 rounded bg-app-gray-light/30 hover:bg-app-gray-light/50 transition-colors duration-200"
          >
            <Settings2 className="w-4 h-4 text-app-accent" />
            <span className="text-app-white">Customize Columns</span>
          </button>

          {showColumnSelector && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-app-gray rounded-lg shadow-lg z-30 p-2 border border-app-gray-light/30">
              {COLUMN_GROUPS.map(group => (
                <label
                  key={group.id}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-app-gray-light/30 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={enabledGroups.includes(group.id)}
                    onChange={() => toggleGroup(group.id)}
                    className="hidden"
                  />
                  <div className={`w-4 h-4 border rounded flex items-center justify-center ${
                    enabledGroups.includes(group.id)
                      ? 'bg-app-accent border-app-accent'
                      : 'border-app-accent-dim'
                  }`}>
                    {enabledGroups.includes(group.id) && (
                      <Check className="w-3 h-3 text-app-white" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {group.icon}
                    <span className="text-app-white">{group.label}</span>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Spreadsheet grid: one scroll container holds the sticky header and the
          virtualized rows, so columns stay perfectly aligned while scrolling
          both vertically and horizontally. */}
      <div className="flex-1 overflow-hidden glass-panel">
        <div
          ref={parentRef}
          role="grid"
          aria-label="Image metadata spreadsheet"
          className="h-full overflow-auto"
        >
          <div style={{ minWidth: '100%', width: minTableWidth }}>
            {/* Sticky header row */}
            <div
              role="row"
              className="sticky top-0 z-20 grid bg-app-gray border-b border-app-gray-light/40"
              style={{ gridTemplateColumns, height: HEADER_HEIGHT }}
            >
              <div role="columnheader" className="border-r border-app-gray-light/20" aria-label="Thumbnail" />
              {activeColumns.map(column => {
                const sortable = Boolean(column.sortField);
                const isActiveSort = sortable && sortField === column.sortField;
                return (
                  <div
                    key={column.id}
                    role="columnheader"
                    onClick={() => sortable && handleSort(column.sortField!)}
                    className={`${cellClasses(column.align)} border-l border-app-gray-light/20 h-full flex items-center ${
                      sortable ? 'cursor-pointer select-none hover:bg-app-gray-light/40' : ''
                    }`}
                    aria-sort={isActiveSort ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}
                  >
                    <span className="text-xs font-semibold uppercase tracking-wide text-app-accent-dim flex items-center gap-1">
                      {column.label}
                      {sortable && (
                        <ArrowUpDown className={`w-3 h-3 ${isActiveSort ? 'text-app-white' : 'text-app-accent-dim/50'}`} />
                      )}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Virtualized body */}
            <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
              {virtualizer.getVirtualItems().map(virtualItem => {
                const image = imagesWithImages[virtualItem.index];
                const isSelected = selectedImage?.id === image.id;
                return (
                  <div
                    key={virtualItem.key}
                    role="row"
                    onClick={() => onSelect(image)}
                    className={`grid items-stretch cursor-pointer border-b border-app-gray-light/10 transition-colors duration-150 hover:bg-app-gray-light/30 ${
                      isSelected ? 'bg-app-gray-light/40' : ''
                    }`}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: ROW_HEIGHT,
                      transform: `translateY(${virtualItem.start}px)`,
                      gridTemplateColumns,
                      boxShadow: isSelected ? 'inset 2px 0 0 var(--app-accent-dim)' : undefined,
                    }}
                  >
                    {/* Thumbnail */}
                    <div
                      role="gridcell"
                      className="flex items-center justify-center border-r border-app-gray-light/20"
                    >
                      <div className="w-8 h-8 rounded overflow-hidden border border-app-gray-light/30">
                        <img src={image.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    </div>
                    {activeColumns.map((column, index) => renderCell(image, column, index))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageList;