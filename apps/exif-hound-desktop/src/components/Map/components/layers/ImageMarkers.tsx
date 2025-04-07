import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import { ImageData } from '../../../../types';
import { formatShortDateTime } from '../../../../utils/date';
import { formatShortLocation } from '../../../../utils/geocoding';
import { fixCoordinates, isWesternHemisphere } from '../../../../utils/diagnostics';
import * as geolib from 'geolib';

// Create custom camera icon
const cameraIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
  <svg width="492" height="492" viewBox="0 0 492 492" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="246" cy="246" r="234.666" fill="#111111" stroke="white" stroke-width="22.6677"/>
    <path d="M272.942 159.789H219.06L192.119 192.118H159.789C154.073 192.118 148.591 194.389 144.549 198.431C140.507 202.473 138.236 207.955 138.236 213.671V310.659C138.236 316.375 140.507 321.857 144.549 325.899C148.591 329.941 154.073 332.212 159.789 332.212H332.212C337.928 332.212 343.41 329.941 347.452 325.899C351.494 321.857 353.765 316.375 353.765 310.659V213.671C353.765 207.955 351.494 202.473 347.452 198.431C343.41 194.389 337.928 192.118 332.212 192.118H299.883L272.942 159.789Z" stroke="white" stroke-width="21.5529" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M245.999 289.106C263.854 289.106 278.329 274.632 278.329 256.777C278.329 238.922 263.854 224.447 245.999 224.447C228.144 224.447 213.67 238.922 213.67 256.777C213.67 274.632 228.144 289.106 245.999 289.106Z" stroke="white" stroke-width="21.5529" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

// Highlighted camera icon (larger size)
const highlightedCameraIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
  <svg width="492" height="492" viewBox="0 0 492 492" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="246" cy="246" r="234.666" fill="white" stroke="black" stroke-width="22.6677"/>
    <path d="M272.942 159.789H219.06L192.119 192.118H159.789C154.073 192.118 148.591 194.389 144.549 198.431C140.507 202.473 138.236 207.955 138.236 213.671V310.659C138.236 316.375 140.507 321.857 144.549 325.899C148.591 329.941 154.073 332.212 159.789 332.212H332.212C337.928 332.212 343.41 329.941 347.452 325.899C351.494 321.857 353.765 316.375 353.765 310.659V213.671C353.765 207.955 351.494 202.473 347.452 198.431C343.41 194.389 337.928 192.118 332.212 192.118H299.883L272.942 159.789Z" stroke="black" stroke-width="21.5529" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M245.999 289.106C263.854 289.106 278.329 274.632 278.329 256.777C278.329 238.922 263.854 224.447 245.999 224.447C228.144 224.447 213.67 238.922 213.67 256.777C213.67 274.632 228.144 289.106 245.999 289.106Z" stroke="black" stroke-width="21.5529" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
  `),
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

interface ImageMarkersProps {
  images: ImageData[];
  selectedImage: ImageData | null;
  onSelectImage: (image: ImageData) => void;
}

export const ImageMarkers: React.FC<ImageMarkersProps> = ({ images, selectedImage, onSelectImage }) => {
  return (
    <>
      {images.map((image) => {
        const origLat = image.exif.latitude!;
        const origLng = image.exif.longitude!;
        
        const [lat, lng] = fixCoordinates(origLat, origLng) as [number, number];
        
        const isValid = geolib.isValidCoordinate({ 
          latitude: lat, 
          longitude: lng 
        });

        return (
          <Marker
            key={image.id}
            position={[lat, lng]}
            icon={image.id === selectedImage?.id ? highlightedCameraIcon : cameraIcon}
            eventHandlers={{
              click: () => onSelectImage(image)
            }}
            zIndexOffset={1000} // Ensure markers are always on top
          >
            <Popup>
              <div className="p-2">
                <img 
                  src={image.url} 
                  alt="Location" 
                  className="w-32 h-32 object-cover rounded mb-2"
                />
                <div className="text-sm">
                  <p><strong>Date:</strong> {image.exif.dateTimeOriginal ? formatShortDateTime(image.exif.dateTimeOriginal) : 'Not available'}</p>
                  <p><strong>Camera:</strong> {image.exif.make || 'Unknown'} {image.exif.model || ''}</p>
                  <div className="mt-1">
                    <p className="font-semibold">Location</p>
                    {image.exif.location && !image.exif.location.loading ? (
                      <p className="text-xs">{formatShortLocation(image.exif.location)}</p>
                    ) : image.exif.location?.loading ? (
                      <p className="text-xs text-gray-600">Loading location data...</p>
                    ) : null}
                    <p className="text-xs text-gray-600">Decimal: {lat.toFixed(6)}, {lng.toFixed(6)}</p>
                    <p className="text-xs text-gray-600">DMS: {geolib.decimalToSexagesimal(lat)}, {geolib.decimalToSexagesimal(lng)}</p>
                    <p className="text-xs text-gray-600">Hemisphere: {lat >= 0 ? 'N' : 'S'}, {lng >= 0 ? 'E' : 'W'}</p>
                  </div>
                  {isWesternHemisphere(lat, lng) && lng > 0 && (
                    <p className="text-red-500 mt-1 text-xs">
                      Warning: Western hemisphere longitude should be negative!
                    </p>
                  )}
                  {!isValid && (
                    <p className="text-red-500 mt-1 text-xs">
                      Warning: These coordinates may not be valid!
                    </p>
                  )}
                  {image.exif.error && (
                    <p className="text-red-500 mt-1">{image.exif.error}</p>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}; 