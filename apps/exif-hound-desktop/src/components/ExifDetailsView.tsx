import React from 'react';
import { ImageData } from '../types';
import { ImageIcon, Images, FileText, MapPin, Clock, Camera } from 'lucide-react';
import { Button } from './common/Button';
import { formatDateTime } from '../utils/date';
import { formatShortLocation } from '../utils/geocoding';

interface Props {
  image: ImageData;
  onViewFullExif: () => void;
  onShowComparison: (image: ImageData) => void;
}

export function ExifDetailsView({ image, onViewFullExif, onShowComparison }: Props) {
  const { exif } = image;

  const hasValidCoordinates = typeof exif.latitude === 'number' && typeof exif.longitude === 'number';

  const formatCoordinates = () => {
    if (!hasValidCoordinates) {
      return 'No location data available';
    }
    return `${(exif.latitude as number).toFixed(6)}, ${(exif.longitude as number).toFixed(6)}`;
  };

  return (
    <div className="h-full flex flex-col bg-app-gray">
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 border-b border-app-gray-light/30">
          <div className="flex gap-4">
            <div className="flex-none w-32 h-32">
              <div className="relative w-full h-full rounded-lg overflow-hidden border border-app-gray-light/30">
                <img 
                  src={image.url} 
                  alt="Selected" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-app-white flex items-center gap-2 mb-2">
                <ImageIcon className="w-4 h-4 text-app-accent" />
                <span className="truncate">{image.file.name}</span>
              </h3>
              <div className="space-y-2">
                <Button
                  variant="secondary"
                  onClick={() => onShowComparison(image)}
                  className="w-full flex items-center justify-center gap-2 py-1.5"
                  icon={<Images className="w-4 h-4" />}
                >
                  Compare with EXIF Thumbnail
                </Button>
                <Button
                  variant="secondary"
                  onClick={onViewFullExif}
                  className="w-full flex items-center justify-center gap-2 py-1.5"
                  icon={<FileText className="w-4 h-4" />}
                >
                  View All EXIF Data
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-4 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-app-white">
              <MapPin className="w-5 h-5 text-app-accent" />
              <h3 className="font-medium">Location</h3>
            </div>
            {exif.location && !exif.location.loading ? (
              <div className="pl-7 space-y-1">
                <p className="text-app-accent">{formatShortLocation(exif.location)}</p>
                <p className={`text-xs ${hasValidCoordinates ? 'text-app-accent-dim' : 'text-app-accent-dim'}`}>
                  {formatCoordinates()}
                </p>
              </div>
            ) : exif.location?.loading ? (
              <div className="pl-7">
                <p className="text-app-accent-dim">Loading location data...</p>
                <p className={`text-xs ${hasValidCoordinates ? 'text-app-accent-dim' : 'text-app-accent-dim'}`}>
                  {formatCoordinates()}
                </p>
              </div>
            ) : (
              <p className={`pl-7 ${hasValidCoordinates ? 'text-app-accent' : 'text-app-accent-dim'}`}>
                {formatCoordinates()}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-app-white">
              <Clock className="w-5 h-5 text-app-accent" />
              <h3 className="font-medium">Date Taken</h3>
            </div>
            <p className="text-app-accent pl-7">
              {exif.dateTimeOriginal ? formatDateTime(exif.dateTimeOriginal) : 'Not available'}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-app-white">
              <Camera className="w-5 h-5 text-app-accent" />
              <h3 className="font-medium">Camera Details</h3>
            </div>
            <div className="pl-7">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-3">
                  <div>
                    <div className="text-app-accent-dim mb-1">Make</div>
                    <div className="text-app-accent font-medium">{exif.make || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-app-accent-dim mb-1">Model</div>
                    <div className="text-app-accent font-medium">{exif.model || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-app-accent-dim mb-1">Exposure Time</div>
                    <div className="text-app-accent font-medium">{exif.exposureTime || 'N/A'}</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="text-app-accent-dim mb-1">F-Number</div>
                    <div className="text-app-accent font-medium">{exif.fNumber || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-app-accent-dim mb-1">ISO</div>
                    <div className="text-app-accent font-medium">{exif.iso || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-app-accent-dim mb-1">Focal Length</div>
                    <div className="text-app-accent font-medium">
                      {exif.focalLength ? `${exif.focalLength}mm` : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-app-white">
              <FileText className="w-5 h-5 text-app-accent" />
              <h3 className="font-medium">File Details</h3>
            </div>
            <div className="pl-7">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-app-accent-dim mb-1">Size</div>
                  <div className="text-app-accent font-medium">
                    {(image.file.size / 1024).toFixed(1)} KB
                  </div>
                </div>
                <div>
                  <div className="text-app-accent-dim mb-1">Type</div>
                  <div className="text-app-accent font-medium">
                    {image.file.type.split('/')[1].toUpperCase()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 