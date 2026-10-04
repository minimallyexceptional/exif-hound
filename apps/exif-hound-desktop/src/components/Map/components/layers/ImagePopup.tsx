import React, { memo } from 'react';
import { Popup } from 'react-leaflet';
import { ImageData } from '../../../../types';
import { formatDateTime } from '../../../../utils/date';

interface ImagePopupProps {
  image: ImageData;
}

const ImagePopupComponent: React.FC<ImagePopupProps> = ({ image }) => {
  return (
    <Popup className="map-popup">
      <div className="text-app-white">
        <div className="relative aspect-video w-full overflow-hidden">
          <img 
            src={image.url} 
            alt={image.file.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-3 space-y-2">
          <p className="font-medium truncate selectable-value" title={image.file.name}>
            {image.file.name}
          </p>
          <p className="text-app-accent-dim text-sm selectable-value">
            {formatDateTime(image.exif.dateTimeOriginal ?? '')}
          </p>
          <div className="text-xs text-app-accent-dim selectable-value">
            <p>Lat: {image.exif.latitude?.toFixed(6)}</p>
            <p>Lon: {image.exif.longitude?.toFixed(6)}</p>
          </div>
        </div>
      </div>
    </Popup>
  );
};

// Export memoized component to prevent unnecessary re-renders
export const ImagePopup = memo(ImagePopupComponent);
