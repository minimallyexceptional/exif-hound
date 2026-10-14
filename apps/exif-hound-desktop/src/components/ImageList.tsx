import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { ImageData } from '../types';
import { Camera, Clock, MapPin, Info, Settings2, RotateCcw } from 'lucide-react';
import { VirtualDataGrid } from './common/VirtualDataGrid';
import { formatFileSize } from '../utils/formatters';
import { formatShortDateTime } from '../utils/date';
import { ImportedPoint } from '../utils/importData';
import { ProjectImage } from './ProjectImage';
import { formatFileType } from '../utils/formatFileType';

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
  cellClassName?: (image: ImageData) => string;
}

/** A toggleable group of spreadsheet columns (Customize Columns panel). */
interface ColumnGroup {
  id: string;
  label: string;
  icon: React.ReactNode;
  defaultEnabled: boolean;
  columns: ColumnDef[];
}

const THUMB_WIDTH = 56;

const na = (value: string | number | null | undefined): string =>
  value == null || value === '' ? '—' : String(value);

const placeLabel = (image: ImageData): string => {
  const formatted = image.exif.location?.formatted;
  return typeof formatted === 'string' && formatted.trim().length > 0 ? formatted : '—';
};

const COLUMN_GROUPS: ColumnGroup[] = [
  {
    id: 'fileInfo',
    label: 'File Information',
    icon: <Info className="w-4 h-4" />,
    defaultEnabled: true,
    columns: [
      { id: 'name', label: 'Name', width: 'flex', sortField: 'name', value: (img) => img.file.name },
      { id: 'size', label: 'Size', width: 80, align: 'right', sortField: 'size', value: (img) => formatFileSize(img.file.size) },
      { id: 'type', label: 'Type', width: 72, value: (img) => {
        const label = formatFileType(img.file.type);
        return label === 'N/A' ? '—' : label;
      } },
    ],
  },
  {
    id: 'temporal',
    label: 'Temporal Data',
    icon: <Clock className="w-4 h-4" />,
    defaultEnabled: true,
    columns: [
      { id: 'created', label: 'Date Taken', width: 144, sortField: 'date', value: (img) => na(img.exif.dateTimeOriginal ? formatShortDateTime(img.exif.dateTimeOriginal) : null) },
      { id: 'modified', label: 'Modified', width: 144, value: (img) => Number.isFinite(img.file.lastModified) ? formatShortDateTime(new Date(img.file.lastModified).toISOString()) : '—' },
    ],
  },
  {
    id: 'device',
    label: 'Device & Technical Info',
    icon: <Camera className="w-4 h-4" />,
    defaultEnabled: false,
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
    defaultEnabled: false,
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
    defaultEnabled: true,
    columns: [
      {
        id: 'place',
        label: 'Place',
        width: 220,
        value: placeLabel,
        cellClassName: () => 'selectable-value',
      },
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

const DEFAULT_ENABLED_GROUPS = COLUMN_GROUPS
  .filter(group => group.defaultEnabled)
  .map(group => group.id);

const ImageList: React.FC<Props> = ({ images, selectedImage, onSelect }) => {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const columnSelectorRef = useRef<HTMLDivElement>(null);
  const columnToggleRef = useRef<HTMLButtonElement>(null);

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
          const dateA = a.exif.dateTimeOriginal ? new Date(a.exif.dateTimeOriginal).getTime() : Number.NaN;
          const dateB = b.exif.dateTimeOriginal ? new Date(b.exif.dateTimeOriginal).getTime() : Number.NaN;
          const validDateA = Number.isFinite(dateA);
          const validDateB = Number.isFinite(dateB);
          if (!validDateA && validDateB) return 1;
          if (validDateA && !validDateB) return -1;
          if (!validDateA || !validDateB) return 0;
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
      return isImportedPoint ? (image.hasImage || !!image.pendingRemoteUrl) : true;
    });
  }, [sortedImages]);

  const [enabledGroups, setEnabledGroups] = useState<string[]>(DEFAULT_ENABLED_GROUPS);

  useEffect(() => {
    if (!showColumnSelector) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!columnSelectorRef.current?.contains(event.target as Node) && !columnToggleRef.current?.contains(event.target as Node)) {
        setShowColumnSelector(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowColumnSelector(false);
        columnToggleRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showColumnSelector]);

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

  const gridColumns = useMemo(
    () => activeColumns.map((column) => ({
      id: column.id,
      label: column.label,
      width: column.width,
      align: column.align,
      sortField: column.sortField,
      value: column.value,
      cellClassName: column.cellClassName,
    })),
    [activeColumns],
  );

  if (imagesWithImages.length === 0) {
    return (
      <div className="h-full min-h-0 flex flex-col items-center justify-center text-center px-6">
        <Camera className="w-10 h-10 mb-3 text-app-accent-dim" aria-hidden="true" />
        <h3 className="text-base font-medium text-app-white">No images to show</h3>
        <p className="mt-1 max-w-sm text-sm text-app-accent-dim">Add image files to see their metadata in this list.</p>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 min-w-0 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex-none flex flex-wrap items-center justify-between gap-3 px-3 sm:px-4 py-3 border-b border-app-gray-light/30">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-sm font-medium text-app-white tabular-nums">{imagesWithImages.length.toLocaleString()}</span>
          <span className="text-sm text-app-accent-dim">{imagesWithImages.length === 1 ? 'image' : 'images'}</span>
          {selectedImage && imagesWithImages.some(image => image.id === selectedImage.id) && (
            <span className="ml-1 border-l border-app-gray-light/50 pl-3 text-xs text-app-accent-dim">1 selected</span>
          )}
        </div>
        <div className="relative" ref={columnSelectorRef}>
          <button
            ref={columnToggleRef}
            type="button"
            onClick={() => setShowColumnSelector(open => !open)}
            aria-label="Customize visible columns"
            aria-expanded={showColumnSelector}
            aria-controls="image-list-columns"
            className="min-h-10 flex items-center gap-2 rounded-lg border border-app-gray-light/50 bg-app-gray-light/20 px-3 py-2 text-sm text-app-white transition-colors duration-200 hover:bg-app-gray-light/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
          >
            <Settings2 className="w-4 h-4 text-app-accent-dim" aria-hidden="true" />
            <span>Columns</span>
          </button>

          {showColumnSelector && (
            <div id="image-list-columns" className="absolute right-0 top-full z-30 mt-2 max-h-[calc(100dvh-8rem)] w-[min(18rem,calc(100vw-2rem))] overflow-y-auto rounded-lg border border-app-gray-light/50 bg-app-gray p-3 shadow-xl" role="group" aria-label="Visible column groups">
              <div className="mb-2 flex items-center justify-between gap-3 border-b border-app-gray-light/30 pb-2">
                <div>
                  <h3 className="text-sm font-medium text-app-white">Visible columns</h3>
                  <p className="mt-0.5 text-xs text-app-accent-dim">Choose which data groups appear.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEnabledGroups(DEFAULT_ENABLED_GROUPS)}
                  className="flex min-h-9 shrink-0 items-center gap-1.5 rounded-md px-2 text-xs text-app-accent-dim transition-colors hover:bg-app-gray-light/40 hover:text-app-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-app-accent"
                  aria-label="Reset columns to defaults"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  Reset
                </button>
              </div>
              <div className="max-h-[min(60vh,24rem)] space-y-0.5 overflow-y-auto">
                {COLUMN_GROUPS.map(group => (
                  <label
                    key={group.id}
                    className="flex min-h-10 cursor-pointer items-center gap-3 rounded-md px-2 hover:bg-app-gray-light/30 focus-within:bg-app-gray-light/30"
                  >
                    <input
                      type="checkbox"
                      checked={enabledGroups.includes(group.id)}
                      onChange={() => toggleGroup(group.id)}
                      className="h-4 w-4 accent-app-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
                    />
                    <span className="flex items-center gap-2 text-sm text-app-white">
                      {group.icon}
                      {group.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <VirtualDataGrid
        rows={imagesWithImages}
        columns={gridColumns}
        ariaLabel="Image metadata spreadsheet"
        getRowKey={(row) => row.id}
        leadColumnWidth={THUMB_WIDTH}
        renderLeadCell={(image) => (
          <div className="w-8 h-8 rounded overflow-hidden border border-app-gray-light/30">
            <ProjectImage
              image={image}
              alt=""
              className="w-full h-full"
              imgClassName="w-full h-full object-cover"
            />
          </div>
        )}
        onRowClick={onSelect}
        selectedRowKey={selectedImage?.id ?? null}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={(field) => handleSort(field as SortField)}
      />
    </div>
  );
};

export default ImageList;
