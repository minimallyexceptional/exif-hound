import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { ImageData } from '../../../../types';
import { fixCoordinates } from '../../../../utils/diagnostics';

interface ImageMarkerProps {
  image: ImageData;
  onClick: () => void;
}

export const ImageMarker: React.FC<ImageMarkerProps> = ({ image, onClick }) => {
  const coords = fixCoordinates(image.exif.latitude ?? null, image.exif.longitude ?? null);
  if (!coords) return null;

  const icon = L.divIcon({
    className: 'custom-marker',
    html: `<svg width="32" height="32" viewBox="0 0 492 492" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="246" cy="246" r="234.666" fill="#111111" stroke="white" stroke-width="22.6677"/>
      <path d="M272.942 159.789H219.06L192.119 192.118H159.789C154.073 192.118 148.591 194.389 144.549 198.431C140.507 202.473 138.236 207.955 138.236 213.671V310.659C138.236 316.375 140.507 321.857 144.549 325.899C148.591 329.941 154.073 332.212 159.789 332.212H332.212C337.928 332.212 343.41 329.941 347.452 325.899C351.494 321.857 353.765 316.375 353.765 310.659V213.671C353.765 207.955 351.494 202.473 347.452 198.431C343.41 194.389 337.928 192.118 332.212 192.118H299.883L272.942 159.789Z" stroke="white" stroke-width="21.5529" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M245.999 289.106C263.854 289.106 278.329 274.632 278.329 256.777C278.329 238.922 263.854 224.447 245.999 224.447C228.144 224.447 213.67 238.922 213.67 256.777C213.67 274.632 228.144 289.106 245.999 289.106Z" stroke="white" stroke-width="21.5529" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    iconSize: [32, 32] as L.PointExpression,
    iconAnchor: [16, 16] as L.PointExpression
  });

  // We know coords is not null at this point
  const [lat, lon] = coords as [number, number];

  return (
    <Marker
      position={coords as L.LatLngExpression}
      icon={icon}
      eventHandlers={{
        click: onClick
      }}
    >
      <Popup className="map-popup">
        <div className="overflow-hidden bg-white dark:bg-[#111111]">
          <div className="relative">
            <img 
              src={URL.createObjectURL(image.file)} 
              alt={image.file.name}
              className="w-full h-auto"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
          </div>
          <div className="p-4 border-t border-gray-200 dark:border-gray-600/20">
            <p className="font-medium text-sm text-gray-900 dark:text-white mb-2">
              {image.file.name}
            </p>
            {image.exif.dateTimeOriginal && (
              <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">
                {new Date(image.exif.dateTimeOriginal).toLocaleString()}
              </p>
            )}
            <div className="text-xs space-y-1.5">
              <p className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">Latitude:</span>
                <span className="font-medium text-gray-900 dark:text-white">{lat.toFixed(6)}</span>
              </p>
              <p className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">Longitude:</span>
                <span className="font-medium text-gray-900 dark:text-white">{lon.toFixed(6)}</span>
              </p>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}; 