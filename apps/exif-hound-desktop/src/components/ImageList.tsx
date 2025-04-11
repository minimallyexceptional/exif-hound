import React, { useState } from 'react';
import { ImageData } from '../types';
import { ArrowUpDown, Camera, Calendar, MapPin, Clock, Info, Shield, Settings2, Check } from 'lucide-react';
import { formatFileSize } from '../utils/formatters';
import { formatShortDateTime } from '../utils/date';
import { ImportedPoint } from '../utils/importData';

interface Props {
  images: (ImageData | ImportedPoint)[];
  selectedImage: ImageData | null;
  onSelect: (image: ImageData) => void;
}

interface ColumnConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  defaultEnabled: boolean;
  sortField?: SortField;
  render: (image: ImageData) => React.ReactNode;
}

type SortField = 'name' | 'date' | 'size' | 'make';
type SortDirection = 'asc' | 'desc';

const ImageList: React.FC<Props> = ({ images, selectedImage, onSelect }) => {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const [showColumnSelector, setShowColumnSelector] = useState(false);
  
  const columnConfigs: ColumnConfig[] = [
    {
      id: 'fileInfo',
      label: 'File Information',
      icon: <Info className="w-4 h-4" />,
      defaultEnabled: true,
      sortField: 'name',
      render: (image) => (
        <>
          <div className="font-medium text-app-white mb-1">
            {image.file.name}
          </div>
          <div className="text-sm text-app-accent-dim">
            {formatFileSize(image.file.size)} • {image.file.type.split('/')[1].toUpperCase()}
          </div>
          {formatLocation(image)}
        </>
      )
    },
    {
      id: 'temporal',
      label: 'Temporal Data',
      icon: <Shield className="w-4 h-4" />,
      defaultEnabled: true,
      sortField: 'date',
      render: (image) => formatTimestamps(image)
    },
    {
      id: 'device',
      label: 'Device & Technical Info',
      icon: <Camera className="w-4 h-4" />,
      defaultEnabled: true,
      sortField: 'make',
      render: (image) => (
        <>
          <div className="text-app-white mb-1">
            {formatDeviceInfo(image)}
          </div>
          <div className="text-sm text-app-accent-dim">
            {formatTechnicalInfo(image)}
          </div>
        </>
      )
    },
    {
      id: 'metadata',
      label: 'Metadata',
      icon: <Info className="w-4 h-4" />,
      defaultEnabled: true,
      render: (image) => (
        <div className="text-sm text-app-accent-dim">
          {image.exif.description && (
            <div className="mb-1">{image.exif.description}</div>
          )}
          {image.exif.copyright && (
            <div className="mb-1">© {image.exif.copyright}</div>
          )}
          {image.exif.artist && (
            <div>Author: {image.exif.artist}</div>
          )}
        </div>
      )
    },
    {
      id: 'gps',
      label: 'GPS Data',
      icon: <MapPin className="w-4 h-4" />,
      defaultEnabled: false,
      render: (image) => (
        <div className="text-app-white">
          {image.exif.latitude != null && image.exif.longitude != null ? (
            <>
              <div>Lat: {image.exif.latitude.toFixed(6)}°</div>
              <div>Long: {image.exif.longitude.toFixed(6)}°</div>
              {image.exif.gpsAltitude && (
                <div>Alt: {image.exif.gpsAltitude}m</div>
              )}
            </>
          ) : (
            <span className="text-app-accent-dim">No GPS data</span>
          )}
        </div>
      )
    },
    {
      id: 'camera',
      label: 'Camera Settings',
      icon: <Camera className="w-4 h-4" />,
      defaultEnabled: false,
      render: (image) => (
        <div className="text-app-white">
          {image.exif.fNumber && <div>Aperture: ƒ/{image.exif.fNumber}</div>}
          {image.exif.exposureTime && <div>Shutter: {image.exif.exposureTime}s</div>}
          {image.exif.iso && <div>ISO: {image.exif.iso}</div>}
          {image.exif.focalLength && <div>Focal Length: {image.exif.focalLength}mm</div>}
          {!image.exif.fNumber && !image.exif.exposureTime && !image.exif.iso && (
            <span className="text-app-accent-dim">No camera settings</span>
          )}
        </div>
      )
    }
  ];

  const [enabledColumns, setEnabledColumns] = useState<string[]>(
    columnConfigs.filter(col => col.defaultEnabled).map(col => col.id)
  );

  const toggleColumn = (columnId: string) => {
    setEnabledColumns(prev => {
      if (prev.includes(columnId)) {
        return prev.filter(id => id !== columnId);
      }
      return [...prev, columnId];
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedImages = [...images].sort((a, b) => {
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

  const formatTimestamps = (image: ImageData) => {
    const created = image.exif.dateTimeOriginal;
    const modified = new Date(image.file.lastModified).toISOString();
    const timestamps = [];

    if (created) {
      timestamps.push(
        <div key="created" className="flex items-center gap-1">
          <Clock className="w-4 h-4 text-app-accent" />
          <span className="text-app-white">Created: {formatShortDateTime(created)}</span>
        </div>
      );
    }

    if (modified) {
      timestamps.push(
        <div key="modified" className="flex items-center gap-1">
          <Calendar className="w-4 h-4 text-app-accent" />
          <span className="text-app-accent-dim">Modified: {formatShortDateTime(modified)}</span>
        </div>
      );
    }

    return timestamps;
  };

  const formatDeviceInfo = (image: ImageData) => {
    const parts = [];
    if (image.exif.make || image.exif.model) {
      parts.push(`${image.exif.make || ''} ${image.exif.model || ''}`.trim());
    }
    if (image.exif.software) {
      parts.push(`Software: ${image.exif.software}`);
    }
    if (image.exif.lensModel) {
      parts.push(`Lens: ${image.exif.lensModel}`);
    }
    return parts.length > 0 ? parts.join(' • ') : 'No device info';
  };

  const formatLocation = (image: ImageData) => {
    if (image.exif.latitude != null && image.exif.longitude != null) {
      const altitude = image.exif.gpsAltitude ? ` • Alt: ${image.exif.gpsAltitude}m` : '';
      return (
        <div className="flex items-center gap-1 text-app-white">
          <MapPin className="w-4 h-4 text-app-accent" />
          <span>{image.exif.latitude.toFixed(6)}°, {image.exif.longitude.toFixed(6)}°{altitude}</span>
        </div>
      );
    }
    return null;
  };

  const formatTechnicalInfo = (image: ImageData) => {
    const info = [];
    
    // Image dimensions
    if (image.exif.imageWidth && image.exif.imageHeight) {
      info.push(`${image.exif.imageWidth}×${image.exif.imageHeight}`);
    }
    
    // Camera settings
    const settings = [];
    if (image.exif.fNumber) settings.push(`ƒ/${image.exif.fNumber}`);
    if (image.exif.exposureTime) settings.push(`${image.exif.exposureTime}s`);
    if (image.exif.iso) settings.push(`ISO ${image.exif.iso}`);
    if (settings.length > 0) info.push(settings.join(' '));
    
    return info.length > 0 ? info.join(' • ') : 'No technical data';
  };

  // Filter out items without images
  const imagesWithImages = images.filter(image => {
    const isImportedPoint = 'hasImage' in image;
    return isImportedPoint ? image.hasImage : true;
  });

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

  const activeColumns = columnConfigs.filter(col => enabledColumns.includes(col.id));

  return (
    <div className="overflow-hidden">
      <div className="flex justify-end mb-4">
        <div className="relative">
          <button
            onClick={() => setShowColumnSelector(!showColumnSelector)}
            className="flex items-center gap-2 px-3 py-2 rounded bg-app-gray-light/30 hover:bg-app-gray-light/50 transition-colors duration-200"
          >
            <Settings2 className="w-4 h-4 text-app-accent" />
            <span className="text-app-white">Customize Columns</span>
          </button>
          
          {showColumnSelector && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-app-gray rounded-lg shadow-lg z-10 p-2">
              {columnConfigs.map(column => (
                <label
                  key={column.id}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-app-gray-light/30 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={enabledColumns.includes(column.id)}
                    onChange={() => toggleColumn(column.id)}
                    className="hidden"
                  />
                  <div className={`w-4 h-4 border rounded flex items-center justify-center ${
                    enabledColumns.includes(column.id)
                      ? 'bg-app-accent border-app-accent'
                      : 'border-app-accent-dim'
                  }`}>
                    {enabledColumns.includes(column.id) && (
                      <Check className="w-3 h-3 text-app-white" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {column.icon}
                    <span className="text-app-white">{column.label}</span>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-app-gray/50">
            <tr>
              <th className="w-16 px-4 py-2"></th>
              {activeColumns.map(column => (
                <th 
                  key={column.id} 
                  className={`px-4 py-2 text-left ${column.sortField ? 'cursor-pointer hover:bg-app-gray-light/50' : ''}`}
                  onClick={() => column.sortField && handleSort(column.sortField)}
                >
                  <div className="flex items-center space-x-1">
                    {column.icon}
                    <span className="text-app-white font-medium">{column.label}</span>
                    {column.sortField && (
                      <ArrowUpDown className={`w-4 h-4 ${
                        sortField === column.sortField 
                          ? 'text-app-white' 
                          : 'text-app-accent-dim'
                      }`} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedImages.filter(image => {
              const isImportedPoint = 'hasImage' in image;
              return isImportedPoint ? image.hasImage : true;
            }).map((image) => (
              <tr
                key={image.id}
                onClick={() => onSelect(image)}
                className={`hover:bg-app-gray-light/30 cursor-pointer transition-colors duration-200 ${
                  selectedImage?.id === image.id ? 'bg-app-gray-light/20' : ''
                }`}
              >
                <td className="px-4 py-3">
                  <div className="relative w-12 h-12 rounded overflow-hidden border border-app-gray-light/30">
                    <img src={image.url} alt="" className="w-full h-full object-cover" />
                  </div>
                </td>
                {activeColumns.map(column => (
                  <td key={column.id} className="px-4 py-3">
                    {column.render(image)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ImageList;