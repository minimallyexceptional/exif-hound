import React, { useState } from 'react';
import { ImageData } from '../types';
import { ArrowUpDown, Camera, FileQuestion } from 'lucide-react';
import { formatFileSize, formatDate } from '../utils/formatters';

interface Props {
  images: ImageData[];
  selectedImage: ImageData | null;
  onSelect: (image: ImageData) => void;
}

type SortField = 'name' | 'date' | 'size' | 'dimensions' | 'make';
type SortDirection = 'asc' | 'desc';

const ImageList: React.FC<Props> = ({ images, selectedImage, onSelect }) => {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

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
      case 'date':
        const dateA = a.exif.dateTimeOriginal ? new Date(a.exif.dateTimeOriginal).getTime() : 0;
        const dateB = b.exif.dateTimeOriginal ? new Date(b.exif.dateTimeOriginal).getTime() : 0;
        return multiplier * (dateA - dateB);
      case 'size':
        return multiplier * (a.file.size - b.file.size);
      case 'make':
        const makeA = (a.exif.make || '') + (a.exif.model || '');
        const makeB = (b.exif.make || '') + (b.exif.model || '');
        return multiplier * makeA.localeCompare(makeB);
      default:
        return 0;
    }
  });

  const SortHeader: React.FC<{ field: SortField; label: string }> = ({ field, label }) => (
    <th 
      className="px-4 py-2 text-left cursor-pointer hover:bg-app-gray-light/50 transition-colors duration-200"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span className="text-app-white font-medium">{label}</span>
        <ArrowUpDown className={`w-4 h-4 ${
          sortField === field 
            ? 'text-app-white' 
            : 'text-app-accent-dim'
        }`} />
      </div>
    </th>
  );

  if (images.length === 0) {
    return (
      <div className="glass-panel p-6">
        <div className="text-center">
          <Camera className="w-12 h-12 mx-auto mb-3 text-app-white" />
          <p className="text-app-white">No images uploaded yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-app-gray/50">
            <tr>
              <th className="w-16 px-4 py-2"></th>
              <SortHeader field="name" label="File" />
              <SortHeader field="date" label="Date" />
              <th className="px-4 py-2 text-left text-app-white font-medium">Dimensions</th>
              <SortHeader field="make" label="Camera" />
              <th className="px-4 py-2 text-left text-app-white font-medium">Exposure</th>
              <th className="px-4 py-2 text-left text-app-white font-medium">Location</th>
              <SortHeader field="size" label="Size" />
              <th className="px-4 py-2 text-left text-app-white font-medium">Format</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-app-gray-light/30">
            {sortedImages.map((image) => {
              const isSelected = selectedImage?.id === image.id;
              const hasLocation = image.exif.latitude != null && image.exif.longitude != null;
              
              return (
                <tr
                  key={image.id}
                  onClick={() => onSelect(image)}
                  className={`hover:bg-app-gray-light/30 cursor-pointer transition-colors duration-200 ${
                    isSelected 
                      ? 'bg-app-gray-light/20' 
                      : ''
                  }`}
                >
                  <td className="px-4 py-2">
                    <div className="relative w-12 h-12 rounded overflow-hidden border border-app-gray-light/30">
                      <img
                        src={image.url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="font-medium text-app-white">
                      {image.file.name}
                    </div>
                    <div className="text-sm text-app-accent-dim">
                      {image.file.type}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="text-sm text-app-white">
                      {image.exif.dateTimeOriginal ? (
                        formatDate(new Date(image.exif.dateTimeOriginal))
                      ) : (
                        <span className="text-app-accent-dim">Not available</span>
                      )}
                    </div>
                    <div className="text-sm text-app-accent-dim">
                      Modified: {formatDate(new Date(image.file.lastModified))}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-sm">
                    <div className="flex items-center space-x-1 text-app-accent-dim">
                      <FileQuestion className="w-4 h-4" />
                      <span>Not available</span>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="text-sm text-app-white">
                      {image.exif.make || <span className="text-app-accent-dim">Unknown make</span>}
                    </div>
                    <div className="text-sm text-app-accent-dim">
                      {image.exif.model || <span>Unknown model</span>}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="text-sm space-y-1 text-app-white">
                      <div>ƒ/{image.exif.fNumber || '—'}</div>
                      <div>{image.exif.exposureTime || '—'} sec</div>
                      <div>ISO {image.exif.iso || '—'}</div>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-sm">
                    {hasLocation ? (
                      <div className="text-app-white">
                        <div>{image.exif.latitude?.toFixed(6)}°</div>
                        <div>{image.exif.longitude?.toFixed(6)}°</div>
                      </div>
                    ) : (
                      <span className="text-app-accent-dim">No location data</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-sm text-app-white">
                    {formatFileSize(image.file.size)}
                  </td>
                  <td className="px-4 py-2 text-sm text-app-white">
                    {image.file.type.split('/')[1].toUpperCase()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ImageList;